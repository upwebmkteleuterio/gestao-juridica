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
  Input,
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
import { useAdvogados, useAdvogadosVisiveis, useConsultaResponsavel, useEsteira, useUsuarioAtual } from "@/hooks";
import { formatarNumeroProcesso } from "@/lib/format";
import { exibirNumeroProcesso } from "@/lib/numeracao";
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
  const [numeroBusca, setNumeroBusca] = useState("");
  const consultaResponsavel = useConsultaResponsavel(numeroBusca);

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
  const { data: advogadosVisiveis } = useAdvogadosVisiveis();
  const reordenar = useReordenarKanban(consulta);
  const arquivar = useArquivarTarefa();
  const registrarEvento = useRegistrarEvento();
  const resumo = esteira.data?.resumo;
  const semTarefas = esteira.data?.total === 0 && !esteira.isFetching && !esteira.isError;

  /**
   * Solta o card na coluna de destino: a posição vertical escolhida no arraste
   * define a ordem manual da coluna (e a troca de etapa, quando houver).
   */
  async function soltar(tarefa: TarefaPrazo, etapa: EtapaKanban, idsOrdenados: ID[]) {
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
                {(advogadosVisiveis ?? []).map((advogado) => (
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

      <Panel>
        <PanelHeader titulo="Consultar responsável por processo" descricao="Pesquise pelo número para ver quem está com o prazo e em que etapa ele está." />
        <div className="space-y-3 p-5">
          <FormField label="Número do processo" htmlFor="consulta-responsavel-numero">
            <Input id="consulta-responsavel-numero" value={numeroBusca} onChange={(evento) => setNumeroBusca(evento.target.value)} placeholder="Digite o número do processo" />
          </FormField>
          {numeroBusca.replace(/[^0-9A-Za-z]/g, "").length < 2 ? <p className="text-[10px] text-muted-foreground">Digite ao menos 2 caracteres para consultar.</p> : null}
          {consultaResponsavel.isLoading ? <p className="text-[10px] text-muted-foreground">Consultando…</p> : null}
          {consultaResponsavel.isError ? <Alert severidade="danger" titulo="Não foi possível consultar o número." /> : null}
          {consultaResponsavel.data?.length === 0 ? <p className="text-[10px] text-muted-foreground">Nenhum prazo encontrado para esse número.</p> : null}
          {consultaResponsavel.data?.map((tarefa) => (
            <div key={tarefa.id} className="flex flex-wrap items-center justify-between gap-2 rounded-sm border border-border p-3 text-[11px]">
              <div><strong>{exibirNumeroProcesso(tarefa.numero_processo, tarefa.tipo_numeracao)}</strong><p className="text-muted-foreground">Responsável: {advogados?.find((advogado) => advogado.id === tarefa.advogado_id)?.nome_completo ?? "Não atribuído"}</p></div>
              <Badge variant="neutral">{ROTULOS_ETAPA[tarefa.etapa_kanban]}{tarefa.arquivado_em ? " · Arquivado" : ""}</Badge>
            </div>
          ))}
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
          {formatarNumeroProcesso(tarefaParaArquivar?.numero_processo)}
        </div>
      </ConfirmDialog>
    </div>
  );
}
