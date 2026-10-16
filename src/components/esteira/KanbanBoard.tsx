import { useState } from "react";
import {
  Badge,
  ErrorState,
  Panel,
  PanelHeader,
  Skeleton,
} from "@/components/kit";
import { ETAPAS_KANBAN } from "@/services";
import type { Advogado, ColunaKanban, EtapaKanban, ID, TarefaPrazo } from "@/types";
import { KanbanCard } from "./KanbanCard";

export interface KanbanBoardProps {
  colunas: ColunaKanban[];
  advogados: Advogado[];
  carregando: boolean;
  erro: boolean;
  atualizando?: boolean;
  onRetry: () => void;
  onAbrir: (id: ID) => void;
  onSoltar: (tarefa: TarefaPrazo, etapa: EtapaKanban) => void;
}

const CONFIGURACAO: Record<EtapaKanban, { titulo: string; descricao: string }> = {
  fila: { titulo: "Fila de trabalho", descricao: "Aguardando confecção" },
  redacao: { titulo: "Em redação", descricao: "Peça em elaboração" },
  revisao: { titulo: "Em revisão", descricao: "Aguardando validação" },
  pronto_protocolo: { titulo: "Pronto p/ protocolo", descricao: "Aprovada para submissão" },
  concluido: { titulo: "Protocolado", descricao: "Comprovante arquivado" },
};

export function KanbanBoard({
  colunas,
  advogados,
  carregando,
  erro,
  atualizando = false,
  onRetry,
  onAbrir,
  onSoltar,
}: KanbanBoardProps) {
  const [idArrastado, setIdArrastado] = useState<ID | null>(null);
  const [etapaAlvo, setEtapaAlvo] = useState<EtapaKanban | null>(null);

  if (erro) {
    return (
      <Panel>
        <ErrorState
          titulo="Não foi possível carregar a esteira"
          descricao="A consulta demorou ou falhou. Tente novamente sem perder o recorte atual."
          onRetry={onRetry}
        />
      </Panel>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2 xl:overflow-visible">
      {ETAPAS_KANBAN.map((etapa, indice) => {
        const coluna = colunas[indice];
        const itens = coluna?.tarefas ?? [];
        const config = CONFIGURACAO[etapa];

        return (
          <Panel
            key={etapa}
            onDragOver={(evento) => {
              evento.preventDefault();
              setEtapaAlvo(etapa);
            }}
            onDragLeave={(evento) => {
              if (!evento.currentTarget.contains(evento.relatedTarget as Node | null)) {
                setEtapaAlvo(null);
              }
            }}
            onDrop={(evento) => {
              evento.preventDefault();
              const tarefaId = evento.dataTransfer.getData("text/plain") || idArrastado;
              const tarefa = tarefaId
                ? colunas.find((item) => item.tarefas.some((t) => t.id === tarefaId))?.tarefas.find((item) => item.id === tarefaId)
                : undefined;
              if (tarefa) onSoltar(tarefa, etapa);
              setIdArrastado(null);
              setEtapaAlvo(null);
            }}
            className={`w-[276px] shrink-0 transition-colors xl:w-auto xl:min-w-0 xl:basis-0 xl:flex-1 ${etapaAlvo === etapa ? "border-info bg-info-bg/40" : ""} ${atualizando ? "opacity-75" : ""}`}
          >
            <PanelHeader
              className="flex-nowrap"
              titulo={config.titulo}
              descricao={config.descricao}
              acoes={<Badge variant="neutral" className="shrink-0">{carregando ? "—" : itens.length}</Badge>}
            />
            <div className="min-h-40 space-y-3 p-3">
              {carregando ? (
                <div className="space-y-3" aria-label="Carregando tarefas">
                  <Skeleton className="h-28" />
                  <Skeleton className="h-28" />
                  <Skeleton className="h-28" />
                </div>
              ) : itens.length === 0 ? (
                <p className="py-8 text-center text-[10px] text-muted-foreground">
                  Sem tarefas nesta etapa
                </p>
              ) : (
                itens.map((tarefa) => (
                  <KanbanCard
                    key={tarefa.id}
                    tarefa={tarefa}
                    nomeAdvogado={advogados.find((item) => item.id === tarefa.advogado_id)?.nome_completo}
                    arrastando={idArrastado === tarefa.id}
                    onAbrir={() => onAbrir(tarefa.id)}
                    onDragStart={() => setIdArrastado(tarefa.id)}
                    onDragEnd={() => {
                      setIdArrastado(null);
                      setEtapaAlvo(null);
                    }}
                  />
                ))
              )}
            </div>
          </Panel>
        );
      })}
    </div>
  );
}

export default KanbanBoard;
