import { RefreshCw, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

export interface EmptyStateProps {
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
  className?: string;
}

/** Estado vazio — preserva o contexto e aponta o próximo passo. */
export function EmptyState({
  titulo,
  descricao,
  acao,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-12 text-center",
        className,
      )}
    >
      <img
        src="/assets/empty-state.png"
        alt=""
        aria-hidden="true"
        className="mb-5 h-24 w-24 object-contain"
      />
      <h3>{titulo}</h3>
      {descricao ? (
        <p className="mt-2 max-w-sm text-[11px] leading-relaxed text-muted-foreground">
          {descricao}
        </p>
      ) : null}
      {acao ? <div className="mt-5">{acao}</div> : null}
    </div>
  );
}

export interface ErrorStateProps {
  titulo: string;
  descricao?: string;
  onRetry?: () => void;
  className?: string;
}

/** Estado de falha — mantém os filtros e oferece nova tentativa. */
export function ErrorState({
  titulo,
  descricao,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center px-6 py-12 text-center",
        className,
      )}
    >
      <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-danger-bg text-danger">
        <TriangleAlert className="h-5 w-5" aria-hidden="true" />
      </span>
      <h3>{titulo}</h3>
      {descricao ? (
        <p className="mt-2 max-w-sm text-[11px] leading-relaxed text-muted-foreground">
          {descricao}
        </p>
      ) : null}
      {onRetry ? (
        <Button className="mt-5 gap-2" onClick={onRetry}>
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          Tentar novamente
        </Button>
      ) : null}
    </div>
  );
}
