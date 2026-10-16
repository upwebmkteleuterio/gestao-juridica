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
const log = (mensagem: string) => console.error(`[analisar-publicacoes] ${mensagem}`);

const MODELO_PADRAO = "deepseek-flash";
const SEM_PRAZO = "não identificado";
const LIMITE_PADRAO = 10;
const LIMITE_MAXIMO = 20;
const LIMITE_CADEIA = 200;
const ORCAMENTO_MS = 100_000;
const TAMANHO_MAXIMO_TEXTO = 20_000;

const PROMPT_PADRAO = [
  "Você é assistente jurídico de um escritório de advocacia brasileiro.",
  "Leia a publicação do Diário de Justiça Eletrônico Nacional (DJEN) e responda SOMENTE um objeto json, sem nenhum texto fora do json, com exatamente estes campos:",
  '{"resumo": "o que o juízo determinou, em no máximo 3 frases",',
  ' "acao_sugerida": "próxima providência prática do escritório, no imperativo",',
  ' "prazo_texto": "prazo mencionado no texto, como aparece; use exatamente \\"não identificado\\" quando o texto não indicar prazo",',
  ' "prazo_data": "data limite no formato AAAA-MM-DD, somente quando o texto indicar uma data explícita; caso contrário null",',
  ' "trecho_fundamentador": "trecho literal e curto do texto que sustenta a conclusão",',
  ' "pendencias": ["informações ou documentos que faltam para cumprir a determinação"]}',
  "Regras: nunca invente prazo nem data. Não afirme nada que não esteja escrito na publicação.",
].join("\n");

const CONTRATO_SAIDA = "A resposta deve ser exclusivamente um objeto json válido, sem texto fora dele, contendo exatamente estas seis chaves: resumo, acao_sugerida, prazo_texto, prazo_data, trecho_fundamentador e pendencias.";

// A API exige 'json' no prompt para aceitar response_format json_object, e o prompt editável do escritório pode não declarar as chaves lidas pelo código; por isso, o contrato é sempre acrescentado.
function garantirContratoJson(prompt: string) {
  return `${prompt}\n\n${CONTRATO_SAIDA}`;
}

type LinhaBruta = {
  id: string;
  texto: string | null;
  numero_processo: string | null;
  data_disponibilizacao: string | null;
  sigla_tribunal: string | null;
  nome_orgao: string | null;
  tipo_documento: string | null;
};

type Analise = {
  resumo: string;
  acao_sugerida: string;
  prazo_texto: string;
  prazo_data: string | null;
  trecho_fundamentador: string;
  pendencias: string[];
};

type Resultado = { raw_id: string; status: "sucesso" | "falha"; mensagem: string };

function textoDe(valor: unknown) {
  return typeof valor === "string" ? valor.trim() : "";
}

function listaDeTextos(valor: unknown): string[] {
  if (!Array.isArray(valor)) return [];
  return valor
    .map((item) => textoDe(item))
    .filter(Boolean)
    .slice(0, 20);
}

function dataOuNulo(valor: unknown) {
  const candidato = textoDe(valor).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(candidato)) return null;
  if (Number.isNaN(Date.parse(`${candidato}T00:00:00Z`))) return null;
  return new Date(`${candidato}T00:00:00Z`).toISOString().slice(0, 10) === candidato ? candidato : null;
}

function diasDoPrazo(texto: string) {
  const semParenteses = texto.replace(/\([^)]*\)/g, " ");
  const ocorrencia = semParenteses.match(/\b(\d{1,3})\s+dias?\b/i);
  if (!ocorrencia) return null;
  const dias = Number(ocorrencia[1]);
  return Number.isInteger(dias) && dias >= 1 && dias <= 365 ? dias : null;
}

