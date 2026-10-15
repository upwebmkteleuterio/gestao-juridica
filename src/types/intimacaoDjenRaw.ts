import type { ID, ISODate, StatusAnaliseIA } from "./common";

/**
 * Tabela `intimacoes_djen_raw` — log de ingestão (append only).
 * Guarda o payload bruto da API do CNJ e protege contra duplicidade via
 * `djen_id_original` (UNIQUE).
 */
export interface IntimacaoDjenRaw {
  id: ID;
  djen_id_original: string;
  djen_hash: string;
  payload_json: Record<string, unknown>;
  status_analise_ia: StatusAnaliseIA;
  criado_em: ISODate;
}

export type IntimacaoDjenRawInput = Omit<IntimacaoDjenRaw, "id">;
