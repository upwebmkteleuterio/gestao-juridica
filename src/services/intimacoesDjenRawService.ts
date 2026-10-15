import { supabase } from "@/integrations/supabase/client";
import type {
  ConsultaAuditoriaDjen,
  IndicadoresIngestaoDjen,
  IntimacaoDjenRaw,
  LinhaAuditoriaDjen,
  ParametrosCapturaDjen,
  ResultadoAuditoriaDjen,
  ResultadoCapturaDjen,
  StatusCaptura,
} from "@/types";
import { mensagemDeErro } from "./erros";
import { criarRepositorioSupabase } from "./repositorioSupabase";

const COLUNAS = "id, djen_id_original:djen_id, djen_hash, payload_json, status_analise_ia, criado_em, data_disponibilizacao, sigla_tribunal, nome_orgao, numero_processo, oab_consultada";
const TAMANHO_PAGINA_PADRAO = 8;
export const MAX_DIAS_CAPTURA = 5;

interface RawSelecionado extends IntimacaoDjenRaw {
  djen_id_original: string;
  data_disponibilizacao: string | null;
  sigla_tribunal: string | null;
  nome_orgao: string | null;
  numero_processo: string | null;
  oab_consultada: string | null;
}

function normalizarRaw(linha: IntimacaoDjenRaw): IntimacaoDjenRaw {
  const registro = linha as unknown as RawSelecionado;
  return {
    ...registro,
    djen_id_original: String(registro.djen_id_original),
    djen_hash: registro.djen_hash ?? "",
    sigla_tribunal: registro.sigla_tribunal ?? "",
    nome_orgao: registro.nome_orgao ?? "",
    numero_processo: registro.numero_processo ?? "",
    oab_consultada: registro.oab_consultada ?? "",
  } as unknown as IntimacaoDjenRaw;
}

const repositorio = criarRepositorioSupabase<IntimacaoDjenRaw, never>({
  tabela: "intimacoes_djen_raw",
  colunas: COLUNAS,
  montar: normalizarRaw,
});

function paraLinha(linha: RawSelecionado): LinhaAuditoriaDjen {
  return {
    id: linha.id,
    djen_id_original: String(linha.djen_id_original),
    tribunal_sigla: linha.sigla_tribunal ?? "",
    orgao_julgador: linha.nome_orgao ?? "",
    numero_processo: linha.numero_processo ?? "",
    data_disponibilizacao: linha.data_disponibilizacao ?? "",
    djen_hash: linha.djen_hash ?? "",
    status_analise_ia: linha.status_analise_ia,
  };
}

function diferencaEmDias(de: string, ate: string): number {
  const inicio = new Date(`${de.slice(0, 10)}T12:00:00Z`);
  const fim = new Date(`${ate.slice(0, 10)}T12:00:00Z`);
  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime())) return 0;
  return Math.round((fim.getTime() - inicio.getTime()) / 86_400_000);
}

function consultaBase(consulta: ConsultaAuditoriaDjen = {}) {
  let query = supabase.from("intimacoes_djen_raw").select(COLUNAS, { count: "exact" });
  if (consulta.oab) query = query.eq("oab_consultada", consulta.oab);
  if (consulta.disponibilizacaoDe) query = query.gte("data_disponibilizacao", consulta.disponibilizacaoDe);
  if (consulta.disponibilizacaoAte) query = query.lte("data_disponibilizacao", consulta.disponibilizacaoAte);
  return query;
}

function ordenar(query: ReturnType<typeof consultaBase>) {
  return query.order("data_disponibilizacao", { ascending: false }).order("djen_id", { ascending: false });
}

