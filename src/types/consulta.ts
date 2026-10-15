/** Contratos de consulta usados pela camada de serviço (futuras queries SQL). */

export interface OrdenacaoConsulta<TCampo extends string = string> {
  campo: TCampo;
  direcao: "asc" | "desc";
}

/**
 * Resposta paginada — mesmo formato que uma consulta com `range` +
 * `count` devolveria no Supabase.
 */
export interface ResultadoPaginado<T> {
  dados: T[];
  total: number;
  pagina: number;
  tamanhoPagina: number;
  totalPaginas: number;
}
