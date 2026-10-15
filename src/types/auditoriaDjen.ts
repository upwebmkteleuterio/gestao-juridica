import type {
  DateOnly,
  ID,
  ISODate,
  StatusAnaliseIA,
  StatusCaptura,
} from "./common";
import type { ResultadoPaginado } from "./consulta";

/**
 * Linha da auditoria da API do CNJ (Tela 3): o payload bruto de
 * `intimacoes_djen_raw` já achatado nas 7 colunas do data grid.
 */
export interface LinhaAuditoriaDjen {
  id: ID;
  /** `id` oficial devolvido pelo CNJ (chave de deduplicação). */
  djen_id_original: string;
  tribunal_sigla: string;
  orgao_julgador: string;
  numero_processo: string;
  data_disponibilizacao: DateOnly;
  djen_hash: string;
  status_analise_ia: StatusAnaliseIA;
}

/**
 * Parâmetros da consulta de auditoria. Toda filtragem e paginação é
 * resolvida no serviço, simulando a query real (range + count).
 */
export interface ConsultaAuditoriaDjen {
  /** OAB monitorada, no formato de `oabs_monitoradas` (ex.: "197254/RJ"). */
  oab?: string;
  disponibilizacaoDe?: string;
  disponibilizacaoAte?: string;
  pagina?: number;
  tamanhoPagina?: number;
}

export type ResultadoAuditoriaDjen = ResultadoPaginado<LinhaAuditoriaDjen>;

/** Indicadores do topo da Tela 3 (headers simulados da API do CNJ). */
export interface IndicadoresIngestaoDjen {
  /** % de requisições sem falha de análise (0–100). */
  taxaSucesso: number;
  totalMes: number;
  /** Mês de referência ("2026-10") derivado da última captura. */
  mesReferencia: string;
  rateLimitLimite: number;
  rateLimitRestante: number;
  ultimaCapturaEm: ISODate | null;
  status: StatusCaptura;
}

/** Parâmetros do disparo manual de captura (Tela 3.1). */
export interface ParametrosCapturaDjen {
  oab_numero: string;
  oab_uf: string;
  disponibilizacaoDe: string;
  disponibilizacaoAte: string;
  /** Sigla opcional para restringir a um tribunal específico. */
  tribunal?: string;
}

/** Retorno do disparo manual — resumo do UPSERT executado pelo robô. */
export interface ResultadoCapturaDjen {
  status: StatusCaptura;
  recebidas: number;
  novas: number;
  duplicadas: number;
  mensagem: string;
  executado_em: ISODate;
}
