import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { ItemNavegacao } from "./navegacao";

export interface SidebarItemProps {
  item: ItemNavegacao;
  contagem?: number;
}

export function SidebarItem({ item, contagem }: SidebarItemProps) {
  const Icone = item.icone;

  return (
    <NavLink
      to={item.para}
      className={({ isActive }) =>
        cn(
          "flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-left text-[12px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/60",
          isActive
            ? "bg-white/[0.08] text-gold-400 shadow-[inset_2px_0_0_#c5a15c]"
            : "text-white/60 hover:bg-white/[0.05] hover:text-white",
        )
      }
    >
      <Icone className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="truncate">{item.rotulo}</span>
      {contagem ? (
        <span className="ml-auto rounded-sm bg-gold-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-gold-400">
          {contagem}
        </span>
      ) : null}
    </NavLink>
  );
}
