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

/** Filtros aplicáveis à listagem da Tela 1. */
export interface FiltroIntimacoes {
  busca: string;
  tribunal: string;
  disponibilizacaoDe: string;
  disponibilizacaoAte: string;
  apenasMinhaPauta: boolean;
  advogadoId: ID | null;
}
