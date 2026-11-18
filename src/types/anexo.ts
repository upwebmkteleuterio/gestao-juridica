import type { ID, ISODate } from "./common";

export interface Anexo {
  id: ID;
  tarefa_id: ID | null;
  intimacao_id: ID | null;
  caminho: string;
  nome_arquivo: string;
  tipo_arquivo: string | null;
  tamanho_bytes: number | null;
  enviado_por: ID | null;
  criado_em: ISODate;
}

export type AnexoVinculo = { tarefa_id: ID; intimacao_id?: never } | { intimacao_id: ID; tarefa_id?: never };
