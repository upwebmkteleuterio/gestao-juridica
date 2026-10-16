import { supabase } from "@/integrations/supabase/client";
import { diasAte } from "@/lib/format";
import { slaDeDataFatal } from "@/lib/sla";
import type {
  AdvogadoCarga,
  CargaAdvogado,
  ConsultaEsteira,
  EtapaKanban,
  ID,
  ResultadoEsteira,
  ResumoUrgenciaEsteira,
  TarefaPrazo,
  TarefaPrazoInput,
  UrgenciaEsteira,
} from "@/types";
import { mensagemDeErro } from "./erros";
import { criarRepositorioSupabase } from "./repositorioSupabase";

export const ETAPAS_KANBAN: EtapaKanban[] = ["fila", "redacao", "revisao", "pronto_protocolo", "concluido"];
const COLUNAS = "id, origem, intimacao_id, advogado_id, numero_processo, partes_resumo, tipo_peca, data_fatal, etapa_kanban, link_minuta, notas_internas, recibo_protocolo_url, data_ciencia, concluido_em, created_at, updated_at";
const COLUNAS_EMBED = `${COLUNAS}, intimacoes(tribunal_sigla, data_disponibilizacao, created_at)`;
const repositorio = criarRepositorioSupabase<TarefaPrazo, TarefaPrazoInput>({
  tabela: "tarefas_prazos",
  colunas: COLUNAS,
  montar: normalizar,
});

function normalizar(linha: TarefaPrazo): TarefaPrazo {
  return { ...linha, partes_resumo: linha.partes_resumo ?? "", tipo_peca: linha.tipo_peca ?? "" };
}

function semCampoApresentacao(input: TarefaPrazoInput): Omit<TarefaPrazoInput, "tribunal_sigla"> {
  const { tribunal_sigla, ...campos } = input;
  void tribunal_sigla;
  return campos;
}

function correspondeUrgencia(tarefa: TarefaPrazo, urgencia: UrgenciaEsteira): boolean {
  const sla = slaDeDataFatal(tarefa.data_fatal);
  const dias = diasAte(tarefa.data_fatal);
  switch (urgencia) {
    case "criticos": return sla.critico;
    case "hoje": return dias === 0;
    case "semana": return dias !== null && dias >= 0 && dias <= 7;
    case "em_dia": return !sla.critico && (dias === null || dias > 5);
    default: return true;
  }
}

function ordenarPorFatal(a: TarefaPrazo, b: TarefaPrazo): number {
  const fatalA = a.data_fatal ?? "9999-12-31";
  const fatalB = b.data_fatal ?? "9999-12-31";
  if (fatalA !== fatalB) return fatalA.localeCompare(fatalB);
  return a.tipo_peca.localeCompare(b.tipo_peca);
}

interface TarefaComIntimacao extends TarefaPrazo {
  intimacoes?: {
    tribunal_sigla: string | null;
    data_disponibilizacao: string | null;
    created_at: string | null;
  } | null;
}

function comTribunal(linha: TarefaComIntimacao): TarefaPrazo {
  const { intimacoes, ...tarefa } = linha;
  return {
    ...normalizar(tarefa),
    tribunal_sigla: intimacoes?.tribunal_sigla ?? null,
    data_disponibilizacao: intimacoes?.data_disponibilizacao ?? null,
    capturada_em: intimacoes?.created_at ?? null,
  };
}

