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
  /** Campos persistidos na tabela de advogados. */
  cargo?: string;
  data_ingresso?: DateOnly;
}

export type AdvogadoInput = Omit<Advogado, "id" | "created_at">;

export interface MembroEquipeInput {
  nome_completo: string;
  email_corporativo: string;
  oab_numero: string;
  oab_uf: string;
  perfil: PerfilUsuario;
  ativo_distribuicao: boolean;
  cargo?: string;
  data_ingresso?: DateOnly;
}

export interface CriarMembroEquipeInput extends MembroEquipeInput {
  pode_entrar: boolean;
  senha: string;
}

export interface AtualizarMembroEquipeInput extends MembroEquipeInput {
  id: ID;
}

export interface DefinirAcessoEquipeInput {
  id: ID;
  pode_entrar: boolean;
}

export interface AcessoAdvogado {
  id: ID;
  email: string;
  pode_entrar: boolean;
  banido_ate: ISODate | null;
}

/** Linha da materialized view `view_produtividade_equipe`. */
export interface ProdutividadeEquipe {
  advogado_id: ID;
  total_prazos: number;
  concluidos_mes: number;
  criticos_48h: number;
}

/**
 * `view_produtividade_equipe` unida a `advogados` — alimenta os cards do
 * Painel da Equipe (Tela 4). `total_prazos` conta apenas prazos em aberto.
 */
export interface AdvogadoCarga extends ProdutividadeEquipe {
  nome_completo: string;
  email_corporativo: string;
  oab_numero: string;
  oab_uf: string;
  perfil: PerfilUsuario;
  ativo_distribuicao: boolean;
  /** Cargo persistido na tabela de advogados. */
  cargo?: string;
  /** Data de ingresso na banca, exibida no card do Painel da Equipe. */
  data_ingresso?: DateOnly;
}
