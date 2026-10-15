import { cva, type VariantProps } from "class-variance-authority";
import { CalendarClock, Sparkles } from "lucide-react";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { slaDeDataFatal } from "@/lib/sla";
import type { EtapaKanban, StatusFluxoIntimacao } from "@/types";

export const badgeVariants = cva(
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm px-2 py-0.5 text-[10px] font-semibold",
  {
    variants: {
      variant: {
        navy: "bg-navy-100 text-navy-800 dark:bg-navy-800/45 dark:text-navy-100",
        neutral: "bg-secondary text-muted-foreground",
        success: "bg-success-bg text-success",
        warning: "bg-warning-bg text-warning",
        danger: "bg-danger-bg text-danger",
        info: "bg-info-bg text-info",
        gold: "bg-gold-100 text-gold-600 dark:bg-gold-500/15 dark:text-gold-400",
      },
    },
    defaultVariants: { variant: "navy" },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

/* ------------------------------------------------------------------ */
/* Badges de domínio                                                   */
/* ------------------------------------------------------------------ */

const ROTULOS_FLUXO: Record<
  StatusFluxoIntimacao,
  { rotulo: string; variant: BadgeProps["variant"] }
> = {
  triagem: { rotulo: "Triagem", variant: "neutral" },
  fila: { rotulo: "Na esteira", variant: "info" },
  dispensado: { rotulo: "Dispensado", variant: "neutral" },
};

export function StatusBadge({
  status,
  className,
}: {
  status: StatusFluxoIntimacao;
  className?: string;
}) {
  const config = ROTULOS_FLUXO[status];
  return (
    <Badge variant={config.variant} className={className}>
      {config.rotulo}
    </Badge>
  );
}

const ROTULOS_ETAPA: Record<
  EtapaKanban,
  { rotulo: string; variant: BadgeProps["variant"] }
> = {
  fila: { rotulo: "Fila", variant: "neutral" },
  redacao: { rotulo: "Em redação", variant: "info" },
  revisao: { rotulo: "Em revisão", variant: "gold" },
  pronto_protocolo: { rotulo: "Pronto p/ protocolo", variant: "navy" },
  concluido: { rotulo: "Protocolado", variant: "success" },
};

export function EtapaBadge({
  etapa,
  className,
}: {
  etapa: EtapaKanban;
  className?: string;
}) {
  const config = ROTULOS_ETAPA[etapa];
  return (
    <Badge variant={config.variant} className={className}>
      {config.rotulo}
    </Badge>
  );
}

/** Badge de prazo com o tom de SLA e alerta pulsante nos itens críticos. */
export function DeadlineBadge({
  dataFatal,
  rotulo,
  className,
}: {
  dataFatal?: string | null;
  rotulo?: string;
  className?: string;
}) {
  const sla = slaDeDataFatal(dataFatal);
  return (
    <Badge
      variant={sla.tone === "neutral" ? "neutral" : sla.tone}
      className={cn(sla.critico && "animate-pulse", className)}
    >
      <CalendarClock className="h-3 w-3" aria-hidden="true" />
      {rotulo ?? sla.label}
    </Badge>
  );
}

/** Distingue claramente a sugestão da IA do prazo já conferido pelo humano. */
export function AIReviewBadge({
  conferido,
  className,
}: {
  conferido: boolean;
  className?: string;
}) {
  return (
    <Badge
      variant={conferido ? "success" : "gold"}
      className={className}
    >
      <Sparkles className="h-3 w-3" aria-hidden="true" />
      {conferido ? "Prazo confirmado" : "IA · a conferir"}
    </Badge>
  );
}
