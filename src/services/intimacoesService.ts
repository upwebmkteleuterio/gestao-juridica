import { supabase } from "@/integrations/supabase/client";
import type {
  CampoOrdenacaoIntimacao,
  ConsultaIntimacoes,
  CriterioDistribuicao,
  ID,
  IndicadoresIntimacoes,
  Intimacao,
  IntimacaoInput,
  OrdenacaoConsulta,
  PreviaDistribuicao,
  ResultadoConsultaIntimacoes,
  ResultadoDistribuicao,
} from "@/types";
import { mensagemDeErro } from "./erros";
import { criarRepositorioSupabase } from "./repositorioSupabase";

const COLUNAS = "id, raw_id, numero_processo, tribunal_sigla, orgao_julgador, data_disponibilizacao, acao_sugerida_ia, resumo_ia, data_fatal_calculada, advogado_id, status_fluxo, distribuido_em";
const ORDENACAO_PADRAO: OrdenacaoConsulta<CampoOrdenacaoIntimacao> = {
  campo: "data_disponibilizacao",
  direcao: "desc",
};
const TAMANHO_PAGINA_PADRAO = 8;
const DIAS_SEMANA = 7;
const CAMPOS_ORDENAVEIS: Record<CampoOrdenacaoIntimacao, string> = {
  data_disponibilizacao: "data_disponibilizacao",
  numero_processo: "numero_processo",
  data_fatal_calculada: "data_fatal_calculada",
  tribunal_sigla: "tribunal_sigla",
};

function normalizar(linha: Intimacao): Intimacao {
  return {
    ...linha,
    tribunal_sigla: linha.tribunal_sigla ?? "",
    orgao_julgador: linha.orgao_julgador ?? "",
    acao_sugerida_ia: linha.acao_sugerida_ia ?? "",
    resumo_ia: linha.resumo_ia ?? "",
  };
}

const repositorio = criarRepositorioSupabase<Intimacao, IntimacaoInput>({
  tabela: "intimacoes",
  colunas: COLUNAS,
  montar: normalizar,
});

