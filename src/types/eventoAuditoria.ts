import type { ID, ISODate } from "./common";

/**
 * Tabela `eventos_auditoria` — trilha de operações.
 * Capturas, análises, distribuições e mudanças de etapa (Tela "Histórico").
 */
export interface EventoAuditoria {
  id: ID;
  ator_id: ID | null;
  entidade: string;
  entidade_id: ID;
  acao: string;
  antes: string | null;
  depois: string | null;
  criado_em: ISODate;
}

export type EventoAuditoriaInput = Omit<EventoAuditoria, "id" | "criado_em">;
