import type { SlaTone } from "@/types";
import { diasAte } from "./format";

export interface SlaInfo {
  tone: SlaTone;
  label: string;
  /** Prazo crítico (< 48h) — habilita a borda vermelha pulsante no Kanban. */
  critico: boolean;
}

/**
 * Regras visuais de SLA do UI Kit:
 * verde = no prazo · âmbar = atenção (< 5 dias) · vermelho = crítico (< 48h).
 * Não calcula prazos jurídicos — apenas lê a data fatal já confirmada.
 */
export function calcularSla(dias: number | null): SlaInfo {
  if (dias === null) {
    return { tone: "neutral", label: "Sem prazo", critico: false };
  }
  if (dias < 0) {
    return { tone: "danger", label: "Vencido", critico: true };
  }
  if (dias === 0) {
    return { tone: "danger", label: "Prazo hoje", critico: true };
  }
  if (dias === 1) {
    return { tone: "danger", label: "Vence amanhã", critico: true };
  }
  if (dias <= 2) {
    return { tone: "danger", label: `Crítico · ${dias} dias`, critico: true };
  }
  if (dias <= 5) {
    return { tone: "warning", label: `Atenção · ${dias} dias`, critico: false };
  }
  return { tone: "success", label: "No prazo", critico: false };
}

export function slaDeDataFatal(dataFatal?: string | null): SlaInfo {
  return calcularSla(diasAte(dataFatal));
}
