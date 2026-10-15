import type {
  DateOnly,
  EtapaKanban,
  ID,
  ISODate,
  OrigemTarefa,
} from "./common";

/**
 * Tabela `tarefas_prazos` — o Kanban de produção.
 * Une intimações automáticas do DJEN com prazos cadastrados manualmente.
 */
export interface TarefaPrazo {
  id: ID;
  origem: OrigemTarefa;
  intimacao_id: ID | null;
  advogado_id: ID;
  numero_processo: string;
  partes_resumo: string;
  tipo_peca: string;
  data_fatal: DateOnly | null;
  etapa_kanban: EtapaKanban;
  link_minuta: string | null;
  notas_internas: string | null;
  recibo_protocolo_url: string | null;
  concluido_em: ISODate | null;
  created_at: ISODate;
  updated_at: ISODate;
}

export type TarefaPrazoInput = Omit<
  TarefaPrazo,
  "id" | "created_at" | "updated_at"
>;