export const tarefasPrazosService = {
  ...repositorio,

  async create(input: TarefaPrazoInput): Promise<TarefaPrazo> {
    return repositorio.create(semCampoApresentacao(input));
  },

  async update(id: ID, input: Partial<TarefaPrazoInput>): Promise<TarefaPrazo> {
    const { tribunal_sigla, ...campos } = input;
    void tribunal_sigla;
    return repositorio.update(id, campos);
  },

  async getById(id: ID): Promise<TarefaPrazo | null> {
    const { data, error } = await supabase.from("tarefas_prazos").select(COLUNAS_EMBED).eq("id", id).maybeSingle();
    if (error) throw new Error(mensagemDeErro(error));
    return data ? comTribunal(data as unknown as TarefaComIntimacao) : null;
  },

  async moverEtapa(id: ID, etapa_kanban: EtapaKanban): Promise<TarefaPrazo> {
    const { data, error } = await supabase.from("tarefas_prazos").update({ etapa_kanban }).eq("id", id).select(COLUNAS).single();
    if (error) throw new Error(mensagemDeErro(error));
    return normalizar(data as unknown as TarefaPrazo);
  },

  async listarEsteira(consulta: ConsultaEsteira = {}): Promise<ResultadoEsteira> {
    let query = supabase.from("tarefas_prazos").select(COLUNAS_EMBED);
    if (consulta.responsavelId) query = query.eq("advogado_id", consulta.responsavelId);
    const { data, error } = await query;
    if (error) throw new Error(mensagemDeErro(error));
    const base = ((data ?? []) as unknown as TarefaComIntimacao[]).map(comTribunal);
    const ativas = base.filter((tarefa) => tarefa.etapa_kanban !== "concluido");
    const resumo: ResumoUrgenciaEsteira = {
      criticos: ativas.filter((t) => correspondeUrgencia(t, "criticos")).length,
      hoje: ativas.filter((t) => correspondeUrgencia(t, "hoje")).length,
      semana: ativas.filter((t) => correspondeUrgencia(t, "semana")).length,
      emDia: ativas.filter((t) => correspondeUrgencia(t, "em_dia")).length,
      total: base.length,
    };
    const urgencia = consulta.urgencia ?? "todos";
    const filtradas = urgencia === "todos" ? base : ativas.filter((tarefa) => correspondeUrgencia(tarefa, urgencia));
    const ordenadas = [...filtradas].sort(ordenarPorFatal);
    return {
      colunas: ETAPAS_KANBAN.map((etapa) => ({ etapa, tarefas: ordenadas.filter((tarefa) => tarefa.etapa_kanban === etapa) })),
      resumo,
      total: ordenadas.length,
    };
  },

  async listarPorAdvogado(advogado_id: ID): Promise<TarefaPrazo[]> {
    const { data, error } = await supabase.from("tarefas_prazos").select(COLUNAS).eq("advogado_id", advogado_id);
    if (error) throw new Error(mensagemDeErro(error));
    return ((data ?? []) as unknown as TarefaPrazo[]).map(normalizar);
  },

  async cargaPorAdvogado(): Promise<Record<ID, number>> {
    const { data, error } = await supabase.from("tarefas_prazos").select("advogado_id").neq("etapa_kanban", "concluido");
    if (error) throw new Error(mensagemDeErro(error));
    return (data ?? []).reduce<Record<ID, number>>((carga, tarefa) => {
      carga[tarefa.advogado_id] = (carga[tarefa.advogado_id] ?? 0) + 1;
      return carga;
    }, {});
  },

  async listarCriticos(): Promise<TarefaPrazo[]> {
    const { data, error } = await supabase.from("tarefas_prazos").select(COLUNAS).neq("etapa_kanban", "concluido");
    if (error) throw new Error(mensagemDeErro(error));
    return ((data ?? []) as unknown as TarefaPrazo[]).map(normalizar)
      .filter((tarefa) => slaDeDataFatal(tarefa.data_fatal).critico)
      .sort((a, b) => (a.data_fatal ?? "").localeCompare(b.data_fatal ?? ""));
  },

  async contarAtivas(): Promise<number> {
    const { count, error } = await supabase.from("tarefas_prazos").select("id", { count: "exact", head: true }).neq("etapa_kanban", "concluido");
    if (error) throw new Error(mensagemDeErro(error));
    return count ?? 0;
  },

  async obterCapacidade(): Promise<CargaAdvogado[]> {
    const [advogados, tarefas] = await Promise.all([
      supabase.from("advogados").select("id, nome_completo"),
      supabase.from("tarefas_prazos").select(COLUNAS).neq("etapa_kanban", "concluido"),
    ]);
    if (advogados.error) throw new Error(mensagemDeErro(advogados.error));
    if (tarefas.error) throw new Error(mensagemDeErro(tarefas.error));
    const abertas = ((tarefas.data ?? []) as unknown as TarefaPrazo[]).map(normalizar);
    return (advogados.data ?? []).map((advogado) => {
      const proprias = abertas.filter((tarefa) => tarefa.advogado_id === advogado.id);
      return { advogado_id: advogado.id, nome_completo: advogado.nome_completo, total: proprias.length, criticos: proprias.filter((tarefa) => slaDeDataFatal(tarefa.data_fatal).critico).length };
    }).sort((a, b) => b.total - a.total);
  },

  async obterProdutividadeEquipe(): Promise<AdvogadoCarga[]> {
    const [advogados, tarefas] = await Promise.all([
      supabase.from("advogados").select("id, nome_completo, email_corporativo, oab_numero, oab_uf, perfil, ativo_distribuicao, cargo"),
      supabase.from("tarefas_prazos").select(COLUNAS),
    ]);
    if (advogados.error) throw new Error(mensagemDeErro(advogados.error));
    if (tarefas.error) throw new Error(mensagemDeErro(tarefas.error));
    const todas = ((tarefas.data ?? []) as unknown as TarefaPrazo[]).map(normalizar);
    return (advogados.data ?? []).map((advogado) => {
      const proprias = todas.filter((tarefa) => tarefa.advogado_id === advogado.id);
      const abertas = proprias.filter((tarefa) => tarefa.etapa_kanban !== "concluido");
      return {
        advogado_id: advogado.id,
        nome_completo: advogado.nome_completo,
        email_corporativo: advogado.email_corporativo,
        oab_numero: advogado.oab_numero ?? "",
        oab_uf: advogado.oab_uf ?? "",
        perfil: advogado.perfil,
        ativo_distribuicao: advogado.ativo_distribuicao,
        cargo: advogado.cargo,
        total_prazos: abertas.length,
        criticos_48h: abertas.filter((tarefa) => slaDeDataFatal(tarefa.data_fatal).critico).length,
        concluidos_mes: proprias.filter((tarefa) => tarefa.etapa_kanban === "concluido").length,
      };
    }).sort((a, b) => b.total_prazos - a.total_prazos);
  },

  async contarPorEtapa(): Promise<Record<EtapaKanban, number>> {
    const resultados = await Promise.all(ETAPAS_KANBAN.map((etapa) =>
      supabase.from("tarefas_prazos").select("id", { count: "exact", head: true }).eq("etapa_kanban", etapa),
    ));
    const contagem = {} as Record<EtapaKanban, number>;
    resultados.forEach((resultado, indice) => {
      if (resultado.error) throw new Error(mensagemDeErro(resultado.error));
      contagem[ETAPAS_KANBAN[indice]] = resultado.count ?? 0;
    });
    return contagem;
  },
};
