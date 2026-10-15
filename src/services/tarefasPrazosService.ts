import { advogadosMock, tarefasPrazosMock } from "@/mocks";
import { slaDeDataFatal } from "@/lib/sla";
import type {
  Advogado,
  CargaAdvogado,
  EtapaKanban,
  ID,
  TarefaPrazo,
  TarefaPrazoInput,
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

/** Repositório da tabela `tarefas_prazos` (Kanban de produção). */
export const tarefasPrazosService = {
  ...repositorio,

  async moverEtapa(id: ID, etapa_kanban: EtapaKanban): Promise<TarefaPrazo> {
    return repositorio.update(id, { etapa_kanban });
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
