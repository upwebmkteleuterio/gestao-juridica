/** Tipos compartilhados por todas as entidades. */

export type ID = string;

/** ISO 8601 (ex.: 2026-10-15T09:42:00-03:00). */
export type ISODate = string;

/** Data pura (ex.: 2026-10-15). */
export type DateOnly = string;

/** Perfil de acesso do sistema (single-tenant colaborativo). */
export type PerfilUsuario = "admin" | "advogado";

/** Origem de uma intimação exibida no painel. */
export type OrigemIntimacao = "djen" | "manual";

/** Status do processamento da IA sobre o payload bruto do DJEN. */
export type StatusAnaliseIA = "pendente" | "sucesso" | "falha";

/** Status da intimação no fluxo de triagem. */
export type StatusFluxoIntimacao = "triagem" | "fila" | "dispensado";

/** Etapas do Kanban de produção. */
export type EtapaKanban =
  | "fila"
  | "redacao"
  | "revisao"
  | "pronto_protocolo"
  | "concluido";

/** Origem da tarefa de prazo. */
export type OrigemTarefa = "djen" | "manual";

/** Estados da execução de captura no DJEN. */
export type StatusCaptura =
  | "ocioso"
  | "consultando"
  | "parcial"
  | "concluido"
  | "sem_novidades"
  | "falha";

/** Severidade visual de alertas e mensagens. */
export type Severidade = "info" | "warning" | "danger" | "success";

/** Tom de SLA usado em badges e cards do Kanban. */
export type SlaTone = "success" | "warning" | "danger" | "neutral";
