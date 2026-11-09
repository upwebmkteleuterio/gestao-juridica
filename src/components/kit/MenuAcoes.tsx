import { MoreVertical } from "lucide-react";
import { Fragment, type ReactNode } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { IconButton } from "./Button";

export interface ItemMenuAcoes {
  /** Texto do item; também é o nome acessível do botão. */
  rotulo: string;
  icone?: ReactNode;
  onSelecionar: () => void;
  /** `perigo` destaca ações irreversíveis (excluir). */
  variante?: "padrao" | "perigo";
  separadorAntes?: boolean;
}

export interface MenuAcoesProps {
  itens: ItemMenuAcoes[];
  ariaLabel: string;
  className?: string;
}

/**
 * Menu de ações secundárias ("três pontinhos") do kit — agrupa ações de lote
 * que não merecem um botão próprio no cabeçalho da tela.
 */
export function MenuAcoes({ itens, ariaLabel, className }: MenuAcoesProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <IconButton
          variant="secondary"
          aria-label={ariaLabel}
          className={cn("data-[state=open]:bg-secondary", className)}
        >
          <MoreVertical className="h-4 w-4" aria-hidden="true" />
        </IconButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className="min-w-[260px] rounded-md border-border bg-card p-1.5 shadow-panel"
      >
        {itens.map((item) => (
          <Fragment key={item.rotulo}>
            {item.separadorAntes ? (
              <DropdownMenuSeparator className="my-1 bg-border" />
            ) : null}
            <DropdownMenuItem
              onSelect={item.onSelecionar}
              className={cn(
                "gap-2 rounded-sm px-2.5 py-2 text-[11px] font-medium",
                item.variante === "perigo"
                  ? "text-danger focus:bg-danger-bg focus:text-danger"
                  : "focus:bg-secondary",
              )}
            >
              {item.icone ? (
                <span className="text-muted-foreground" aria-hidden="true">
                  {item.icone}
                </span>
              ) : null}
              {item.rotulo}
            </DropdownMenuItem>
          </Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
