import { tarefasPrazosMock } from "@/mocks";
import type {
  EtapaKanban,
  ID,
  TarefaPrazo,
  TarefaPrazoInput,
} from "@/types";
import { CHAVES, agora, criarId, criarRepositorio } from "./storage";

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
