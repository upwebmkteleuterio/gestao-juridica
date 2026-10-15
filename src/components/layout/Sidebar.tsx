import { LogOut } from "lucide-react";
import { useMemo } from "react";
import { useIntimacoesPendentes, useTarefasPrazos } from "@/hooks";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store";
import { Avatar, Badge, IconButton } from "@/components/kit";
import { GRUPOS_NAVEGACAO } from "./navegacao";
import { SidebarItem } from "./SidebarItem";

export interface SidebarProps {
  aberta: boolean;
  onFechar: () => void;
}

/** Menu lateral fixo (navy) — identidade da marca nos dois temas. */
export function Sidebar({ aberta, onFechar }: SidebarProps) {
  const usuario = useAuthStore((estado) => estado.usuario);
  const sair = useAuthStore((estado) => estado.sair);
  const { data: pendentes } = useIntimacoesPendentes();
  const { data: tarefas } = useTarefasPrazos();

  const grupos = useMemo(
    () =>
      GRUPOS_NAVEGACAO.map((grupo) => ({
        ...grupo,
        itens: grupo.itens.filter((item) =>
          usuario ? item.perfis.includes(usuario.perfil) : false,
        ),
      })).filter((grupo) => grupo.itens.length > 0),
    [usuario],
  );

  const contagens: Record<string, number | undefined> = {
    pendentes: pendentes?.length,
    tarefas: tarefas?.filter((tarefa) => tarefa.etapa_kanban !== "concluido")
      .length,
  };

  return (
    <>
      {aberta ? (
        <div
          className="fixed inset-0 z-30 bg-navy-950/60 lg:hidden"
          onClick={onFechar}
          aria-hidden="true"
        />
      ) : null}

      <aside
        aria-label="Menu do sistema"
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[236px] flex-col overflow-y-auto bg-sidebar px-4 pb-4 pt-7 text-sidebar-foreground transition-transform duration-200 lg:translate-x-0",
          aberta ? "translate-x-0 shadow-panel" : "-translate-x-full",
        )}
      >
        <div className="flex shrink-0 justify-center border-b border-white/10 px-4 pb-6">
          <img
            src="/assets/logo-magalhaes-gomes.png"
            alt="Magalhães & Gomes Advogados"
            className="h-[86px] w-[152px] object-contain"
          />
        </div>

        <div className="flex shrink-0 items-center gap-2.5 px-3 py-5">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-gold-400">
            MG
          </span>
          <div>
            <strong className="block text-[12px] text-white">
              Gestão jurídica
            </strong>
            <small className="block text-[10px] text-white/45">
              Workspace do escritório
            </small>
          </div>
        </div>

        <nav className="flex flex-col gap-1" aria-label="Módulos">
          {grupos.map((grupo) => (
            <div key={grupo.titulo}>
              <p className="mb-2 mt-4 px-3.5 text-[9px] font-bold uppercase tracking-[1.8px] text-white/35">
                {grupo.titulo}
              </p>
              <div className="flex flex-col gap-0.5">
                {grupo.itens.map((item) => (
                  <SidebarItem
                    key={item.para}
                    item={item}
                    contagem={
                      item.contagem ? contagens[item.contagem] : undefined
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-auto shrink-0 space-y-4 pt-6">
          <div className="rounded-sm border border-white/10 px-3 py-2.5 text-[10px] text-white/50">
            <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 align-middle" />
            DJEN + DeepSeek
            <span className="mt-0.5 block pl-3 text-white/35">
              Ambiente de demonstração · a integrar
            </span>
          </div>

          <div className="flex items-center gap-2.5 border-t border-white/10 pt-4">
            <Avatar nome={usuario?.nome_completo ?? "?"} tom="gold" />
            <div className="min-w-0 flex-1">
              <strong className="block truncate text-[11px] text-white">
                {usuario?.nome_completo ?? "Não autenticado"}
              </strong>
              <Badge
                variant="gold"
                className="mt-1 bg-gold-500/20 text-[9px] text-gold-400"
              >
                {usuario?.perfil === "admin" ? "Admin" : "Advogado"}
              </Badge>
            </div>
            <IconButton
              variant="ghost"
              size="icon-sm"
              onClick={sair}
              aria-label="Sair do sistema"
              className="text-white/60 hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
            </IconButton>
          </div>
        </div>
      </aside>
    </>
  );
}
