import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type {
  HTMLAttributes,
  ReactNode,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";
import { Button, IconButton } from "./Button";

export function TableWrap({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("w-full overflow-auto", className)} {...props} />
  );
}

export function Table({
  className,
  ...props
}: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <table
      className={cn("w-full border-collapse text-left text-[11px]", className)}
      {...props}
    />
  );
}

export function TableHead({
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("bg-secondary/60", className)} {...props} />;
}

export function TableBody({
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={className} {...props} />;
}

export function TableRow({
  className,
  ...props
}: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        "border-b border-border/70 transition-colors last:border-0 hover:bg-secondary/40",
        className,
      )}
      {...props}
    />
  );
}

export function TableHeaderCell({
  className,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope="col"
      className={cn(
        "whitespace-nowrap border-y border-border px-4 py-3 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({
  className,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-4 py-3.5 align-middle", className)} {...props} />;
}

export interface TableToolbarProps {
  titulo: string;
  descricao?: string;
  acoes?: ReactNode;
  className?: string;
}

export function TableToolbar({
  titulo,
  descricao,
  acoes,
  className,
}: TableToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-3 px-5 py-4",
        className,
      )}
    >
      <div>
        <h3>{titulo}</h3>
        {descricao ? (
          <p className="mt-1 text-[11px] text-muted-foreground">{descricao}</p>
        ) : null}
      </div>
      {acoes ? (
        <div className="flex flex-wrap items-center gap-2">{acoes}</div>
      ) : null}
    </div>
  );
}

export function TableFooter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 border-t border-border px-5 py-3 text-[10px] text-muted-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}

export interface PaginationProps {
  pagina: number;
  totalPaginas: number;
  onAnterior: () => void;
  onProxima: () => void;
  className?: string;
}

export function Pagination({
  pagina,
  totalPaginas,
  onAnterior,
  onProxima,
  className,
}: PaginationProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span>
        Página {pagina} de {Math.max(totalPaginas, 1)}
      </span>
      <IconButton
        size="icon-sm"
        variant="secondary"
        onClick={onAnterior}
        disabled={pagina <= 1}
        aria-label="Página anterior"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </IconButton>
      <IconButton
        size="icon-sm"
        variant="secondary"
        onClick={onProxima}
        disabled={pagina >= totalPaginas}
        aria-label="Próxima página"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </IconButton>
    </div>
  );
}

export interface BulkSelectionBarProps {
  selecionados: number;
  onLimpar?: () => void;
  children?: ReactNode;
  className?: string;
}

/** Barra de ações em lote — sempre informa a contagem selecionada. */
export function BulkSelectionBar({
  selecionados,
  onLimpar,
  children,
  className,
}: BulkSelectionBarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-sm border border-border bg-secondary/60 px-4 py-2.5 text-[10px]",
        className,
      )}
    >
      <span className="font-semibold">{selecionados} selecionadas</span>
      {onLimpar ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={onLimpar}
          className="gap-1"
        >
          <X className="h-3 w-3" />
          Limpar seleção
        </Button>
      ) : null}
      <div className="ml-auto flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}
