import { advogadosMock, intimacoesMock, tarefasPrazosMock } from "@/mocks";
import { diasAte } from "@/lib/format";
import { slaDeDataFatal } from "@/lib/sla";
import type {
  Advogado,
  AdvogadoCarga,
  CargaAdvogado,
  ConsultaEsteira,
  EtapaKanban,
  ID,
  Intimacao,
  ResultadoEsteira,
  ResumoUrgenciaEsteira,
  TarefaPrazo,
  TarefaPrazoInput,
  UrgenciaEsteira,
} from "@/types";
import {
  CHAVES,
  agora,
  criarId,
  criarRepositorio,
  delay,
  lerColecao,
} from "./storage";

/** Monta a entidade completa a partir do formulário (id + timestamps). */
export function montarTarefa(input: TarefaPrazoInput): TarefaPrazo {
  const carimbo = agora();
  return {
    ...input,
    id: criarId("tar"),
    created_at: carimbo,
    updated_at: carimbo,
  };
}

export const ETAPAS_KANBAN: EtapaKanban[] = [
  "fila",
  "redacao",
  "revisao",
  "pronto_protocolo",
  "concluido",
];

const repositorio = criarRepositorio<TarefaPrazo, TarefaPrazoInput>({
  chave: CHAVES.tarefasPrazos,
  seed: tarefasPrazosMock,
  construir: montarTarefa,
  antesDeAtualizar: (proximo, anterior) => ({
    ...proximo,
    concluido_em:
      proximo.etapa_kanban === "concluido"
        ? (anterior.concluido_em ?? agora())
        : null,
    updated_at: agora(),
  }),
});

/** Sigla do tribunal do card: informada no cadastro ou herdada da intimação. */
function tribunalDaTarefa(
  tarefa: TarefaPrazo,
  intimacoes: Intimacao[],
): string | null {
  if (tarefa.tribunal_sigla) return tarefa.tribunal_sigla;
  if (!tarefa.intimacao_id) return null;
  return (
    intimacoes.find((intimacao) => intimacao.id === tarefa.intimacao_id)
      ?.tribunal_sigla ?? null
  );
}

/** Faixas das pílulas de urgência da Tela 2 (SLA lido da data fatal). */
function correspondeUrgencia(
  tarefa: TarefaPrazo,
  urgencia: UrgenciaEsteira,
): boolean {
  const sla = slaDeDataFatal(tarefa.data_fatal);
  const dias = diasAte(tarefa.data_fatal);
  switch (urgencia) {
    case "criticos":
      return sla.critico;
    case "hoje":
      return dias === 0;
    case "semana":
      return dias !== null && dias >= 0 && dias <= 7;
    case "em_dia":
      return !sla.critico && (dias === null || dias > 5);
    default:
      return true;
  }
}

/** Ordenação do Kanban: `data_fatal` ascendente, sem prazo por último. */
function ordenarPorFatal(a: TarefaPrazo, b: TarefaPrazo): number {
  const fatalA = a.data_fatal ?? "9999-12-31";
  const fatalB = b.data_fatal ?? "9999-12-31";
  if (fatalA !== fatalB) return fatalA.localeCompare(fatalB);
  return a.tipo_peca.localeCompare(b.tipo_peca);
}

