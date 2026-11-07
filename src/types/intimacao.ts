import type { OrdenacaoConsulta, ResultadoPaginado } from "./consulta";
import type {
  DateOnly,
  ID,
  ISODate,
  OrigemIntimacao,
  StatusAnaliseIA,
  StatusFluxoIntimacao,
} from "./common";

/**
 * Tabela `intimacoes` — triagem e processamento pela IA.
 * Publicações do DJEN podem ter um payload bruto e data de disponibilização;
 * registros manuais não possuem esses campos.
 */
export interface Intimacao {
  id: ID;
  raw_id: ID | null;
  numero_processo: string;
  tribunal_sigla: string;
  orgao_julgador: string;
  data_disponibilizacao: DateOnly | null;
  origem: OrigemIntimacao;
  observacoes: string | null;
  duplicado: boolean;
  acao_sugerida_ia: string;
  resumo_ia: string;
  /** Prazo exatamente como o texto indicou, ou "não identificado". */
  prazo_extraido_texto: string | null;
  data_fatal_calculada: DateOnly | null;
  advogado_id: ID | null;
  status_fluxo: StatusFluxoIntimacao;
  distribuido_em: ISODate | null;
  /** Trecho literal do texto que fundamenta o parecer da IA. */
  trecho_fundamentador: string;
  /** O que ainda falta para cumprir a determinação. */
  pendencias: string[];
  status_analise: StatusAnaliseIA;
  analisado_em: ISODate | null;
}

export type IntimacaoInput = Omit<Intimacao, "id">;

/**
 * Tabela `analises_ia` — histórico append-only: uma linha por tentativa de
 * análise, inclusive as que falharam, com o motivo.
 */
export interface AnaliseIA {
  id: ID;
  raw_id: ID;
  modelo: string;
  status: StatusAnaliseIA;
  resumo: string | null;
  acao_sugerida: string | null;
  prazo_texto: string | null;
  prazo_data: DateOnly | null;
  trecho_fundamentador: string | null;
  pendencias: string[];
  motivo_falha: string | null;
  duracao_ms: number | null;
  criado_em: ISODate;
}

/** Retorno da análise disparada no servidor. */
export interface ResultadoAnaliseIA {
  processadas: number;
  sucessos: number;
  falhas: number;
  restantes: number;
  modelo: string;
  mensagem: string;
}

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