export const intimacoesDjenRawService = {
  getAll: repositorio.getAll,
  getById: repositorio.getById,

  async buscarPorIdOriginal(djen_id_original: string): Promise<IntimacaoDjenRaw | null> {
    const valor = djen_id_original.trim();
    if (!/^\d+$/.test(valor)) return null;
    const idNumerico = Number(valor);
    if (!Number.isFinite(idNumerico)) return null;
    const { data, error } = await supabase.from("intimacoes_djen_raw").select(COLUNAS).eq("djen_id", idNumerico).maybeSingle();
    if (error) throw new Error(mensagemDeErro(error));
    return data ? normalizarRaw(data as unknown as IntimacaoDjenRaw) : null;
  },

  async contarPorStatus(): Promise<Record<string, number>> {
    const status = ["pendente", "sucesso", "falha"] as const;
    const resultados = await Promise.all(status.map((valor) =>
      supabase.from("intimacoes_djen_raw").select("id", { count: "exact", head: true }).eq("status_analise_ia", valor),
    ));
    return resultados.reduce<Record<string, number>>((contagem, resultado, indice) => {
      if (resultado.error) throw new Error(mensagemDeErro(resultado.error));
      contagem[status[indice]] = resultado.count ?? 0;
      return contagem;
    }, {});
  },

  async listar(consulta: ConsultaAuditoriaDjen = {}): Promise<ResultadoAuditoriaDjen> {
    const tamanhoPagina = Math.max(1, consulta.tamanhoPagina ?? TAMANHO_PAGINA_PADRAO);
    const paginaSolicitada = Math.max(1, consulta.pagina ?? 1);
    const resposta = await ordenar(consultaBase(consulta)).range((paginaSolicitada - 1) * tamanhoPagina, paginaSolicitada * tamanhoPagina - 1);
    if (resposta.error) throw new Error(mensagemDeErro(resposta.error));
    const total = resposta.count ?? 0;
    const totalPaginas = Math.max(1, Math.ceil(total / tamanhoPagina));
    const pagina = Math.min(paginaSolicitada, totalPaginas);
    let linhas = resposta.data ?? [];
    if (pagina !== paginaSolicitada) {
      const ajustada = await ordenar(consultaBase(consulta)).range((pagina - 1) * tamanhoPagina, pagina * tamanhoPagina - 1);
      if (ajustada.error) throw new Error(mensagemDeErro(ajustada.error));
      linhas = ajustada.data ?? [];
    }
    return { dados: (linhas as unknown as RawSelecionado[]).map(paraLinha), total, pagina, tamanhoPagina, totalPaginas };
  },

  async listarTribunais(): Promise<string[]> {
    const { data, error } = await supabase.from("intimacoes_djen_raw").select("sigla_tribunal").not("sigla_tribunal", "is", null);
    if (error) throw new Error(mensagemDeErro(error));
    return [...new Set((data ?? []).map((linha) => linha.sigla_tribunal).filter((sigla): sigla is string => Boolean(sigla)))].sort((a, b) => a.localeCompare(b));
  },

  async obterIndicadores(): Promise<IndicadoresIngestaoDjen> {
    const [totais, falhas, maiorData, ultimaCaptura] = await Promise.all([
      supabase.from("intimacoes_djen_raw").select("id", { count: "exact", head: true }),
      supabase.from("intimacoes_djen_raw").select("id", { count: "exact", head: true }).eq("status_analise_ia", "falha"),
      supabase.from("intimacoes_djen_raw").select("data_disponibilizacao").not("data_disponibilizacao", "is", null).order("data_disponibilizacao", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("intimacoes_djen_raw").select("criado_em").order("criado_em", { ascending: false }).limit(1).maybeSingle(),
    ]);
    for (const resposta of [totais, falhas, maiorData, ultimaCaptura]) if (resposta.error) throw new Error(mensagemDeErro(resposta.error));
    const total = totais.count ?? 0;
    const quantidadeFalhas = falhas.count ?? 0;
    const dataReferencia = maiorData.data?.data_disponibilizacao ?? "";
    const mesReferencia = dataReferencia.slice(0, 7);
    let totalMes = 0;
    if (mesReferencia) {
      const inicioMes = `${mesReferencia}-01`;
      const data = new Date(`${inicioMes}T00:00:00Z`);
      data.setUTCMonth(data.getUTCMonth() + 1);
      const fimMes = data.toISOString().slice(0, 10);
      const resultadoMes = await supabase.from("intimacoes_djen_raw").select("id", { count: "exact", head: true }).gte("data_disponibilizacao", inicioMes).lt("data_disponibilizacao", fimMes);
      if (resultadoMes.error) throw new Error(mensagemDeErro(resultadoMes.error));
      totalMes = resultadoMes.count ?? 0;
    }
    const status: StatusCaptura = total === 0 ? "ocioso" : quantidadeFalhas === 0 ? "concluido" : quantidadeFalhas === total ? "falha" : "parcial";
    // Esses valores só passam a ser medidos quando a captura real existir.
    return {
      taxaSucesso: total === 0 ? 0 : Math.round(((total - quantidadeFalhas) / total) * 100),
      totalMes,
      mesReferencia,
      rateLimitLimite: 0,
      rateLimitRestante: 0,
      ultimaCapturaEm: ultimaCaptura.data?.criado_em ?? null,
      status,
    };
  },

  async dispararConsulta(params: ParametrosCapturaDjen): Promise<ResultadoCapturaDjen> {
    if (!params.oab_numero.trim() || !params.oab_uf) throw new Error("Informe o número e a UF da OAB a pesquisar.");
    if (!params.disponibilizacaoDe || !params.disponibilizacaoAte) throw new Error("Informe o período de disponibilização da captura.");
    if (params.disponibilizacaoDe > params.disponibilizacaoAte) throw new Error("A data inicial deve ser anterior à data final.");
    if (diferencaEmDias(params.disponibilizacaoDe, params.disponibilizacaoAte) > MAX_DIAS_CAPTURA) {
      throw new Error(`A API do CNJ aceita faixas de até ${MAX_DIAS_CAPTURA} dias. Segmente a requisição para não exceder a paginação.`);
    }
    const { data, error } = await supabase.functions.invoke("capturar-djen", { body: params });
    if (error) throw new Error("Não foi possível concluir a captura agora. Tente novamente em instantes.");
    return data as ResultadoCapturaDjen;
  },
};