/** Repositório da tabela `tarefas_prazos` (Kanban de produção). */
export const tarefasPrazosService = {
  ...repositorio,

  /**
   * Mesma tarefa, com a sigla do tribunal resolvida (herdada da intimação
   * quando a origem é o DJEN) — usada pela execução da tarefa (Tela 2.1).
   */
  async getById(id: ID): Promise<TarefaPrazo | null> {
    const tarefa = await repositorio.getById(id);
    if (!tarefa) return null;
    const intimacoes = lerColecao<Intimacao>(CHAVES.intimacoes, intimacoesMock);
    return { ...tarefa, tribunal_sigla: tribunalDaTarefa(tarefa, intimacoes) };
  },

  async moverEtapa(id: ID, etapa_kanban: EtapaKanban): Promise<TarefaPrazo> {
    return repositorio.update(id, { etapa_kanban });
  },

  /**
   * Kanban da Tela 2. O escopo (pauta pessoal/geral) e a urgência são
   * resolvidos aqui; a tela apenas desenha as colunas devolvidas.
   */
  async listarEsteira(
    consulta: ConsultaEsteira = {},
  ): Promise<ResultadoEsteira> {
    const intimacoes = lerColecao<Intimacao>(CHAVES.intimacoes, intimacoesMock);
    const tarefas = lerColecao<TarefaPrazo>(
      CHAVES.tarefasPrazos,
      tarefasPrazosMock,
    );

    const base = tarefas
      .filter((tarefa) => {
        if (
          consulta.escopo === "meus" &&
          consulta.advogadoId &&
          tarefa.advogado_id !== consulta.advogadoId
        ) {
          return false;
        }
        return true;
      })
      .map((tarefa) => ({
        ...tarefa,
        tribunal_sigla: tribunalDaTarefa(tarefa, intimacoes),
      }));

    const ativas = base.filter((tarefa) => tarefa.etapa_kanban !== "concluido");
    const resumo: ResumoUrgenciaEsteira = {
      criticos: ativas.filter((t) => correspondeUrgencia(t, "criticos")).length,
      hoje: ativas.filter((t) => correspondeUrgencia(t, "hoje")).length,
      semana: ativas.filter((t) => correspondeUrgencia(t, "semana")).length,
      emDia: ativas.filter((t) => correspondeUrgencia(t, "em_dia")).length,
      total: base.length,
    };

    const urgencia = consulta.urgencia ?? "todos";
    const filtradas =
      urgencia === "todos"
        ? base
        : ativas.filter((tarefa) => correspondeUrgencia(tarefa, urgencia));
    const ordenadas = [...filtradas].sort(ordenarPorFatal);

    return delay({
      colunas: ETAPAS_KANBAN.map((etapa) => ({
        etapa,
        tarefas: ordenadas.filter((tarefa) => tarefa.etapa_kanban === etapa),
      })),
      resumo,
      total: ordenadas.length,
    });
  },

  async listarPorAdvogado(advogado_id: ID): Promise<TarefaPrazo[]> {
    const todas = await repositorio.getAll();
    return todas.filter((tarefa) => tarefa.advogado_id === advogado_id);
  },

  /** Carga ativa (etapas não concluídas) por advogado. */
  async cargaPorAdvogado(): Promise<Record<ID, number>> {
    const todas = await repositorio.getAll();
    return todas
      .filter((tarefa) => tarefa.etapa_kanban !== "concluido")
      .reduce<Record<ID, number>>((acc, tarefa) => {
        acc[tarefa.advogado_id] = (acc[tarefa.advogado_id] ?? 0) + 1;
        return acc;
      }, {});
  },

  /** Tarefas com prazo crítico (< 48h) ainda em produção — central de alertas. */
  async listarCriticos(): Promise<TarefaPrazo[]> {
    const todas = await repositorio.getAll();
    return todas
      .filter(
        (tarefa) =>
          tarefa.etapa_kanban !== "concluido" &&
          slaDeDataFatal(tarefa.data_fatal).critico,
      )
      .sort((a, b) => (a.data_fatal ?? "").localeCompare(b.data_fatal ?? ""));
  },

  /** Total de tarefas ainda em produção (badge da sidebar). */
  async contarAtivas(): Promise<number> {
    const todas = await repositorio.getAll();
    return todas.filter((tarefa) => tarefa.etapa_kanban !== "concluido")
      .length;
  },

  /** Carga operacional por advogado, já com o nome (Tela 1 e 1.1). */
  async obterCapacidade(): Promise<CargaAdvogado[]> {
    const tarefas = lerColecao<TarefaPrazo>(
      CHAVES.tarefasPrazos,
      tarefasPrazosMock,
    );
    const advogados = lerColecao<Advogado>(CHAVES.advogados, advogadosMock);

    const capacidade = advogados
      .map((advogado) => {
        const ativas = tarefas.filter(
          (tarefa) =>
            tarefa.advogado_id === advogado.id &&
            tarefa.etapa_kanban !== "concluido",
        );
        return {
          advogado_id: advogado.id,
          nome_completo: advogado.nome_completo,
          total: ativas.length,
          criticos: ativas.filter((tarefa) =>
            slaDeDataFatal(tarefa.data_fatal).critico,
          ).length,
        };
      })
      .sort((a, b) => b.total - a.total);

    return delay(capacidade);
  },

  /**
   * Cards do Painel da Equipe (Tela 4): a materialized view
   * `view_produtividade_equipe` unida a `advogados`. `total_prazos` conta
   * apenas prazos em aberto; `criticos_48h` lê o SLA da data fatal.
   */
  async obterProdutividadeEquipe(): Promise<AdvogadoCarga[]> {
    const tarefas = lerColecao<TarefaPrazo>(
      CHAVES.tarefasPrazos,
      tarefasPrazosMock,
    );
    const advogados = lerColecao<Advogado>(CHAVES.advogados, advogadosMock);

    const produtividade = advogados
      .map<AdvogadoCarga>((advogado) => {
        const proprias = tarefas.filter(
          (tarefa) => tarefa.advogado_id === advogado.id,
        );
        const abertas = proprias.filter(
          (tarefa) => tarefa.etapa_kanban !== "concluido",
        );
        return {
          advogado_id: advogado.id,
          nome_completo: advogado.nome_completo,
          email_corporativo: advogado.email_corporativo,
          oab_numero: advogado.oab_numero,
          oab_uf: advogado.oab_uf,
          perfil: advogado.perfil,
          ativo_distribuicao: advogado.ativo_distribuicao,
          cargo: advogado.cargo,
          total_prazos: abertas.length,
          criticos_48h: abertas.filter(
            (tarefa) => slaDeDataFatal(tarefa.data_fatal).critico,
          ).length,
          concluidos_mes: proprias.filter(
            (tarefa) => tarefa.etapa_kanban === "concluido",
          ).length,
        };
      })
      .sort((a, b) => b.total_prazos - a.total_prazos);

    return delay(produtividade);
  },

  async contarPorEtapa(): Promise<Record<EtapaKanban, number>> {
    const todas = await repositorio.getAll();
    const contagem = ETAPAS_KANBAN.reduce(
      (acc, etapa) => ({ ...acc, [etapa]: 0 }),
      {} as Record<EtapaKanban, number>,
    );
    todas.forEach((tarefa) => {
      contagem[tarefa.etapa_kanban] += 1;
    });
    return contagem;
  },
};
