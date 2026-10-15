import type { DateOnly, ID, ISODate, StatusAnaliseIA, StatusCaptura } from "./common";
import type { ResultadoPaginado } from "./consulta";

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

export interface ConsultaAuditoriaDjen {
  /** OAB monitorada no formato "197254/RJ". */
  oab?: string;
  disponibilizacaoDe?: string;
  disponibilizacaoAte?: string;
  pagina?: number;
  tamanhoPagina?: number;
}

export type ResultadoAuditoriaDjen = ResultadoPaginado<LinhaAuditoriaDjen>;

export interface IndicadoresIngestaoDjen {
  taxaSucesso: number;
  totalMes: number;
  mesReferencia: string;
  rateLimitLimite: number;
  rateLimitRestante: number;
  ultimaCapturaEm: ISODate | null;
  status: StatusCaptura;
}

export interface CapturaDjen {
  id: ID;
  oab_numero: string | null;
  oab_uf: string | null;
  tribunal_sigla: string | null;
  disponibilizacao_de: DateOnly | null;
  disponibilizacao_ate: DateOnly | null;
  meio: string;
  origem_disparo: "manual" | "cron";
  status: StatusCaptura;
  paginas_concluidas: number;
  itens_recebidos: number;
  itens_novos: number;
  itens_duplicados: number;
  parcial: boolean;
  mensagem: string | null;
  erro: string | null;
  disparada_por: ID | null;
  iniciada_em: ISODate;
  concluida_em: ISODate | null;
  rate_limit_limite: number | null;
  rate_limit_restante: number | null;
}

export interface ParametrosCapturaDjen {
  oab_numero: string;
  oab_uf: string;
  disponibilizacaoDe?: string;
  disponibilizacaoAte?: string;
  tribunal?: string;
  itensPorPagina?: 5 | 100;
  meio?: "D" | "E";
  numeroProcesso?: string;
  nomeParte?: string;
  nomeAdvogado?: string;
  texto?: string;
}

export interface ResultadoCapturaDjen {
  status: StatusCaptura;
  recebidas: number;
  novas: number;
  duplicadas: number;
  parcial: boolean;
  paginas: number;
  mensagem: string;
  executado_em: ISODate;
}
