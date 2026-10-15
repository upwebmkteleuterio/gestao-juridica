import { Plus } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  PageHeading,
  Panel,
  PanelHeader,
  SegmentedControl,
} from "@/components/kit";
import {
  ExecucaoTarefaPanel,
  KanbanBoard,
  PrazoManualModal,
} from "@/components/esteira";
import { useAdvogados, useEsteira, useMoverEtapa, useUsuarioAtual } from "@/hooks";
import { useUiStore } from "@/store";
import type { EtapaKanban, TarefaPrazo, UrgenciaEsteira } from "@/types";

const ROTULOS_ETAPA: Record<EtapaKanban, string> = {
  fila: "Fila de trabalho",
  redacao: "Em redação",
  revisao: "Em revisão",
  pronto_protocolo: "Pronto para protocolo",
  concluido: "Protocolado",
};

const FILTROS_URGENCIA: { valor: UrgenciaEsteira; rotulo: string; contagem: "total" | "criticos" | "hoje" | "semana" | "emDia" }[] = [
  { valor: "todos", rotulo: "Todos", contagem: "total" },
  { valor: "criticos", rotulo: "Críticos (<48h)", contagem: "criticos" },
  { valor: "hoje", rotulo: "Hoje", contagem: "hoje" },
  { valor: "semana", rotulo: "Semana", contagem: "semana" },
  { valor: "em_dia", rotulo: "Em dia", contagem: "emDia" },
];

export default function EsteiraPrazos() {
  const usuario = useUsuarioAtual();
  const filtro = useUiStore((estado) => estado.filtroEsteira);
  const setFiltroEsteira = useUiStore((estado) => estado.setFiltroEsteira);
  const esteiraIniciada = useUiStore((estado) => estado.esteiraIniciada);
  const marcarEsteiraIniciada = useUiStore((estado) => estado.marcarEsteiraIniciada);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { id: tarefaId } = useParams<{ id: string }>();

  useEffect(() => {
    if (esteiraIniciada || !usuario) return;
    setFiltroEsteira({ escopo: usuario.perfil === "advogado" ? "meus" : "geral" });
    marcarEsteiraIniciada();
  }, [esteiraIniciada, usuario, setFiltroEsteira, marcarEsteiraIniciada]);

  const consulta = useMemo(
    () => ({
      escopo: filtro.escopo,
      advogadoId: filtro.escopo === "meus" ? usuario?.id ?? null : null,
      urgencia: filtro.urgencia,
    }),
    [filtro.escopo, filtro.urgencia, usuario?.id],
  );
  const esteira = useEsteira(consulta);
  const { data: advogados } = useAdvogados();
  const mover = useMoverEtapa();
  const resumo = esteira.data?.resumo;
  const semTarefas = esteira.data?.total === 0 && !esteira.isFetching && !esteira.isError;

  function soltar(tarefa: TarefaPrazo, etapa: EtapaKanban) {
    if (etapa === tarefa.etapa_kanban) return;
    if (etapa === "concluido" && !tarefa.recibo_protocolo_url) {
      toast.warning("Anexe o comprovante de protocolo para concluir a tarefa.");
      navigate(`/esteira/tarefa/${tarefa.id}`);
      return;
    }
    mover.mutate(
      { id: tarefa.id, etapa },
      {
        onSuccess: () => toast.success(`Tarefa movida para ${ROTULOS_ETAPA[etapa]}.`),
        onError: (erro) => toast.error(erro instanceof Error ? erro.message : "Não foi possível mover a tarefa."),
      },
    );
  }

  const acaoVazia = filtro.urgencia !== "todos" ? (
    <Button variant="secondary" onClick={() => setFiltroEsteira({ urgencia: "todos" })}>
      Limpar filtro de urgência
    </Button>
  ) : filtro.escopo === "meus" ? (
    <Button variant="secondary" onClick={() => setFiltroEsteira({ escopo: "geral" })}>
      Ver pauta geral
    </Button>
  ) : (
    <Button variant="primary" onClick={() => navigate("/esteira/novo-prazo")}>
      Cadastrar prazo manual
    </Button>
  );

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Esteira de prazos · Tela 2"
        titulo="Esteira Operacional de Prazos"
        descricao="Gestão visual do ciclo de confecção das peças, da fila ao protocolo, com destaque para os prazos críticos."
        acoes={
          <Button variant="primary" onClick={() => navigate("/esteira/novo-prazo")}>
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Prazo manual
          </Button>
        }
      />

      <Panel>
        <PanelHeader titulo="Controles de visualização" />
        <div className="space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SegmentedControl
              valor={filtro.escopo}
              onChange={(escopo) => setFiltroEsteira({ escopo })}
              ariaLabel="Escopo da esteira"
              opcoes={[
                { valor: "meus", rotulo: "Meus prazos" },
                { valor: "geral", rotulo: "Pauta geral do escritório" },
              ]}
            />
            <div className="flex flex-wrap gap-2" aria-label="Filtros de urgência">
              {FILTROS_URGENCIA.map((item) => (
                <Button
                  key={item.valor}
                  size="sm"
                  variant={filtro.urgencia === item.valor ? "primary" : "secondary"}
                  onClick={() => setFiltroEsteira({ urgencia: item.valor })}
                >
                  {item.rotulo}
                  <Badge variant="neutral">
                    {resumo?.[item.contagem] ?? 0}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Faixas: crítico &lt; 48h; semana = fatais nos próximos 7 dias; em dia = sem urgência no horizonte.
          </p>
        </div>
      </Panel>

      {esteira.isFetching && !esteira.isLoading ? (
        <Alert severidade="info" titulo="Atualizando a esteira">
          Os dados estão sendo sincronizados; o quadro anterior permanece visível.
        </Alert>
      ) : null}

      {semTarefas ? (
        <Panel>
          <EmptyState
            titulo="Nenhuma tarefa neste recorte"
            descricao="Ajuste a visualização ou cadastre um prazo para iniciar a produção."
            acao={acaoVazia}
          />
        </Panel>
      ) : (
        <KanbanBoard
          colunas={esteira.data?.colunas ?? []}
          advogados={advogados ?? []}
          carregando={esteira.isLoading}
          erro={esteira.isError}
          atualizando={esteira.isFetching && !esteira.isLoading}
          onRetry={() => void esteira.refetch()}
          onAbrir={(id) => navigate(`/esteira/tarefa/${id}`)}
          onSoltar={soltar}
        />
      )}

      <ExecucaoTarefaPanel
        tarefaId={tarefaId ?? null}
        onClose={() => navigate("/esteira")}
      />
      <PrazoManualModal
        open={pathname === "/esteira/novo-prazo"}
        onClose={() => navigate("/esteira")}
      />
    </div>
  );
}