// Converte a resposta da IA em uma análise utilizável, sem aceitar prazo inventado.
function interpretarResposta(bruto: unknown): Analise {
  if (!bruto || typeof bruto !== "object" || Array.isArray(bruto)) throw new Error("A IA não devolveu um objeto JSON.");
  const campos = bruto as Record<string, unknown>;
  const resumo = textoDe(campos.resumo);
  const acaoSugerida = textoDe(campos.acao_sugerida);
  if (!resumo || !acaoSugerida) throw new Error("A resposta da IA não trouxe resumo e ação sugerida.");
  const prazoTextoBruto = textoDe(campos.prazo_texto);
  const prazoData = dataOuNulo(campos.prazo_data);
  const semPrazo = !prazoTextoBruto || prazoTextoBruto.toLowerCase() === SEM_PRAZO || /^(sem prazo|não consta|nao consta|n\/a|-)$/i.test(prazoTextoBruto);
  const pendencias = listaDeTextos(campos.pendencias);
  if (semPrazo && !pendencias.some((item) => /prazo/i.test(item))) {
    pendencias.push("O texto não indica prazo — confirmar o prazo aplicável antes de agir.");
  }
  return {
    resumo,
    acao_sugerida: acaoSugerida,
    prazo_texto: semPrazo ? SEM_PRAZO : prazoTextoBruto,
    prazo_data: semPrazo ? null : prazoData,
    trecho_fundamentador: textoDe(campos.trecho_fundamentador),
    pendencias,
  };
}

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("", { status: 204, headers: corsHeaders });
  if (request.method !== "POST") return erro(400, "metodo_invalido", "Método não permitido.");

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceRoleKey) {
    log("Configuração do Supabase ausente.");
    return erro(500, "erro_interno", "Não foi possível concluir a análise.");
  }

  const admin = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });

  const roboToken = request.headers.get("x-robo-token");
  let ator: string | null = null;
  if (roboToken !== null) {
    const { data: segredo, error: erroSegredo } = await admin.from("segredos_sistema").select("robo_token").eq("id", 1).maybeSingle();
    if (erroSegredo) {
      log("Falha ao validar credencial do robô.");
      return erro(500, "erro_interno", "Não foi possível validar a execução do robô.");
    }
    if (!segredo?.robo_token || segredo.robo_token !== roboToken) return erro(401, "nao_autenticado", "Credencial do robô inválida.");
  } else {
    const token = request.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) return erro(401, "nao_autenticado", "Sessão não informada.");
    const autenticacao = createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: usuario, error: erroAuth } = await autenticacao.auth.getUser();
    if (erroAuth || !usuario.user) return erro(401, "nao_autenticado", "Sessão inválida ou expirada.");
    ator = usuario.user.id;
  }

  const chave = Deno.env.get("DEEPSEEK_API_KEY");
  if (!chave) {
    log("Chave da IA ausente no servidor.");
    return erro(500, "ia_sem_chave", "A chave da IA não está configurada no servidor. Avise o administrador.");
  }

  let corpo: Record<string, unknown> = {};
  try {
    const valor: unknown = await request.json();
    if (valor && typeof valor === "object" && !Array.isArray(valor)) corpo = valor as Record<string, unknown>;
  } catch {
    corpo = {};
  }

  const rawId = textoDe(corpo.raw_id);
  if (rawId && !/^[0-9a-f-]{36}$/i.test(rawId)) return erro(400, "dados_invalidos", "Publicação inválida para análise.");
  const cadeiaSolicitada = corpo.cadeia;
  const cadeia = typeof cadeiaSolicitada === "number" && Number.isInteger(cadeiaSolicitada) && cadeiaSolicitada >= 0 ? cadeiaSolicitada : 0;
  const limiteSolicitado = Number(corpo.limite);
  const limite = rawId ? 1 : Math.min(LIMITE_MAXIMO, Math.max(1, Number.isFinite(limiteSolicitado) ? Math.trunc(limiteSolicitado) : LIMITE_PADRAO));

  const { data: configuracao, error: erroConfiguracao } = await admin.from("configuracoes_sistema")
    .select("ia_modelo, ia_system_prompt, prazo_padrao_dias_uteis").eq("id", 1).maybeSingle();
  if (erroConfiguracao) {
    log("Falha ao consultar a configuração da IA.");
    return erro(500, "erro_interno", "Não foi possível consultar a configuração da IA.");
  }
  const modelo = textoDe(configuracao?.ia_modelo) || MODELO_PADRAO;
  const prompt = garantirContratoJson(textoDe(configuracao?.ia_system_prompt) || PROMPT_PADRAO);

  let travaReivindicada = false;
  const liberarTrava = async () => {
    if (!travaReivindicada) return;
    try {
      const { error: erroLiberacao } = await admin.rpc("liberar_analise");
      if (erroLiberacao) log("Falha ao liberar a trava da rodada de análise.");
      else travaReivindicada = false;
    } catch {
      log("Falha ao liberar a trava da rodada de análise.");
    }
  };

  if (!rawId) {
    try {
      const { data: reivindicada, error: erroReivindicacao } = await admin.rpc("reivindicar_analise", { p_segundos: 240 });
      if (erroReivindicacao) {
        log("Falha ao reivindicar a trava da rodada de análise; seguindo sem trava.");
      } else if (reivindicada === true) {
        travaReivindicada = true;
        log("Trava da rodada de análise reivindicada.");
      } else {
        log("Trava da rodada de análise já está ocupada.");
        return responder(200, {
          ok: true,
          dados: {
            processadas: 0,
            sucessos: 0,
            falhas: 0,
            restantes: 0,
            modelo,
            mensagem: "Uma rodada de análise já está em andamento.",
          },
        });
      }
    } catch {
      log("Falha ao reivindicar a trava da rodada de análise; seguindo sem trava.");
    }
  }

  let consulta = admin.from("intimacoes_djen_raw")
    .select("id, texto, numero_processo, data_disponibilizacao, sigla_tribunal, nome_orgao, tipo_documento");
  consulta = rawId
    ? consulta.eq("id", rawId)
    : consulta.eq("status_analise_ia", "pendente").order("criado_em", { ascending: true }).limit(limite);
  const { data: publicacoes, error: erroPublicacoes } = await consulta;
  if (erroPublicacoes) {
    log("Falha ao listar as publicações pendentes.");
    await liberarTrava();
    return erro(500, "erro_interno", "Não foi possível listar as publicações para análise.");
  }
  if (!publicacoes?.length) {
    if (!rawId) log("Encadeamento interrompido: nenhuma publicação processada com sucesso nesta rodada.");
    await liberarTrava();
    return responder(200, { ok: true, dados: { processadas: 0, sucessos: 0, falhas: 0, resultados: [], mensagem: "Nenhuma publicação pendente de análise." } });
  }

  const inicio = Date.now();
  const resultados: Resultado[] = [];

  // Cria a publicação processada sem tocar no que já existe: reanalisar não pode
  // mexer em advogado_id, status_fluxo nem distribuido_em.
  const garantirProcessada = async (linha: LinhaBruta) => {
    const { data: existente, error: erroExistente } = await admin.from("intimacoes").select("id").eq("raw_id", linha.id).maybeSingle();
    if (erroExistente) throw new Error("Não foi possível verificar a publicação processada.");
    if (existente) return;
    const { error: erroInsercao } = await admin.from("intimacoes").insert({
      raw_id: linha.id,
      numero_processo: linha.numero_processo,
      tribunal_sigla: linha.sigla_tribunal,
      orgao_julgador: linha.nome_orgao,
      data_disponibilizacao: linha.data_disponibilizacao,
      tipo_documento: linha.tipo_documento,
      status_fluxo: "triagem",
      status_analise: "pendente",
    });
    if (erroInsercao) throw new Error("Não foi possível criar a publicação processada.");
  };

  const registrar = async (linha: LinhaBruta, status: "sucesso" | "falha", analise: Analise | null, motivo: string | null, duracao: number) => {
    const { error: erroHistorico } = await admin.from("analises_ia").insert({
      raw_id: linha.id,
      modelo,
      status,
      resumo: analise?.resumo ?? null,
      acao_sugerida: analise?.acao_sugerida ?? null,
      prazo_texto: analise?.prazo_texto ?? null,
      prazo_data: analise?.prazo_data ?? null,
      trecho_fundamentador: analise?.trecho_fundamentador ?? null,
      pendencias: analise?.pendencias ?? [],
      motivo_falha: motivo,
      duracao_ms: duracao,
      criado_por: ator,
    });
    if (erroHistorico) log("Falha ao gravar o histórico da análise.");
  };

  for (const linha of publicacoes as LinhaBruta[]) {
    if (Date.now() - inicio > ORCAMENTO_MS) break;
    const marca = Date.now();
    let motivo = "";
    let analise: Analise | null = null;

    try {
      if (!linha.numero_processo || !linha.data_disponibilizacao) {
        throw new Error("Publicação sem número de processo ou data de disponibilização.");
      }
      if (!textoDe(linha.texto)) throw new Error("Publicação sem texto para analisar.");
      await garantirProcessada(linha);

      const resposta = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: modelo,
          messages: [
            { role: "system", content: prompt },
            { role: "user", content: textoDe(linha.texto).slice(0, TAMANHO_MAXIMO_TEXTO) },
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
        }),
        signal: AbortSignal.timeout(60_000),
      });
      if (!resposta.ok) {
        const detalhe = await resposta.text().catch(() => "");
        throw new Error(`A IA recusou a análise (HTTP ${resposta.status}).${detalhe ? ` ${detalhe.slice(0, 200)}` : ""}`);
      }
      const devolvido = await resposta.json().catch(() => null) as { choices?: Array<{ message?: { content?: string } }> } | null;
      const conteudo = devolvido?.choices?.[0]?.message?.content ?? "";
      if (!conteudo.trim()) throw new Error("A IA devolveu uma resposta vazia.");
      let json: unknown;
      try {
        json = JSON.parse(conteudo);
      } catch {
        throw new Error("A IA devolveu um conteúdo que não é JSON válido.");
      }
      analise = interpretarResposta(json);
    } catch (falha) {
      motivo = falha instanceof Error ? falha.message : "Falha não identificada na análise.";
    }

    const duracao = Date.now() - marca;
    const status: "sucesso" | "falha" = analise ? "sucesso" : "falha";
    let dataFatalCalculada = analise?.prazo_data ?? null;

    if (analise && !analise.prazo_data) {
      const diasDeclarados = diasDoPrazo(analise.prazo_texto);
      const prazoPadrao = configuracao?.prazo_padrao_dias_uteis;
      const dias = diasDeclarados ?? (typeof prazoPadrao === "number" && Number.isInteger(prazoPadrao) && prazoPadrao >= 1 && prazoPadrao <= 365 ? prazoPadrao : null);
      if (dias !== null) {
        try {
          const { data, error } = await admin.rpc("calcular_prazo_djen", {
            p_disponibilizacao: linha.data_disponibilizacao,
            p_dias: dias,
          });
          if (error) {
            log(`Falha ao calcular data fatal sugerida para publicação ${linha.id}.`);
          } else if (typeof data === "string" && /^\d{4}-\d{2}-\d{2}$/.test(data)) {
            dataFatalCalculada = data;
          }
        } catch {
          log(`Falha ao calcular data fatal sugerida para publicação ${linha.id}.`);
        }
      }
    }

    if (analise) {
      const { error: erroResultado } = await admin.from("intimacoes").update({
        resumo_ia: analise.resumo,
        acao_sugerida_ia: analise.acao_sugerida,
        prazo_extraido_texto: analise.prazo_texto,
        data_fatal_calculada: dataFatalCalculada,
        trecho_fundamentador: analise.trecho_fundamentador,
        pendencias: analise.pendencias,
        status_analise: "sucesso",
        analisado_em: new Date().toISOString(),
      }).eq("raw_id", linha.id);
      if (erroResultado) {
        motivo = "A análise foi concluída, mas não foi possível gravá-la na publicação.";
        analise = null;
      }
    } else {
      const { error: erroFalha } = await admin.from("intimacoes").update({
        status_analise: "falha",
        analisado_em: new Date().toISOString(),
      }).eq("raw_id", linha.id);
      if (erroFalha) log("Falha ao marcar a publicação como falha.");
    }

    const statusFinal: "sucesso" | "falha" = analise ? "sucesso" : "falha";
    await registrar(linha, statusFinal, analise, analise ? null : motivo, duracao);
    const { error: erroBruto } = await admin.from("intimacoes_djen_raw").update({ status_analise_ia: statusFinal }).eq("id", linha.id);
    if (erroBruto) log("Falha ao atualizar o status da publicação bruta.");

    resultados.push({ raw_id: linha.id, status: statusFinal, mensagem: analise ? "Análise concluída." : motivo });
    if (status !== statusFinal) log("Análise gravada com divergência de status.");
  }

  if (!resultados.length) {
    await liberarTrava();
    return erro(500, "erro_interno", "Não foi possível concluir a análise.");
  }

  const sucessos = resultados.filter((item) => item.status === "sucesso").length;
  const falhas = resultados.length - sucessos;
  const restantes = publicacoes.length - resultados.length;
  const mensagem = falhas === 0
    ? `${sucessos} publicação(ões) analisada(s).`
    : `${sucessos} analisada(s) e ${falhas} com falha.`;

  await liberarTrava();

  if (rawId) {
    log("Execução de publicação única; encadeamento desativado.");
  } else if (cadeia >= LIMITE_CADEIA) {
    log(`Encadeamento interrompido: limite de ${LIMITE_CADEIA} rodadas atingido.`);
  } else if (sucessos === 0) {
    log("Encadeamento interrompido: nenhuma publicação foi analisada com sucesso nesta rodada.");
  } else {
    const { count, error: erroPendentes } = await admin.from("intimacoes_djen_raw")
      .select("id", { count: "exact", head: true })
      .eq("status_analise_ia", "pendente");
    if (erroPendentes) {
      log("Encadeamento interrompido: falha ao contar publicações pendentes.");
    } else if (!count || count <= 0) {
      log("Encadeamento interrompido: não há publicações pendentes.");
    } else {
      try {
        const { error: erroAgendamento } = await admin.rpc("agendar_proxima_analise", { p_cadeia: cadeia + 1 });
        if (erroAgendamento) log("Falha ao enfileirar a próxima rodada de análise.");
        else log(`Próxima rodada de análise enfileirada (cadeia ${cadeia + 1}).`);
      } catch {
        log("Falha ao enfileirar a próxima rodada de análise.");
      }
    }
  }

  return responder(200, {
    ok: true,
    dados: {
      processadas: resultados.length,
      sucessos,
      falhas,
      restantes,
      modelo,
      mensagem,
      resultados,
    },
  });
});
