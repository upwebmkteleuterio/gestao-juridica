import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface PageHeadingProps {
  eyebrow?: string;
  titulo: string;
  descricao?: string;
  acoes?: ReactNode;
  className?: string;
}

/** Cabeçalho de página — mesmo alinhamento em todos os módulos. */
export function PageHeading({
  eyebrow,
  titulo,
  descricao,
  acoes,
  className,
}: PageHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="eyebrow mb-2 text-gold-600 dark:text-gold-400">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-2xl sm:text-[2rem]">{titulo}</h1>
        {descricao ? (
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
            {descricao}
          </p>
        ) : null}
      </div>
      {acoes ? (
        <div className="flex flex-wrap items-center gap-2">{acoes}</div>
      ) : null}
    </div>
  );
}

export interface SectionHeadingProps {
  indice?: string;
  titulo: string;
  descricao?: string;
  acoes?: ReactNode;
  className?: string;
}

/** Cabeçalho de seção com índice opcional (padrão do catálogo do kit). */
export function SectionHeading({
  indice,
  titulo,
  descricao,
  acoes,
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "mb-4 flex flex-wrap items-start justify-between gap-3",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {indice ? (
          <span className="rounded-sm border border-gold-500/35 px-1.5 py-0.5 text-[11px] text-gold-600 dark:text-gold-400">
            {indice}
          </span>
        ) : null}
        <div>
          <h2>{titulo}</h2>
          {descricao ? (
            <p className="mt-1 text-[11px] text-muted-foreground">
              {descricao}
            </p>
          ) : null}
        </div>
      </div>
      {acoes ? (
        <div className="flex flex-wrap items-center gap-2">{acoes}</div>
      ) : null}
    </div>
  );
}
