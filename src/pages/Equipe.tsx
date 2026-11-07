import { useState } from "react";
import { PauseCircle, Pencil, Plus, ShieldOff, Trash2, Undo2 } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  PageHeading,
  Panel,
  PanelHeader,
  Skeleton,
} from "@/components/kit";
import { AdvogadoModal } from "@/components/equipe";
import {
  useAcessoEquipe,
  useDefinirAcesso,
  useDevolverDistribuicao,
  useExcluirMembro,
  useProdutividadeEquipe,
  useRegistrarEvento,
  useUsuarioAtual,
} from "@/hooks";
import { formatarData, formatarOab } from "@/lib/format";
import { ErroFuncao } from "@/services";
import type { AdvogadoCarga } from "@/types";

export default function Equipe() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { id } = useParams<{ id: string }>();
  const produtividade = useProdutividadeEquipe();
  const acessos = useAcessoEquipe();
  const definirAcesso = useDefinirAcesso();
  const excluir = useExcluirMembro();
  const devolver = useDevolverDistribuicao();
  const registrarEvento = useRegistrarEvento();
  const usuario = useUsuarioAtual();
  const [selecionado, setSelecionado] = useState<AdvogadoCarga | null>(null);
  const [alternativaBloqueio, setAlternativaBloqueio] = useState<AdvogadoCarga | null>(null);
  const [devolverSelecionado, setDevolverSelecionado] = useState<AdvogadoCarga | null>(null);
  const [mensagemExclusao, setMensagemExclusao] = useState("");
  const advogados = produtividade.data ?? [];
  const ativos = advogados.reduce((total, advogado) => total + Number(advogado.ativo_distribuicao), 0);
  const modalAberto = pathname === "/equipe/novo" || pathname.startsWith("/equipe/advogado/");
  const acessoConhecido = !acessos.isLoading && !acessos.isError;

  async function alternarAcesso(advogado: AdvogadoCarga, pode_entrar: boolean) {
    try {
      await definirAcesso.mutateAsync({ id: advogado.advogado_id, pode_entrar });
      toast.success(pode_entrar ? "Acesso liberado." : "Acesso bloqueado. O histórico foi preservado.");
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível alterar o acesso.");
    }
  }

  async function confirmarExclusao() {
    if (!selecionado) return;
    try {
      await excluir.mutateAsync(selecionado.advogado_id);
      toast.success("Profissional excluído da equipe.");
      setSelecionado(null);
    } catch (erro) {
      if (erro instanceof ErroFuncao && erro.codigo === "prazos_em_aberto") {
        setMensagemExclusao(erro.message);
        setAlternativaBloqueio(selecionado);
        setSelecionado(null);
        return;
      }
      toast.error(erro instanceof Error ? erro.message : "Não foi possível excluir o profissional.");
    }
  }

  async function confirmarBloqueioAlternativo() {
    if (!alternativaBloqueio) return;
    await alternarAcesso(alternativaBloqueio, false);
    setAlternativaBloqueio(null);
  }

  async function confirmarDevolucao() {
    if (!devolverSelecionado) return;
    try {
      const resultado = await devolver.mutateAsync(devolverSelecionado.advogado_id);
      try {
        await registrarEvento.mutateAsync({
          ator_id: usuario?.id ?? null,
          entidade: "distribuicao",
          entidade_id: resultado.intimacao_ids.join(","),
          acao: "distribuicao_devolvida",
          antes: null,
          depois: `${resultado.devolvidas} devolvidas · ${devolverSelecionado.nome_completo}`,
        });
      } catch {
        toast.warning("Devolução concluída, mas não foi possível registrar o histórico.");
      }
      if (resultado.devolvidas > 0) {
        toast.success(`${resultado.devolvidas} publicações devolvidas à triagem.${resultado.mantidas > 0 ? ` ${resultado.mantidas} continuam com o advogado porque o trabalho já começou.` : ""}`);
      } else if (resultado.mantidas > 0) {
        toast.warning("Nenhuma publicação pôde voltar: o trabalho já começou em todas elas.");
      } else {
        toast.info("Este profissional não tem publicações distribuídas em fila.");
      }
      setDevolverSelecionado(null);
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível devolver a distribuição.");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Advogados & cargas · Tela 4"
        titulo="Painel da Equipe & Gestão de Carga"
        descricao="Acompanhamento da produtividade dos advogados, do status de disponibilidade para a distribuição automática e da capacidade operacional da banca."
        acoes={<Button variant="primary" onClick={() => navigate("/equipe/novo")}><Plus className="h-3.5 w-3.5" aria-hidden="true" />Cadastrar novo advogado</Button>}
      />

      <Panel>
        <PanelHeader titulo="Equipe da banca" descricao={`${advogados.length} profissionais · ${ativos} ativos na distribuição`} />
        <div className="p-5">
          {produtividade.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, indice) => <Skeleton key={indice} className="h-56 rounded-md" />)}</div>
          ) : produtividade.isError ? (
            <ErrorState titulo="Não foi possível carregar a equipe" descricao="Verifique a conexão e tente novamente." onRetry={() => produtividade.refetch()} />
          ) : advogados.length === 0 ? (
            <EmptyState titulo="Nenhum advogado cadastrado" descricao="Cadastre um profissional para acompanhar a produtividade e configurar a distribuição automática." acao={<Button variant="primary" onClick={() => navigate("/equipe/novo")}><Plus className="h-3.5 w-3.5" aria-hidden="true" />Cadastrar advogado</Button>} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {advogados.map((advogado) => {
                const acesso = acessos.data?.find((membro) => membro.id === advogado.advogado_id);
                return (
                  <Panel key={advogado.advogado_id} className="p-4">
                    <div className="space-y-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar nome={advogado.nome_completo} tamanho="lg" />
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-sm font-semibold" title={advogado.nome_completo}>{advogado.nome_completo}</h3>
                          <Badge variant="gold" className="mt-1 max-w-full truncate">{advogado.cargo ?? (advogado.perfil === "admin" ? "Sócio · Administrador" : "Advogado")}</Badge>
                        </div>
                      </div>

                      <div className="min-w-0 space-y-1 border-t border-border pt-3">
                        <p className="text-[11px] font-medium">{formatarOab(advogado.oab_numero, advogado.oab_uf)}</p>
                        <p className="truncate text-[10px] text-muted-foreground" title={advogado.email_corporativo}>{advogado.email_corporativo}</p>
                        {advogado.data_ingresso ? <p className="text-[10px] text-muted-foreground">Na equipe desde {formatarData(advogado.data_ingresso)}</p> : null}
                      </div>

                      <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                        {advogado.ativo_distribuicao ? <Badge variant="success"><span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />Ativo na distribuição</Badge> : <Badge variant="neutral"><PauseCircle className="h-3 w-3" aria-hidden="true" />Fora da distribuição</Badge>}
                        {advogado.oculto_da_equipe ? <Badge variant="neutral">Oculto da equipe</Badge> : null}
                        {acessoConhecido && acesso ? <Badge variant={acesso.pode_entrar ? "success" : "danger"}>{acesso.pode_entrar ? "Acesso liberado" : "Acesso bloqueado"}</Badge> : null}
                      </div>

                      <div className="grid grid-cols-3 divide-x divide-border border-y border-border py-3">
                        <div className="pr-2"><span className="block text-[9px] leading-tight text-muted-foreground">Prazos em aberto</span><strong className="mt-1 block text-lg font-semibold leading-tight">{advogado.total_prazos}</strong></div>
                        <div className="px-2"><span className="block text-[9px] leading-tight text-muted-foreground">Críticos &lt; 48h</span><strong className={`mt-1 block text-lg font-semibold leading-tight ${advogado.criticos_48h > 0 ? "text-danger" : ""}`}>{advogado.criticos_48h}</strong></div>
                        <div className="pl-2"><span className="block text-[9px] leading-tight text-muted-foreground">Concluídos</span><strong className={`mt-1 block text-lg font-semibold leading-tight ${advogado.concluidos_mes > 0 ? "text-success" : ""}`}>{advogado.concluidos_mes}</strong></div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="navy">{advogado.perfil === "admin" ? "Admin" : "Advogado"}</Badge>
                        <Button variant="secondary" size="sm" onClick={() => navigate(`/equipe/advogado/${advogado.advogado_id}`)}><Pencil className="h-3 w-3" aria-hidden="true" />Editar advogado</Button>
                        {advogado.total_prazos > 0 ? <Button variant="secondary" size="sm" onClick={() => setDevolverSelecionado(advogado)}><Undo2 className="h-3 w-3" aria-hidden="true" />Devolver {advogado.total_prazos} ao painel</Button> : null}
                        {acessoConhecido && acesso ? <Button variant="secondary" size="sm" disabled={definirAcesso.isPending} onClick={() => void alternarAcesso(advogado, !acesso.pode_entrar)}><ShieldOff className="h-3 w-3" aria-hidden="true" />{acesso.pode_entrar ? "Bloquear acesso" : "Liberar acesso"}</Button> : null}
                        <Button variant="danger" size="sm" onClick={() => { setMensagemExclusao(""); setSelecionado(advogado); }}><Trash2 className="h-3 w-3" aria-hidden="true" />Excluir</Button>
                      </div>
                    </div>
                  </Panel>
                );
              })}
            </div>
          )}
        </div>
      </Panel>

      <AdvogadoModal open={modalAberto} advogadoId={pathname.startsWith("/equipe/advogado/") ? id ?? null : null} onClose={() => navigate("/equipe")} />

      <ConfirmDialog
        open={Boolean(devolverSelecionado)}
        onClose={() => setDevolverSelecionado(null)}
        onConfirm={() => void confirmarDevolucao()}
        titulo="Devolver as intimações ao painel de gestor?"
        descricao="As publicações distribuídas a este profissional voltam para a triagem sem responsável e as tarefas ainda não iniciadas saem da esteira. O que já saiu da fila (redação, revisão, protocolo ou concluído) permanece com o advogado. A análise da IA e a data sugerida não são alteradas."
        textoConfirmar="Devolver ao painel"
        variante="danger"
        carregando={devolver.isPending}
      >
        <p className="text-[11px] text-muted-foreground">{devolverSelecionado?.nome_completo}</p>
      </ConfirmDialog>

      <ConfirmDialog
        open={Boolean(selecionado)}
        onClose={() => setSelecionado(null)}
        onConfirm={() => void confirmarExclusao()}
        titulo="Excluir profissional definitivamente?"
        descricao="Esta ação exclui permanentemente o usuário de autenticação e o cadastro da equipe. Ela não pode ser desfeita. Profissionais com prazos no histórico não podem ser excluídos; nesse caso, você poderá bloquear o acesso preservando o histórico."
        textoConfirmar="Excluir definitivamente"
        variante="danger"
        carregando={excluir.isPending}
      >
        <p className="text-[11px] text-muted-foreground">{selecionado?.nome_completo}</p>
      </ConfirmDialog>

      <ConfirmDialog
        open={Boolean(alternativaBloqueio)}
        onClose={() => setAlternativaBloqueio(null)}
        onConfirm={() => void confirmarBloqueioAlternativo()}
        titulo="Preservar histórico e bloquear o acesso?"
        descricao="Este profissional possui prazos vinculados e não pode ser excluído. Bloquear o acesso impede novos logins sem apagar os prazos nem alterar a distribuição."
        textoConfirmar="Bloquear acesso"
        variante="danger"
        carregando={definirAcesso.isPending}
      >
        <Alert severidade="warning" titulo="Exclusão não permitida">
          {mensagemExclusao} O histórico será mantido; somente o acesso ao sistema será bloqueado.
        </Alert>
        <p className="mt-3 text-[11px] text-muted-foreground">{alternativaBloqueio?.nome_completo}</p>
      </ConfirmDialog>
    </div>
  );
}
