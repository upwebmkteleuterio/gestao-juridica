import { Bell, Menu, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useConfiguracoes, useTarefasCriticas } from "@/hooks";
import { formatarData } from "@/lib/format";
import { Badge, Button, IconButton } from "@/components/kit";
import { ThemeToggle } from "./ThemeToggle";

export interface TopbarProps {
  onAbrirMenu: () => void;
}

/** Barra superior global: status do worker DJEN, atalho e central de alertas. */
export function Topbar({ onAbrirMenu }: TopbarProps) {
  const navigate = useNavigate();
  const { data: config } = useConfiguracoes();
  const { data: criticos } = useTarefasCriticas();
  const [alertasAbertos, setAlertasAbertos] = useState(false);
  const areaAlertas = useRef<HTMLDivElement>(null);

  const alertas = criticos ?? [];

  useEffect(() => {
    if (!alertasAbertos) return undefined;
    const aoClicar = (evento: MouseEvent) => {
      if (
        areaAlertas.current &&
        !areaAlertas.current.contains(evento.target as Node)
      ) {
        setAlertasAbertos(false);
      }
    };
    document.addEventListener("mousedown", aoClicar);
    return () => document.removeEventListener("mousedown", aoClicar);
  }, [alertasAbertos]);

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1600px] items-center gap-3 px-5 py-3 sm:px-8">
        <IconButton
          variant="ghost"
          className="lg:hidden"
          onClick={onAbrirMenu}
          aria-label="Abrir menu"
        >
          <Menu className="h-4 w-4" />
        </IconButton>

        <Badge variant="success" className="hidden sm:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
          DJEN sincronizado · hoje às {config?.horario_cron_djen ?? "06:00"}
        </Badge>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            className="hidden sm:inline-flex"
            onClick={() => navigate("/esteira/novo-prazo")}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Novo prazo manual
          </Button>
          <IconButton
            variant="primary"
            size="icon-sm"
            className="sm:hidden"
            onClick={() => navigate("/esteira/novo-prazo")}
            aria-label="Novo prazo manual"
          >
            <Plus className="h-4 w-4" />
          </IconButton>

          <div className="relative" ref={areaAlertas}>
            <IconButton
              variant="secondary"
              onClick={() => setAlertasAbertos((valor) => !valor)}
              aria-label={`Central de alertas (${alertas.length})`}
              aria-expanded={alertasAbertos}
            >
              <Bell className="h-4 w-4" />
            </IconButton>
            {alertas.length > 0 ? (
              <span className="pointer-events-none absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold text-white">
                {alertas.length}
              </span>
            ) : null}

            {alertasAbertos ? (
              <div className="absolute right-0 top-[calc(100%+8px)] w-80 rounded-md border border-border bg-card p-3 shadow-panel">
                <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Prazos críticos (&lt; 48h)
                </p>
                {alertas.length > 0 ? (
                  <ul className="space-y-0.5">
                    {alertas.slice(0, 5).map((tarefa) => (
                      <li key={tarefa.id}>
                        <Link
                          to={`/esteira/tarefa/${tarefa.id}`}
                          onClick={() => setAlertasAbertos(false)}
                          className="flex items-center justify-between gap-3 rounded-sm px-2 py-2 transition-colors hover:bg-secondary"
                        >
                          <span className="min-w-0">
                            <strong className="block truncate text-[11px] font-semibold">
                              {tarefa.tipo_peca}
                            </strong>
                            <small className="block truncate text-[10px] text-muted-foreground">
                              {tarefa.numero_processo}
                            </small>
                          </span>
                          <Badge variant="danger">
                            {formatarData(tarefa.data_fatal)}
                          </Badge>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-2 py-3 text-[11px] text-muted-foreground">
                    Nenhum prazo crítico no momento.
                  </p>
                )}
              </div>
            ) : null}
          </div>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
