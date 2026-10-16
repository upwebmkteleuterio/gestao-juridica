import { Plus } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  FormField,
  PageHeading,
  Panel,
  PanelHeader,
  Select,
} from "@/components/kit";
import {
  ExecucaoTarefaPanel,
  KanbanBoard,
  PrazoManualModal,
} from "@/components/esteira";
import { useAdvogados, useEsteira, useUsuarioAtual } from "@/hooks";
import { useUiStore } from "@/store";
import type { EtapaKanban, ID, TarefaPrazo, UrgenciaEsteira } from "@/types";
import { Archive } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog, SegmentedControl } from "@/components/kit";
import { ArquivadosTab } from "@/components/esteira";
import { useArquivarTarefa, useRegistrarEvento, useReordenarKanban } from "@/hooks";

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
  const aba = useUiStore((estado) => estado.abaEsteira);
  const setAbaEsteira = useUiStore((estado) => estado.setAbaEsteira);
  const [tarefaParaArquivar, setTarefaParaArquivar] = useState<TarefaPrazo | null>(null);

  useEffect(() => {
    if (esteiraIniciada || !usuario) return;
    setFiltroEsteira({ responsavelId: usuario.perfil === "advogado" ? usuario.id : null });
    marcarEsteiraIniciada();
  }, [esteiraIniciada, usuario, setFiltroEsteira, marcarEsteiraIniciada]);

  const consulta = useMemo(
    () => ({
      responsavelId: filtro.responsavelId,
      urgencia: filtro.urgencia,
    }),
    [filtro.responsavelId, filtro.urgencia],
  );
  const esteira = useEsteira(consulta);
  const { data: advogados } = useAdvogados();
  const reordenar = useReordenarKanban(consulta);
  const arquivar = useArquivarTarefa();
  const registrarEvento = useRegistrarEvento();
  const resumo = esteira.data?.resumo;
  const semTarefas = esteira.data?.total === 0 && !esteira.isFetching && !esteira.isError;

  /**
   * Solta o card na coluna de destino: a posição vertical escolhida no arraste
   * define a ordem manual da coluna (e a troca de etapa, quando houver).
   */
  function soltar(tarefa: TarefaPrazo, etapa: EtapaKanban, idsOrdenados: ID[]) {
    if (etapa === "concluido" && !tarefa.recibo_protocolo_url && tarefa.etapa_kanban !== "concluido") {
      toast.warning("Anexe o comprovante de protocolo para concluir a tarefa.");
      navigate(`/esteira/tarefa/${tarefa.id}`);
      return;
    }
    reordenar.mutate(
      { etapa, ids: idsOrdenados },
      {
        onSuccess: () => {
          if (etapa !== tarefa.etapa_kanban) {
            toast.success(`Tarefa movida para ${ROTULOS_ETAPA[etapa]}.`);
          }
        },
        onError: (erro) => toast.error(erro instanceof Error ? erro.message : "Não foi possível mover a tarefa."),
      },
    );
  }

  async function confirmarArquivamento() {
    if (!tarefaParaArquivar) return;
    const tarefa = tarefaParaArquivar;
    try {
      const arquivada = await arquivar.mutateAsync(tarefa.id);
      await registrarEvento.mutateAsync({
        entidade: "tarefa",
        entidade_id: tarefa.id,
        ator_id: usuario?.id ?? null,
        acao: "tarefa_arquivada",
        antes: JSON.stringify({ arquivado_em: tarefa.arquivado_em, ordem_kanban: tarefa.ordem_kanban }),
        depois: JSON.stringify({ arquivado_em: arquivada.arquivado_em, ordem_kanban: arquivada.ordem_kanban }),
      });
      toast.success("Tarefa arquivada. Ela está na aba Arquivados.");
      setTarefaParaArquivar(null);
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível arquivar a tarefa.");
    }
  }

  const acaoVazia = filtro.urgencia !== "todos" ? (
    <Button variant="secondary" onClick={() => setFiltroEsteira({ urgencia: "todos" })}>
      Limpar filtro de urgência
    </Button>
  ) : filtro.responsavelId ? (
    <Button variant="secondary" onClick={() => setFiltroEsteira({ responsavelId: null })}>
      Ver todos os responsáveis
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

      <SegmentedControl
        valor={aba}
        opcoes={[{ valor: "pipeline", rotulo: "Pipeline" }, { valor: "arquivados", rotulo: "Arquivados" }]}
        onChange={(valor) => setAbaEsteira(valor === "arquivados" ? "arquivados" : "pipeline")}
        ariaLabel="Visão da esteira"
      />

      <Panel>
        <PanelHeader titulo="Controles de visualização" />
        <div className="space-y-4 p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <FormField label="Responsável" htmlFor="esteira-responsavel" className="w-full max-w-xs">
              <Select
                id="esteira-responsavel"
                value={filtro.responsavelId ?? ""}
                onChange={(evento) => setFiltroEsteira({ responsavelId: evento.target.value || null })}
              >
                <option value="">Todos</option>
                {(advogados ?? []).map((advogado) => (
                  <option key={advogado.id} value={advogado.id}>{advogado.nome_completo}</option>
                ))}
              </Select>
            </FormField>
            <div className={aba === "pipeline" ? "contents" : "hidden"}>
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
          </div>
          <div className={aba === "pipeline" ? "contents" : "hidden"}>
          <p className="text-[10px] text-muted-foreground">
            Faixas: crítico &lt; 48h; semana = fatais nos próximos 7 dias; em dia = sem urgência no horizonte.
          </p>
          </div>
        </div>
      </Panel>

      <div hidden={aba !== "pipeline"}>
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
          onArquivar={setTarefaParaArquivar}
        />
      )}
      </div>
      <div hidden={aba !== "arquivados"}>
        <ArquivadosTab responsavelId={filtro.responsavelId} advogados={advogados ?? []} />
      </div>

      <ExecucaoTarefaPanel
        tarefaId={tarefaId ?? null}
        onClose={() => navigate("/esteira")}
      />
      <PrazoManualModal
        open={pathname === "/esteira/novo-prazo"}
        onClose={() => navigate("/esteira")}
      />
      <ConfirmDialog
        open={Boolean(tarefaParaArquivar)}
        onClose={() => setTarefaParaArquivar(null)}
        onConfirm={() => void confirmarArquivamento()}
        titulo="Arquivar tarefa"
        descricao="O card sairá do quadro e passará a aparecer na aba Arquivados. Você poderá restaurá-lo quando quiser."
        textoConfirmar="Arquivar tarefa"
        variante="primary"
        carregando={arquivar.isPending || registrarEvento.isPending}
      >
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <Archive className="h-4 w-4" aria-hidden="true" />
          {tarefaParaArquivar?.numero_processo}
        </div>
      </ConfirmDialog>
    </div>
  );
}
