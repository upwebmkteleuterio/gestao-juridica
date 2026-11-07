import { Archive, CalendarClock } from "lucide-react";
import {
  Badge,
  DeadlineBadge,
  IconButton,
  PessoaTag,
} from "@/components/kit";
import { formatarData, formatarNumeroProcesso } from "@/lib/format";
import { slaDeDataFatal } from "@/lib/sla";
import type { TarefaPrazo } from "@/types";

export interface KanbanCardProps {
  tarefa: TarefaPrazo;
  nomeAdvogado?: string;
  arrastando?: boolean;
  onAbrir: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onArquivar?: () => void;
}

const BORDA_SLA = {
  success: "border-l-success",
  warning: "border-l-warning",
  danger: "border-l-danger",
  neutral: "border-l-border",
} as const;

export function KanbanCard({
  tarefa,
  nomeAdvogado,
  arrastando = false,
  onAbrir,
  onDragStart,
  onDragEnd,
  onArquivar,
}: KanbanCardProps) {
  const sigla = tarefa.tribunal_sigla;
  const tone = slaDeDataFatal(tarefa.data_fatal).tone;

  return (
    <div className="relative group">
    <button
      type="button"
      draggable
      onClick={onAbrir}
      onDragStart={(evento) => {
        evento.dataTransfer.setData("text/plain", tarefa.id);
        evento.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      className={`w-full cursor-pointer rounded-sm border border-border border-l-4 bg-card p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-panel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info ${BORDA_SLA[tone]} ${arrastando ? "scale-[0.98] opacity-50" : ""}`}
      aria-label={`Abrir tarefa ${tarefa.tipo_peca}, processo ${formatarNumeroProcesso(tarefa.numero_processo)}`}
    >
      <div className="flex min-w-0 items-center justify-between gap-2">
        <DeadlineBadge dataFatal={tarefa.data_fatal} />
        {tarefa.origem === "manual" && !sigla ? (
          <Badge variant="gold">Manual</Badge>
        ) : sigla ? (
          <Badge variant="neutral">{sigla}</Badge>
        ) : null}
      </div>
      <strong className="mt-2 line-clamp-2 block min-h-8 text-[12px] font-semibold leading-4">
        {tarefa.tipo_peca}
      </strong>
      <div className="mt-2 flex min-w-0 items-baseline gap-2 text-[10px]">
        <span className="shrink-0 font-medium tabular-nums">{formatarNumeroProcesso(tarefa.numero_processo)}</span>
        <span className="truncate text-muted-foreground">{tarefa.partes_resumo}</span>
      </div>
      <div className="mt-3 flex min-w-0 items-center justify-between gap-2 border-t border-border pt-2">
        <PessoaTag nome={nomeAdvogado ?? "Não atribuído"} className="min-w-0 truncate" />
        <span className="flex shrink-0 items-center gap-1 text-[10px] tabular-nums text-muted-foreground">
          <CalendarClock className="h-3 w-3" aria-hidden="true" />
          {formatarData(tarefa.data_fatal)}
        </span>
      </div>
    </button>
      {tarefa.etapa_kanban === "concluido" && onArquivar ? (
        <IconButton
          type="button"
          variant="secondary"
          size="icon-sm"
          aria-label="Arquivar tarefa"
          title="Arquivar tarefa"
          className="absolute right-2 top-2 z-10 transition-opacity opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
          onClick={onArquivar}
        >
          <Archive className="h-3.5 w-3.5" aria-hidden="true" />
        </IconButton>
      ) : null}
    </div>
  );
}

export default KanbanCard;
