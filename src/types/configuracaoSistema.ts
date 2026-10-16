import type { ISODate } from "./common";

/**
 * Tabela `configuracoes_sistema` — singleton (id = 1).
 * Parâmetros globais geridos pelo admin (Tela 5 / 5.1).
 */
export interface ConfiguracaoSistema {
  id: number;
  oabs_monitoradas: string[];
  horario_cron_djen: string;
  prazo_padrao_dias_uteis: number | null;
  ia_modelo: string;
  ia_system_prompt: string;
  updated_at: ISODate;
}

export type ConfiguracaoSistemaInput = Omit<
  ConfiguracaoSistema,
  "id" | "updated_at"
>;
