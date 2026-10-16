import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-robo-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const responder = (status: number, corpo: Record<string, unknown>) =>
  new Response(JSON.stringify(corpo), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const erro = (status: number, codigo: string, mensagem: string) => responder(status, { ok: false, codigo, mensagem });
const log = (mensagem: string) => console.error(`[capturar-djen] ${mensagem}`);
const forte = (corpo: Record<string, unknown>) => [corpo.tribunal, corpo.texto, corpo.nomeParte, corpo.nomeAdvogado, corpo.oab_numero, corpo.numeroProcesso].some((valor) => typeof valor === "string" && valor.trim());
const dataValida = (valor: string) => /^\d{4}-\d{2}-\d{2}$/.test(valor) && !Number.isNaN(Date.parse(`${valor}T00:00:00Z`)) && new Date(`${valor}T00:00:00Z`).toISOString().slice(0, 10) === valor;
const atraso = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type Status = "ocioso" | "consultando" | "parcial" | "concluido" | "sem_novidades" | "falha";
type Resultado = { status: Status; recebidas: number; novas: number; duplicadas: number; parcial: boolean; paginas: number; mensagem: string; executado_em: string };
type Publicacao = Record<string, unknown> & { id: number; hash?: string; data_disponibilizacao?: string; datadisponibilizacao?: string };

function dataSaoPaulo(agora = new Date()) {
  const deslocada = new Date(agora.getTime() - 3 * 60 * 60 * 1000);
  return { dia: deslocada.toISOString().slice(0, 10), hora: deslocada.toISOString().slice(11, 16) };
}

function deslocarDia(dia: string, delta: number) {
  const data = new Date(`${dia}T00:00:00Z`);
  data.setUTCDate(data.getUTCDate() + delta);
  return data.toISOString().slice(0, 10);
}

function numeroCabecalho(valor: string | null) {
  if (!valor) return null;
  const numero = Number(valor);
  return Number.isFinite(numero) ? Math.trunc(numero) : null;
}

function linhaPublicacao(item: Publicacao, capturaId: string, oab: string) {
  const data = item.data_disponibilizacao ?? item.datadisponibilizacao;
  const dataFormatada = typeof data === "string" ? data.slice(0, 10) : "";
  return {
    djen_id: item.id,
    djen_hash: typeof item.hash === "string" ? item.hash : null,
    payload_json: item,
    captura_id: capturaId,
    oab_consultada: oab,
    data_disponibilizacao: dataValida(dataFormatada) ? dataFormatada : null,
    sigla_tribunal: item.siglaTribunal ?? null,
    nome_orgao: item.nomeOrgao ?? null,
    tipo_comunicacao: item.tipoComunicacao ?? null,
    tipo_documento: item.tipoDocumento ?? null,
    nome_classe: item.nomeClasse ?? null,
    numero_processo: item.numero_processo ?? item.numeroprocessocommascara ?? null,
    meio: item.meio ?? null,
    link: item.link ?? null,
    texto: item.texto ?? null,
  };
}

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (request.method !== "POST") return erro(400, "metodo_invalido", "Método não permitido.");

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceRoleKey) {
    log("Configuração do Supabase ausente.");
    return erro(500, "erro_interno", "Não foi possível concluir a captura.");
  }
  const admin = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const roboToken = request.headers.get("x-robo-token");
  let origem: "manual" | "cron" = "manual";
  let disparadaPor: string | null = null;
  if (roboToken !== null) {
    const { data: segredo, error: erroSegredo } = await admin.from("segredos_sistema").select("robo_token").eq("id", 1).maybeSingle();
    if (erroSegredo) {
      log("Falha ao validar credencial do robô.");
      return erro(500, "erro_interno", "Não foi possível validar a execução do robô.");
    }
    if (!segredo?.robo_token || segredo.robo_token !== roboToken) return erro(401, "nao_autenticado", "Credencial do robô inválida.");
    origem = "cron";
  } else {
    const token = request.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) return erro(401, "nao_autenticado", "Sessão não informada.");
    const autenticacao = createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: usuario, error: erroAuth } = await autenticacao.auth.getUser();
    if (erroAuth || !usuario.user) return erro(401, "nao_autenticado", "Sessão inválida ou expirada.");
    const { data: perfil, error: erroPerfil } = await admin.from("advogados").select("perfil").eq("id", usuario.user.id).maybeSingle();
    if (erroPerfil) {
      log("Falha ao consultar perfil do chamador.");
      return erro(500, "erro_interno", "Não foi possível validar a autorização.");
    }
    if (perfil?.perfil !== "admin") return erro(403, "nao_autorizado", "Apenas o administrador pode executar uma captura manual.");
    disparadaPor = usuario.user.id;
  }

  let corpo: Record<string, unknown>;
  try {
    const valor: unknown = await request.json();
    if (!valor || typeof valor !== "object" || Array.isArray(valor)) throw new Error("invalid");
    corpo = valor as Record<string, unknown>;
  } catch {
    return erro(400, "corpo_invalido", "Informe os parâmetros da captura.");
  }

  const capturar = async (opcoes: Record<string, unknown>, origemCaptura: "manual" | "cron", ator: string | null): Promise<Resultado> => {
    const tamanho = opcoes.itensPorPagina === undefined ? 100 : opcoes.itensPorPagina;
    if (tamanho !== 5 && tamanho !== 100) throw new Error("pagina_invalida:O número de itens por página deve ser 5 ou 100.");
    const manual = origemCaptura === "manual";
    const numero = typeof opcoes.oab_numero === "string" ? opcoes.oab_numero.trim() : "";
    const uf = typeof opcoes.oab_uf === "string" ? opcoes.oab_uf.trim().toUpperCase() : "";
    if (manual && !forte(opcoes) && tamanho !== 5) throw new Error("filtro_obrigatorio:Informe tribunal, texto, parte, advogado, OAB ou processo, ou limite a página a 5 itens.");
    // A OAB é obrigatória: a publicação é sempre vinculada à inscrição monitorada que a trouxe.
    if (!numero || !/^\d+$/.test(numero) || !/^[A-Z]{2}$/.test(uf)) throw new Error("dados_invalidos:Informe o número da OAB e a UF com duas letras.");
    if (opcoes.meio !== undefined && opcoes.meio !== "" && opcoes.meio !== "D" && opcoes.meio !== "E") throw new Error("meio_invalido:Selecione Diário (D), Editais (E) ou todos os meios.");
    const de = typeof opcoes.disponibilizacaoDe === "string" ? opcoes.disponibilizacaoDe : "";
    const ate = typeof opcoes.disponibilizacaoAte === "string" ? opcoes.disponibilizacaoAte : "";
    if ((de && !dataValida(de)) || (ate && !dataValida(ate)) || (de && ate && de > ate)) throw new Error("periodo_invalido:Informe datas válidas e uma data inicial anterior ou igual à final.");
    const meioParam = typeof opcoes.meio === "string" && ["D", "E"].includes(opcoes.meio) ? opcoes.meio : "";
    const oabConsultada = numero && uf ? `${numero}/${uf}` : "";
    const agora = new Date().toISOString();
    const { data: captura, error: erroInsercao } = await admin.from("capturas_djen").insert({
      oab_numero: numero || null,
      oab_uf: uf || null,
      tribunal_sigla: typeof opcoes.tribunal === "string" && opcoes.tribunal.trim() ? opcoes.tribunal.trim() : null,
      disponibilizacao_de: de || null,
      disponibilizacao_ate: ate || null,
      // Sem filtro de meio a coluna fica nula: é o registro honesto de "todos os meios".
      meio: meioParam || null,
      origem_disparo: origemCaptura,
      status: "consultando",
      disparada_por: ator,
      iniciada_em: agora,
      paginas_concluidas: 0,
      itens_recebidos: 0,
      itens_novos: 0,
      itens_duplicados: 0,
      parcial: false,
    }).select("id").single();
    if (erroInsercao || !captura) {
      log(`Falha ao registrar a execução: ${erroInsercao?.message ?? "sem registro devolvido"}`);
      throw new Error("falha_registro:Não foi possível registrar a execução da captura.");
    }

    let recebidas = 0;
    let novas = 0;
    let paginas = 0;
    let limiteRate: number | null = null;
    let restanteRate: number | null = null;
    let count = 0;
    let parcial = false;
    let mensagem = "";
    let falha = "";
    const inicio = Date.now();
    try {
      for (let pagina = 1; pagina <= 10; pagina += 1) {
        if (Date.now() - inicio > 90_000) {
          parcial = true;
          mensagem = "Execução interrompida após 90 segundos; continua na próxima rodada.";
          break;
        }
        const query = new URLSearchParams();
        const parametros: Array<[string, unknown]> = [
          ["numeroOab", numero], ["ufOab", uf], ["dataDisponibilizacaoInicio", de], ["dataDisponibilizacaoFim", ate],
          ["siglaTribunal", opcoes.tribunal], ["numeroProcesso", opcoes.numeroProcesso], ["nomeParte", opcoes.nomeParte],
          ["nomeAdvogado", opcoes.nomeAdvogado], ["texto", opcoes.texto], ["meio", meioParam], ["pagina", pagina], ["itensPorPagina", tamanho],
        ];
        for (const [chave, valor] of parametros) if (valor !== undefined && valor !== null && String(valor).trim() !== "") query.set(chave, String(valor).trim());
        let resposta: Response | null = null;
        let motivo = "";
        for (let tentativa = 0; tentativa <= 2; tentativa += 1) {
          try {
            resposta = await fetch(`https://comunicaapi.pje.jus.br/api/v1/comunicacao?${query.toString()}`, {
              headers: { Accept: "application/json" },
              signal: AbortSignal.timeout(20_000),
            });
            limiteRate = numeroCabecalho(resposta.headers.get("x-ratelimit-limit")) ?? limiteRate;
            restanteRate = numeroCabecalho(resposta.headers.get("x-ratelimit-remaining")) ?? restanteRate;
            if (resposta.status === 429) {
              motivo = "A API do CNJ limitou as requisições (HTTP 429).";
              resposta = null;
              // Espera o minuto recomendado apenas se ainda houver orçamento de tempo na rodada.
              if (tentativa < 2 && Date.now() - inicio < 30_000) await atraso(60_000);
              continue;
            }
            if (!resposta.ok) {
              motivo = `A API do CNJ respondeu HTTP ${resposta.status}.`;
              resposta = null;
              if (tentativa < 2) await atraso(1000);
              continue;
            }
            break;
          } catch (falhaRede) {
            motivo = falhaRede instanceof Error ? falhaRede.message : "Falha de rede ao consultar o CNJ.";
            resposta = null;
            if (tentativa < 2) await atraso(1000);
          }
        }
        if (!resposta) throw new Error(motivo || "Não foi possível consultar a API do CNJ.");
        const corpoApi = await resposta.json() as { count?: number; items?: Publicacao[] };
        const itens = Array.isArray(corpoApi.items) ? corpoApi.items : [];
        count = typeof corpoApi.count === "number" ? corpoApi.count : count;
        paginas += 1;
        recebidas += itens.length;
        if (itens.length) {
          const linhas = itens.filter((item) => typeof item.id === "number" && Number.isFinite(item.id)).map((item) => linhaPublicacao(item, captura.id, oabConsultada));
          if (linhas.length) {
            const { data: inseridos, error: erroUpsert } = await admin.from("intimacoes_djen_raw")
              .upsert(linhas, { onConflict: "djen_id", ignoreDuplicates: true }).select("id");
            if (erroUpsert) throw new Error(`Falha ao gravar publicações: ${erroUpsert.message}`);
            novas += inseridos?.length ?? 0;
          }
        }
        if (itens.length < Number(tamanho)) break;
        const teto = Math.min(count || Number.MAX_SAFE_INTEGER, 10_000);
        if (pagina * Number(tamanho) >= teto) {
          if (count > 10_000 && pagina * Number(tamanho) >= 10_000) {
            parcial = true;
            mensagem = "A busca atingiu o teto de 10.000 resultados da API; o resultado é parcial.";
          }
          break;
        }
        if (pagina === 10) {
          parcial = true;
          mensagem = "Execução interrompida no limite de páginas desta rodada; continua na próxima.";
          break;
        }
        if (Date.now() - inicio > 90_000) {
          parcial = true;
          mensagem = "Execução interrompida após 90 segundos; continua na próxima rodada.";
          break;
        }
        if (restanteRate === 0) {
          parcial = true;
          mensagem = "Execução interrompida pelo limite de requisições informado pela API; continua na próxima rodada.";
          break;
        }
      }
    } catch (falhaCaptura) {
      falha = falhaCaptura instanceof Error ? falhaCaptura.message : "Falha inesperada durante a captura.";
    }
    const duplicadas = recebidas - novas;
    const status: Status = falha ? "falha" : parcial ? "parcial" : recebidas === 0 ? "sem_novidades" : "concluido";
    if (status === "falha" && !mensagem) mensagem = "A captura não foi concluída.";
    const atualizacao = await admin.from("capturas_djen").update({
      status,
      paginas_concluidas: paginas,
      itens_recebidos: recebidas,
      itens_novos: novas,
      itens_duplicados: duplicadas,
      parcial,
      mensagem: mensagem || null,
      erro: falha || null,
      concluida_em: new Date().toISOString(),
      rate_limit_limite: limiteRate,
      rate_limit_restante: restanteRate,
    }).eq("id", captura.id);
    if (atualizacao.error) log("Falha ao atualizar o registro de execução.");
    return { status, recebidas, novas, duplicadas, parcial, paginas, mensagem: falha ? `${mensagem} ${falha}` : mensagem || (recebidas === 0 ? "Nenhuma comunicação nova encontrada." : "Captura concluída."), executado_em: agora };
  };

  try {
    if (origem === "cron") {
      const { data: configuracao, error: erroConfiguracao } = await admin.from("configuracoes_sistema").select("oabs_monitoradas, horario_cron_djen").eq("id", 1).maybeSingle();
      if (erroConfiguracao) throw new Error("Não foi possível consultar a configuração do robô.");
      const agoraSp = dataSaoPaulo();
      if (agoraSp.hora < (configuracao?.horario_cron_djen ?? "06:00")) return responder(200, { ok: true, dados: { status: "ocioso", mensagem: "Fora do horário agendado." } });
      // A idempotência vem da data de corte por OAB: cada rodada cobre o dia mais antigo
      // ainda pendente, então repetir a execução no mesmo dia é seguro e não duplica nada.
      const oabs = Array.isArray(configuracao?.oabs_monitoradas) ? configuracao.oabs_monitoradas.filter((valor): valor is string => typeof valor === "string") : [];
      if (!oabs.length) return responder(200, { ok: true, dados: { status: "ocioso", mensagem: "Nenhuma OAB monitorada configurada." } });
      const ontem = deslocarDia(agoraSp.dia, -1);
      const limiteAtraso = deslocarDia(agoraSp.dia, -30);
      const resultados: Resultado[] = [];
      for (const oab of oabs) {
        const partes = /^(\d+)\/([A-Za-z]{2})$/.exec(oab.trim());
        if (!partes) continue;
        const [, numero, uf] = partes;
        const ufOab = uf.toUpperCase();
        const { data: ultima, error: erroUltima } = await admin.from("capturas_djen").select("disponibilizacao_ate")
          .eq("oab_numero", numero).eq("oab_uf", ufOab).eq("origem_disparo", "cron")
          .in("status", ["concluido", "sem_novidades"]).lte("disponibilizacao_de", ontem)
          .order("disponibilizacao_ate", { ascending: false }).limit(1).maybeSingle();
        if (erroUltima) throw new Error("Não foi possível determinar o último período capturado.");
        // Atraso: se o robô ficou parado, o intervalo em falta é buscado de uma vez,
        // limitado a 30 dias para a rodada não virar uma varredura gigante.
        if (ultima?.disponibilizacao_ate) {
          const falta = deslocarDia(ultima.disponibilizacao_ate, 1);
          if (falta < ontem) {
            const de = falta < limiteAtraso ? limiteAtraso : falta;
            resultados.push(await capturar({ oab_numero: numero, oab_uf: ufOab, disponibilizacaoDe: de, disponibilizacaoAte: ontem, itensPorPagina: 100 }, "cron", null));
          }
        }
        // Sem histórico, o robô começa em ontem e passa a viver no presente: a cada rodada
        // ele rebusca ontem e hoje. Como o controle de duplicados é pelo id da comunicação,
        // repetir não custa nada e garante que nada do dia corrente escape.
        resultados.push(await capturar({ oab_numero: numero, oab_uf: ufOab, disponibilizacaoDe: ontem, disponibilizacaoAte: agoraSp.dia, itensPorPagina: 100 }, "cron", null));
      }
      if (!resultados.length) return responder(200, { ok: true, dados: { status: "ocioso", mensagem: "Nenhuma OAB monitorada válida." } });
      const prioridade: Status[] = ["falha", "parcial", "concluido", "sem_novidades", "ocioso"];
      const status = prioridade.find((valor) => resultados.some((resultado) => resultado.status === valor)) ?? "sem_novidades";
      return responder(200, { ok: true, dados: {
        status,
        recebidas: resultados.reduce((soma, item) => soma + item.recebidas, 0),
        novas: resultados.reduce((soma, item) => soma + item.novas, 0),
        duplicadas: resultados.reduce((soma, item) => soma + item.duplicadas, 0),
        parcial: resultados.some((item) => item.parcial),
        paginas: resultados.reduce((soma, item) => soma + item.paginas, 0),
        mensagem: resultados.map((item) => item.mensagem).filter(Boolean).join(" "),
        executado_em: new Date().toISOString(),
      } });
    }
    const resultado = await capturar(corpo, "manual", disparadaPor);
    if (resultado.status === "falha") return erro(500, "captura_falhou", resultado.mensagem);
    return responder(200, { ok: true, dados: resultado });
  } catch (falhaGeral) {
    const mensagem = falhaGeral instanceof Error ? falhaGeral.message : "Não foi possível concluir a captura.";
    const separador = mensagem.indexOf(":");
    if (separador > 0) {
      const codigo = mensagem.slice(0, separador);
      const texto = mensagem.slice(separador + 1);
      return erro(codigo === "pagina_invalida" || codigo === "filtro_obrigatorio" || codigo === "dados_invalidos" || codigo === "periodo_invalido" || codigo === "meio_invalido" ? 400 : 500, codigo, texto);
    }
    log(mensagem);
    return erro(500, "erro_interno", mensagem);
  }
});
