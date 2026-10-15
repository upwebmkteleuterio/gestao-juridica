import type { OrdenacaoConsulta, ResultadoPaginado } from "./consulta";
import type { DateOnly, ID, ISODate, StatusFluxoIntimacao } from "./common";

/**
 * Tabela `intimacoes` — triagem e processamento pela IA.
 * Alimenta o Painel do Gestor (Tela 1).
 */
export interface Intimacao {
  id: ID;
  raw_id: ID;
  numero_processo: string;
  tribunal_sigla: string;
  orgao_julgador: string;
  data_disponibilizacao: DateOnly;
  acao_sugerida_ia: string;
  resumo_ia: string;
  data_fatal_calculada: DateOnly | null;
  advogado_id: ID | null;
  status_fluxo: StatusFluxoIntimacao;
  distribuido_em: ISODate | null;
}

export type IntimacaoInput = Omit<Intimacao, "id">;

/** Campos ordenáveis na listagem da Tela 1. */
export type CampoOrdenacaoIntimacao =
  | "data_disponibilizacao"
  | "numero_processo"
  | "data_fatal_calculada"
  | "tribunal_sigla";

/**
 * Parâmetros aceitos pela consulta de intimações. Toda filtragem, busca e
 * paginação acontece no serviço (simulando o backend), nunca na tela.
 */
export interface ConsultaIntimacoes {
  busca?: string;
  tribunal?: string;
  disponibilizacaoDe?: string;
  disponibilizacaoAte?: string;
  status?: StatusFluxoIntimacao | "todos";
  /** `null`/`undefined` = todas as intimações. */
  advogadoId?: ID | null;
  pagina?: number;
  tamanhoPagina?: number;
  ordenacao?: OrdenacaoConsulta<CampoOrdenacaoIntimacao>;
}

/** Filtros persistidos na UI (Zustand) antes de virarem consulta. */
export interface FiltroIntimacoes {
  busca: string;
  tribunal: string;
  disponibilizacaoDe: string;
  disponibilizacaoAte: string;
  apenasMinhaPauta: boolean;
  advogadoId: ID | null;
}

/** Indicadores do topo da Tela 1 (derivados no serviço). */
export interface IndicadoresIntimacoes {
  /** Intimações da última data de disponibilização capturada. */
  novasHoje: number;
  dataReferencia: DateOnly;
  /** Prazos fatais dentro dos próximos 7 dias. */
  criticosSemana: number;
  /** Em triagem e ainda sem responsável. */
  pendentesAtribuicao: number;
}

/** Carga operacional por advogado (base da barra de capacidade). */
export interface CargaAdvogado {
  advogado_id: ID;
  nome_completo: string;
  total: number;
  criticos: number;
}

export type ResultadoConsultaIntimacoes = ResultadoPaginado<Intimacao>;
