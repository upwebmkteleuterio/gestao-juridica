import type { ID } from "@/types";
import { cn } from "@/lib/utils";
import { Avatar } from "./Avatar";

export interface ItemCapacidade {
  advogado_id: ID;
  nome_completo: string;
  total: number;
  criticos?: number;
}

export interface CapacityMeterProps {
  itens: ItemCapacidade[];
  /** Oculta o avatar para o formato compacto (cards de KPI). */
  compacto?: boolean;
  /** Destaque aplicado à linha de um advogado específico. */
  destacadoId?: ID;
  vazio?: string;
  className?: string;
}

/**
 * Barra gráfica de volume de tarefas por advogado.
 * Usada no card "Capacidade operacional" (Tela 1) e no panorama da
 * distribuição (Tela 1.1).
 */
export function CapacityMeter({
  itens,
  compacto = false,
  destacadoId,
  vazio = "Sem carga atribuída no momento.",
  className,
}: CapacityMeterProps) {
  if (itens.length === 0) {
    return (
      <p className={cn("text-[10px] text-muted-foreground", className)}>
        {vazio}
      </p>
    );
  }

  const maximo = Math.max(1, ...itens.map((item) => item.total));

  return (
    <ul className={cn("space-y-2", className)}>
      {itens.map((item) => {
        const percentual = Math.round((item.total / maximo) * 100);
        const critico = (item.criticos ?? 0) > 0;
        return (
          <li
            key={item.advogado_id}
            className={cn(
              "flex items-center gap-2.5 rounded-sm px-1 py-0.5",
              destacadoId === item.advogado_id && "bg-secondary/70",
            )}
          >
            {!compacto ? (
              <Avatar nome={item.nome_completo} tamanho="sm" />
            ) : null}
            <span
              className={cn(
                "truncate text-[10px]",
                compacto ? "w-24" : "w-28",
              )}
              title={item.nome_completo}
            >
              {item.nome_completo}
            </span>
            <span
              className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary"
              role="img"
              aria-label={`${item.total} tarefas ativas`}
            >
              <span
                className={cn(
                  "block h-full rounded-full",
                  critico ? "bg-danger" : "bg-navy-700 dark:bg-navy-100/70",
                )}
                style={{ width: `${percentual}%` }}
              />
            </span>
            <strong className="w-5 text-right text-[10px] font-semibold tabular-nums">
              {String(item.total).padStart(2, "0")}
            </strong>
          </li>
        );
      })}
    </ul>
  );
}
