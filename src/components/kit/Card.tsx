import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "./Skeleton";

/** Superfície branca padrão do kit (cartões e painéis). */
export function Panel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-md border border-border bg-card", className)}
      {...props}
    />
  );
}

export interface PanelHeaderProps {
  titulo: string;
  descricao?: string;
  acoes?: ReactNode;
  icone?: ReactNode;
  className?: string;
}

export function PanelHeader({
  titulo,
  descricao,
  acoes,
  icone,
  className,
}: PanelHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4",
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        {icone ? (
          <span className="mt-0.5 text-muted-foreground">{icone}</span>
        ) : null}
        <div>
          <h3>{titulo}</h3>
          {descricao ? (
            <p className="mt-1 text-[11px] text-muted-foreground">{descricao}</p>
          ) : null}
        </div>
      </div>
      {acoes ? (
        <div className="flex flex-wrap items-center gap-2">{acoes}</div>
      ) : null}
    </div>
  );
}

export interface KpiCardProps {
  titulo: string;
  valor?: ReactNode;
  contexto?: string;
  icone?: ReactNode;
  /** Selo opcional exibido ao lado do título (ex.: urgência, pendências). */
  selo?: ReactNode;
  /**
   * Substitui o bloco numérico por um conteúdo próprio — usado pelo card
   * de capacidade operacional, que traz uma barra gráfica.
   */
  conteudo?: ReactNode;
  tom?: "default" | "urgent" | "success";
  carregando?: boolean;
  className?: string;
}

/** Indicador numérico do topo dos painéis. */
export function KpiCard({
  titulo,
  valor,
  contexto,
  icone,
  selo,
  conteudo,
  tom = "default",
  carregando = false,
  className,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        "rounded-md border p-5",
        tom === "urgent"
          ? "border-danger/25 bg-danger-bg/40"
          : "border-border bg-card",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
          {titulo}
        </span>
        <span className="flex items-center gap-2">
          {selo}
          {icone ? (
            <span
              className={cn(
                "text-muted-foreground",
                tom === "urgent" && "text-danger",
              )}
            >
              {icone}
            </span>
          ) : null}
        </span>
      </div>
      {carregando ? (
        <Skeleton className="mt-4 h-7 w-16" />
      ) : conteudo ? (
        <div className="mt-3">{conteudo}</div>
      ) : (
        <strong
          className={cn(
            "mt-2 block text-3xl font-semibold leading-tight tracking-tight",
            tom === "urgent" && "text-danger",
            tom === "success" && "text-success",
          )}
        >
          {valor}
        </strong>
      )}
      {contexto ? (
        <p className="mt-1 text-[10px] text-muted-foreground">{contexto}</p>
      ) : null}
    </div>
  );
}
