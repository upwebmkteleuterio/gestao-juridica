import type { ID, ISODate } from "./common";

/** Critério do algoritmo de distribuição em lote (Tela 1.1). */
export type CriterioDistribuicao = "igualitario" | "compensacao";

export interface AtribuicaoAdvogado {
  advogado_id: ID;
  quantidade: number;
  carga_atual: number;
}

/** Prévia matemática da distribuição, exibida antes da confirmação. */
export interface PreviaDistribuicao {
  total: number;
  participantes: ID[];
  atribuicoes: AtribuicaoAdvogado[];
  criterio: CriterioDistribuicao;
}

/** Resultado persistido após a confirmação do lote. */
export interface ResultadoDistribuicao extends PreviaDistribuicao {
  distribuido_em: ISODate;
  intimacao_ids: ID[];
  tarefa_ids: ID[];
}