function consultaBase(consulta: ConsultaIntimacoes = {}) {
  let query = supabase.from("intimacoes").select(COLUNAS, { count: "exact" });
  const busca = consulta.busca?.trim().replace(/[,()%*\\"]/g, "").trim() ?? "";
  if (busca) {
    query = query.or(`numero_processo.ilike.*${busca}*,tribunal_sigla.ilike.*${busca}*,orgao_julgador.ilike.*${busca}*,acao_sugerida_ia.ilike.*${busca}*,resumo_ia.ilike.*${busca}*`);
  }
  if (consulta.tribunal) query = query.eq("tribunal_sigla", consulta.tribunal);
  if (consulta.disponibilizacaoDe) query = query.gte("data_disponibilizacao", consulta.disponibilizacaoDe);
  if (consulta.disponibilizacaoAte) query = query.lte("data_disponibilizacao", consulta.disponibilizacaoAte);
  if (consulta.status && consulta.status !== "todos") query = query.eq("status_fluxo", consulta.status);
  if (consulta.advogadoId) query = query.eq("advogado_id", consulta.advogadoId);
  return query;
}

function aplicarOrdenacao(query: ReturnType<typeof consultaBase>, ordenacao?: OrdenacaoConsulta<CampoOrdenacaoIntimacao>) {
  const ordem = ordenacao ?? ORDENACAO_PADRAO;
  const campo = CAMPOS_ORDENAVEIS[ordem.campo] ?? "data_disponibilizacao";
  return query
    .order(campo, { ascending: ordem.direcao === "asc" })
    .order("numero_processo", { ascending: true });
}

export const intimacoesService = {
  ...repositorio,

  async listar(consulta: ConsultaIntimacoes = {}): Promise<ResultadoConsultaIntimacoes> {
    const tamanhoPagina = Math.max(1, consulta.tamanhoPagina ?? TAMANHO_PAGINA_PADRAO);
    const paginaSolicitada = Math.max(1, consulta.pagina ?? 1);
    const resposta = await aplicarOrdenacao(consultaBase(consulta), consulta.ordenacao)
      .range((paginaSolicitada - 1) * tamanhoPagina, paginaSolicitada * tamanhoPagina - 1);
    if (resposta.error) throw new Error(mensagemDeErro(resposta.error));
    const total = resposta.count ?? 0;
    const totalPaginas = Math.max(1, Math.ceil(total / tamanhoPagina));
    const pagina = Math.min(paginaSolicitada, totalPaginas);
    let dados = resposta.data ?? [];
    if (pagina !== paginaSolicitada) {
      const ajustada = await aplicarOrdenacao(consultaBase(consulta), consulta.ordenacao)
        .range((pagina - 1) * tamanhoPagina, pagina * tamanhoPagina - 1);
      if (ajustada.error) throw new Error(mensagemDeErro(ajustada.error));
      dados = ajustada.data ?? [];
    }
    return { dados: (dados as unknown as Intimacao[]).map(normalizar), total, pagina, tamanhoPagina, totalPaginas };
  },

  async listarParaExportacao(consulta: ConsultaIntimacoes = {}): Promise<Intimacao[]> {
    const { data, error } = await aplicarOrdenacao(consultaBase(consulta), consulta.ordenacao);
    if (error) throw new Error(mensagemDeErro(error));
    return ((data ?? []) as unknown as Intimacao[]).map(normalizar);
  },

  async listarPendentes(consulta: ConsultaIntimacoes = {}): Promise<Intimacao[]> {
    const { data, error } = await aplicarOrdenacao(
      consultaBase(consulta).eq("status_fluxo", "triagem").is("advogado_id", null),
      { campo: "data_disponibilizacao", direcao: "asc" },
    );
    if (error) throw new Error(mensagemDeErro(error));
    return ((data ?? []) as unknown as Intimacao[]).map(normalizar);
  },

  async listarPendentesDistribuicao(): Promise<Intimacao[]> {
    return intimacoesService.listarPendentes();
  },

  async contarPendentes(): Promise<number> {
    const { count, error } = await supabase.from("intimacoes").select("id", { count: "exact", head: true })
      .eq("status_fluxo", "triagem").is("advogado_id", null);
    if (error) throw new Error(mensagemDeErro(error));
    return count ?? 0;
  },

  async listarTribunais(): Promise<string[]> {
    const { data, error } = await supabase.from("intimacoes").select("tribunal_sigla").not("tribunal_sigla", "is", null);
    if (error) throw new Error(mensagemDeErro(error));
    return [...new Set((data ?? []).map((linha) => linha.tribunal_sigla).filter((sigla): sigla is string => Boolean(sigla)))].sort((a, b) => a.localeCompare(b));
  },

  async obterIndicadores(): Promise<IndicadoresIntimacoes> {
    const { data: ultima, error: erroUltima } = await supabase.from("intimacoes").select("data_disponibilizacao")
      .order("data_disponibilizacao", { ascending: false }).limit(1).maybeSingle();
    if (erroUltima) throw new Error(mensagemDeErro(erroUltima));
    const dataReferencia = ultima?.data_disponibilizacao ?? "";
    if (!dataReferencia) return { novasHoje: 0, dataReferencia: "", criticosSemana: 0, pendentesAtribuicao: 0 };
    const fimSemana = new Date(`${dataReferencia}T00:00:00Z`);
    fimSemana.setUTCDate(fimSemana.getUTCDate() + DIAS_SEMANA);
    const dataFim = fimSemana.toISOString().slice(0, 10);
    const [novas, criticos, pendentes] = await Promise.all([
      supabase.from("intimacoes").select("id", { count: "exact", head: true }).eq("data_disponibilizacao", dataReferencia),
      supabase.from("intimacoes").select("id", { count: "exact", head: true }).gte("data_fatal_calculada", dataReferencia).lte("data_fatal_calculada", dataFim),
      supabase.from("intimacoes").select("id", { count: "exact", head: true }).eq("status_fluxo", "triagem").is("advogado_id", null),
    ]);
    for (const result of [novas, criticos, pendentes]) if (result.error) throw new Error(mensagemDeErro(result.error));
    return { novasHoje: novas.count ?? 0, dataReferencia, criticosSemana: criticos.count ?? 0, pendentesAtribuicao: pendentes.count ?? 0 };
  },

  async calcularPrevia(params: { intimacaoIds: ID[]; advogadoIds: ID[]; criterio: CriterioDistribuicao }): Promise<PreviaDistribuicao> {
    const { data, error } = await supabase.rpc("calcular_previa_distribuicao", {
      p_intimacao_ids: params.intimacaoIds,
      p_advogado_ids: params.advogadoIds,
      p_criterio: params.criterio,
    });
    if (error) throw new Error(mensagemDeErro(error));
    return data as unknown as PreviaDistribuicao;
  },

  async distribuirLote(params: { intimacaoIds: ID[]; advogadoIds: ID[]; criterio: CriterioDistribuicao }): Promise<ResultadoDistribuicao> {
    const { data, error } = await supabase.rpc("distribuir_lote", {
      p_intimacao_ids: params.intimacaoIds,
      p_advogado_ids: params.advogadoIds,
      p_criterio: params.criterio,
    });
    if (error) throw new Error(mensagemDeErro(error));
    return data as unknown as ResultadoDistribuicao;
  },

  async enviarParaEsteira(params: { id: ID; acao_sugerida_ia: string; resumo_ia: string; data_fatal_calculada: string | null; advogado_id: ID }): Promise<Intimacao> {
    const { data, error } = await supabase.rpc("enviar_para_esteira", {
      p_id: params.id,
      p_acao_sugerida: params.acao_sugerida_ia,
      p_resumo: params.resumo_ia,
      p_data_fatal: params.data_fatal_calculada,
      p_advogado_id: params.advogado_id,
    });
    if (error) throw new Error(mensagemDeErro(error));
    return normalizar(data as unknown as Intimacao);
  },

  async dispensar(id: ID): Promise<Intimacao> {
    return repositorio.update(id, { status_fluxo: "dispensado" });
  },

  async reativar(id: ID): Promise<Intimacao> {
    return repositorio.update(id, { status_fluxo: "triagem" });
  },

  async obterCargaEquipe(): Promise<Record<ID, number>> {
    const { data, error } = await supabase.from("tarefas_prazos").select("advogado_id").neq("etapa_kanban", "concluido");
    if (error) throw new Error(mensagemDeErro(error));
    return (data ?? []).reduce<Record<ID, number>>((carga, tarefa) => {
      carga[tarefa.advogado_id] = (carga[tarefa.advogado_id] ?? 0) + 1;
      return carga;
    }, {});
  },
};
