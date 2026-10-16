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
  onSoltar: (tarefa: TarefaPrazo, etapa: EtapaKanban, idsOrdenados: ID[]) => void;
  onArquivar: (tarefa: TarefaPrazo) => void;
}

const CONFIGURACAO: Record<EtapaKanban, { titulo: string; descricao: string }> = {
  fila: { titulo: "Fila de trabalho", descricao: "Aguardando confecção" },
  redacao: { titulo: "Em redação", descricao: "Peça em elaboração" },
  revisao: { titulo: "Em revisão", descricao: "Aguardando validação" },
  pronto_protocolo: { titulo: "Pronto p/ protocolo", descricao: "Aprovada para submissão" },
  concluido: { titulo: "Protocolado", descricao: "Protocolado · arquive para limpar o quadro" },
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
  onArquivar,
}: KanbanBoardProps) {
  const [idArrastado, setIdArrastado] = useState<ID | null>(null);
  const [etapaAlvo, setEtapaAlvo] = useState<EtapaKanban | null>(null);
  const [alvo, setAlvo] = useState<{ etapa: EtapaKanban; indice: number } | null>(null);

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
                setAlvo(null);
              }
            }}
            onDrop={(evento) => {
              evento.preventDefault();
              const tarefaId = evento.dataTransfer.getData("text/plain") || idArrastado;
              const tarefa = tarefaId
                ? colunas.find((item) => item.tarefas.some((t) => t.id === tarefaId))?.tarefas.find((item) => item.id === tarefaId)
                : undefined;
              if (tarefa) {
                const ids = itens.filter((item) => item.id !== tarefa.id).map((item) => item.id);
                const bruto = alvo?.etapa === etapa ? alvo.indice : itens.length;
                const origem = itens.findIndex((item) => item.id === tarefa.id);
                const indiceInsercao = origem >= 0 && origem < bruto ? bruto - 1 : bruto;
                ids.splice(Math.max(0, Math.min(indiceInsercao, ids.length)), 0, tarefa.id);
                if (origem !== indiceInsercao || tarefa.etapa_kanban !== etapa) {
                  onSoltar(tarefa, etapa, ids);
                }
              }
              setIdArrastado(null);
              setEtapaAlvo(null);
              setAlvo(null);
            }}
            className={`w-[276px] shrink-0 transition-colors xl:w-auto xl:min-w-0 xl:basis-0 xl:flex-1 ${etapaAlvo === etapa ? "border-info bg-info-bg/40" : ""} ${atualizando ? "opacity-75" : ""}`}
          >
            <PanelHeader
              className="flex-nowrap"
              titulo={config.titulo}
              descricao={config.descricao}
              acoes={<Badge variant="neutral" className="shrink-0">{carregando ? "—" : itens.length}</Badge>}
            />
            <div
              className="min-h-40 space-y-3 p-3"
              onDragOver={(evento) => {
                evento.preventDefault();
                const cartoes = Array.from(evento.currentTarget.querySelectorAll("[data-card]")) as HTMLElement[];
                const encontrado = cartoes.findIndex((el) => {
                  const caixa = el.getBoundingClientRect();
                  return evento.clientY < caixa.top + caixa.height / 2;
                });
                const indice = encontrado === -1 ? cartoes.length : encontrado;
                setAlvo((atual) =>
                  (atual && atual.etapa === etapa && atual.indice === indice ? atual : { etapa, indice }),
                );
              }}
            >
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
                  <div key={tarefa.id} data-card className="relative">
                    {alvo?.etapa === etapa && alvo.indice === itens.findIndex((item) => item.id === tarefa.id) ? (
                      <span aria-hidden="true" className="pointer-events-none absolute -top-2 left-0 right-0 z-20 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-info" />
                        <span className="h-0.5 flex-1 rounded-full bg-info" />
                      </span>
                    ) : null}
                  <KanbanCard
                    key={tarefa.id}
                    tarefa={tarefa}
                    nomeAdvogado={advogados.find((item) => item.id === tarefa.advogado_id)?.nome_completo}
                    arrastando={idArrastado === tarefa.id}
                    onAbrir={() => onAbrir(tarefa.id)}
                    onArquivar={() => onArquivar(tarefa)}
                    onDragStart={() => setIdArrastado(tarefa.id)}
                    onDragEnd={() => {
                      setIdArrastado(null);
                      setEtapaAlvo(null);
                      setAlvo(null);
                    }}
                  />
                  </div>
                ))
              )}
              <div className="relative h-0">
                {alvo?.etapa === etapa && alvo.indice === itens.length ? (
                  <span aria-hidden="true" className="pointer-events-none absolute -top-2 left-0 right-0 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-info" />
                    <span className="h-0.5 flex-1 rounded-full bg-info" />
                  </span>
                ) : null}
              </div>
            </div>
          </Panel>
        );
      })}
    </div>
  );
}

export default KanbanBoard;
