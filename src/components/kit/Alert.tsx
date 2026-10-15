import { CheckCircle2, Info, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Severidade } from "@/types";

const ESTILOS: Record<
  Severidade,
  { container: string; icone: ReactNode }
> = {
  info: {
    container: "border-info/25 bg-info-bg text-info",
    icone: <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />,
  },
  warning: {
    container: "border-warning/25 bg-warning-bg text-warning",
    icone: (
      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
    ),
  },
  danger: {
    container: "border-danger/25 bg-danger-bg text-danger",
    icone: (
      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
    ),
  },
  success: {
    container: "border-success/25 bg-success-bg text-success",
    icone: (
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
    ),
  },
};

export interface AlertProps {
  severidade?: Severidade;
  titulo: string;
  children?: ReactNode;
  className?: string;
  acao?: ReactNode;
}

/** Mensagem de estado do sistema (sucesso, atenção, falha, informação). */
export function Alert({
  severidade = "info",
  titulo,
  children,
  className,
  acao,
}: AlertProps) {
  const estilo = ESTILOS[severidade];
  return (
    <div
      role={severidade === "danger" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-3 rounded-sm border px-4 py-3 text-[11px]",
        estilo.container,
        className,
      )}
    >
      {estilo.icone}
      <div className="flex-1">
        <strong className="font-semibold">{titulo}</strong>
        {children ? (
          <div className="mt-1 text-[10px] opacity-90">{children}</div>
        ) : null}
      </div>
      {acao}
    </div>
  );
}
