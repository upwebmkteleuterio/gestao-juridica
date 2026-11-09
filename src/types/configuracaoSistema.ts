import type { DateOnly, ISODate } from "./common";

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
  /**
   * Marco zero do painel: só conta publicações a partir desta data.
   * `null` desliga o marco.
   */
  marco_zero: DateOnly | null;
  /** O marco zero filtra os indicadores do topo. */
  marco_zero_indicadores: boolean;
  /** O marco zero filtra a listagem de intimações. */
  marco_zero_lista: boolean;
  /** O marco zero filtra a exportação em planilha. */
  marco_zero_exportacao: boolean;
  updated_at: ISODate;
}

export type ConfiguracaoSistemaInput = Omit<
  ConfiguracaoSistema,
  "id" | "updated_at"
>;
