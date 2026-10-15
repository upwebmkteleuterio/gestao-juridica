import type { DateOnly, ID, ISODate, PerfilUsuario } from "./common";

/**
 * Tabela `advogados` — extensão do usuário de autenticação.
 * Armazena o perfil da equipe e a elegibilidade para a distribuição automática.
 */
export interface Advogado {
  id: ID;
  nome_completo: string;
  email_corporativo: string;
  oab_numero: string;
  oab_uf: string;
  perfil: PerfilUsuario;
  ativo_distribuicao: boolean;
  created_at: ISODate;
  /** Campos auxiliares de apresentação (não persistidos no banco). */
  cargo?: string;
  data_ingresso?: DateOnly;
}

export type AdvogadoInput = Omit<Advogado, "id" | "created_at">;

/** Linha da materialized view `view_produtividade_equipe`. */
export interface ProdutividadeEquipe {
  advogado_id: ID;
  total_prazos: number;
  concluidos_mes: number;
  criticos_48h: number;
}
