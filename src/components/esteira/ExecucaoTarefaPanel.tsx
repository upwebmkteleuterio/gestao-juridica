import { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, FileCheck2, Paperclip, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Alert,
  Badge,
  Button,
  Checkbox,
  DeadlineBadge,
  EtapaBadge,
  FormField,
  Input,
  Select,
  Skeleton,
  SlidePanel,
  Textarea,
} from "@/components/kit";
import { ETAPAS_KANBAN, enviarComprovante, obterUrlComprovante } from "@/services";
import { useAdvogados, useAtualizarTarefaPrazo, useEventosPorEntidade, useRegistrarEvento, useTarefaPrazo, useUsuarioAtual } from "@/hooks";
import { formatarData, formatarDataHora } from "@/lib/format";
import { horasAte } from "@/lib/datas";
import type { EtapaKanban } from "@/types";

export interface ExecucaoTarefaPanelProps {
  tarefaId: string | null;
  onClose: () => void;
}

const ROTULOS_ETAPA: Record<EtapaKanban, string> = {
  fila: "Fila de trabalho",
  redacao: "Em redação",
  revisao: "Em revisão",
  pronto_protocolo: "Pronto p/ protocolo",
  concluido: "Protocolado",
};

const ROTULOS_ACAO: Record<string, string> = {
  tarefa_atualizada: "Tarefa atualizada",
  etapa_alterada: "Etapa alterada",
  tarefa_criada: "Tarefa criada",
};

export function ExecucaoTarefaPanel({ tarefaId, onClose }: ExecucaoTarefaPanelProps) {
  const usuario = useUsuarioAtual();
  const tarefaQuery = useTarefaPrazo(tarefaId ?? undefined);
  const tarefa = tarefaQuery.data;
  const { data: advogados } = useAdvogados();
  const eventosQuery = useEventosPorEntidade(tarefaId ?? undefined);
  const atualizar = useAtualizarTarefaPrazo();
  const registrarEvento = useRegistrarEvento();
  const inputArquivo = useRef<HTMLInputElement>(null);
  const [linkMinuta, setLinkMinuta] = useState("");
  const [notas, setNotas] = useState("");
  const [etapa, setEtapa] = useState<EtapaKanban>("fila");
  const [recibo, setRecibo] = useState("");
  const [nomeArquivo, setNomeArquivo] = useState("");
  const [enviandoComprovante, setEnviandoComprovante] = useState(false);
  const [confirmacaoExterna, setConfirmacaoExterna] = useState(false);
  const [erroProtocolo, setErroProtocolo] = useState(false);
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    if (!tarefa) return;
    setLinkMinuta(tarefa.link_minuta ?? "");
    setNotas(tarefa.notas_internas ?? "");
    setEtapa(tarefa.etapa_kanban);
    setRecibo(tarefa.recibo_protocolo_url ?? "");
    setNomeArquivo("");
    setConfirmacaoExterna(false);
    setErroProtocolo(false);
  }, [tarefa]);

  useEffect(() => {
    const intervalo = window.setInterval(() => setAgora(Date.now()), 60_000);
    return () => window.clearInterval(intervalo);
  }, []);

  const eventos = useMemo(
    () => [...(eventosQuery.data ?? [])].sort((a, b) => b.criado_em.localeCompare(a.criado_em)),
    [eventosQuery.data],
  );
  const nomePorId = useMemo(
    () => new Map((advogados ?? []).map((advogado) => [advogado.id, advogado.nome_completo])),
    [advogados],
  );
  const horasRestantes = tarefa ? horasAte(tarefa.data_fatal, new Date(agora)) : null;
  const rotuloPrazo = horasRestantes === null
    ? "Sem prazo definido"
    : horasRestantes < 0
      ? "Prazo vencido"
      : `${horasRestantes}h restantes`;

  async function selecionarArquivo(arquivo?: File) {
    if (!arquivo || !tarefa) return;
    setEnviandoComprovante(true);
    try {
      const caminho = await enviarComprovante(tarefa.id, arquivo);
      setRecibo(caminho);
      setNomeArquivo(arquivo.name);
      setErroProtocolo(false);
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível enviar o comprovante.");
    } finally {
      setEnviandoComprovante(false);
    }
  }

  async function abrirComprovante() {
    try {
      const url = await obterUrlComprovante(recibo);
      window.open(url, "_blank", "noopener");
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível abrir o comprovante.");
    }
  }

  async function salvar() {
    if (!tarefa) return;
    if (etapa === "concluido" && !recibo && !confirmacaoExterna) {
      setErroProtocolo(true);
      toast.error("Anexe o comprovante de protocolo ou confirme a validação externa para concluir.");
      return;
    }

    setErroProtocolo(false);
    const antes = JSON.stringify({
      link_minuta: tarefa.link_minuta,
      notas_internas: tarefa.notas_internas,
      etapa_kanban: tarefa.etapa_kanban,
      recibo_protocolo_url: tarefa.recibo_protocolo_url,
    });
    const depois = JSON.stringify({
      link_minuta: linkMinuta.trim() || null,
      notas_internas: notas.trim() || null,
      etapa_kanban: etapa,
      recibo_protocolo_url: recibo || null,
    });

    try {
      await atualizar.mutateAsync({
        id: tarefa.id,
        input: {
          link_minuta: linkMinuta.trim() || null,
          notas_internas: notas.trim() || null,
          etapa_kanban: etapa,
          recibo_protocolo_url: recibo || null,
        },
      });
      await registrarEvento.mutateAsync({
        entidade: "tarefa",
        entidade_id: tarefa.id,
        ator_id: usuario?.id ?? null,
        acao: "tarefa_atualizada",
        antes,
        depois,
      });
      if (etapa !== tarefa.etapa_kanban) {
        await registrarEvento.mutateAsync({
          entidade: "tarefa",
          entidade_id: tarefa.id,
          ator_id: usuario?.id ?? null,
          acao: "etapa_alterada",
          antes: tarefa.etapa_kanban,
          depois: etapa,
        });
      }
      toast.success("Tarefa atualizada na esteira.");
      onClose();
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível atualizar a tarefa.");
    }
  }

  const carregando = tarefaQuery.isLoading;
  const falha = tarefaQuery.isError || (!carregando && !tarefa);

  return (
    <SlidePanel
      open={Boolean(tarefaId)}
      onClose={onClose}
      eyebrow="Execução da tarefa · Tela 2.1"
      titulo={tarefa?.numero_processo ?? "Carregando tarefa…"}
      badge={tarefa ? (
        <div className="flex flex-wrap items-center gap-2">
          <EtapaBadge etapa={tarefa.etapa_kanban} />
          {tarefa.tribunal_sigla ? <Badge variant="neutral">{tarefa.tribunal_sigla}</Badge> : <Badge variant="gold">Manual</Badge>}
          <Badge variant="navy">{tarefa.origem === "djen" ? "DJEN" : "Manual"}</Badge>
        </div>
      ) : null}
      footer={tarefa ? (
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" loading={atualizar.isPending || registrarEvento.isPending || enviandoComprovante} onClick={salvar}>
            Salvar e atualizar tarefa
          </Button>
          <Button variant="secondary" onClick={onClose} disabled={atualizar.isPending || registrarEvento.isPending || enviandoComprovante}>
            Fechar sem salvar
          </Button>
        </div>
      ) : null}
    >
      {carregando ? (
        <div className="space-y-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-28" />
          <Skeleton className="h-12" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : falha ? (
        <Alert severidade="danger" titulo="Não foi possível carregar a tarefa." />
      ) : tarefa ? (
        <div className="space-y-6">
          <section>
            <h3 className="mb-3 text-[12px] font-semibold">Resumo da demanda</h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-sm border border-border p-4 text-[10px]">
              <div><dt className="text-muted-foreground">Processo</dt><dd className="mt-1 font-medium tabular-nums">{tarefa.numero_processo}</dd></div>
              <div><dt className="text-muted-foreground">Tribunal</dt><dd className="mt-1 font-medium">{tarefa.tribunal_sigla ?? "Manual"}</dd></div>
              <div><dt className="text-muted-foreground">Ação</dt><dd className="mt-1 font-medium">{tarefa.tipo_peca}</dd></div>
              <div><dt className="text-muted-foreground">Partes</dt><dd className="mt-1 font-medium">{tarefa.partes_resumo}</dd></div>
              {tarefa.data_ciencia ? <div><dt className="text-muted-foreground">Ciência</dt><dd className="mt-1 font-medium">{formatarData(tarefa.data_ciencia)}</dd></div> : null}
              <div className="col-span-2 flex flex-wrap items-center gap-2"><dt className="text-muted-foreground">Contagem regressiva</dt><dd><DeadlineBadge dataFatal={tarefa.data_fatal} rotulo={rotuloPrazo} /></dd></div>
            </dl>
            {tarefa.intimacao_id ? (
              <Link to={`/painel/publicacao/${tarefa.intimacao_id}`} className="mt-3 inline-flex items-center gap-1 text-[10px] text-info hover:underline">
                Ver publicação de origem <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </Link>
            ) : null}
          </section>

          <section className="space-y-4">
            <h3 className="text-[12px] font-semibold">Execução e protocolo</h3>
            <FormField label="Link da minuta" htmlFor="tarefa-link-minuta" hint="Google Docs / OneDrive / Word Online">
              <Input id="tarefa-link-minuta" type="url" value={linkMinuta} onChange={(evento) => setLinkMinuta(evento.target.value)} placeholder="https://" />
            </FormField>
            <FormField label="Notas internas de redação" htmlFor="tarefa-notas">
              <Textarea id="tarefa-notas" value={notas} onChange={(evento) => setNotas(evento.target.value)} />
            </FormField>
            <FormField label="Etapa atual" htmlFor="tarefa-etapa">
              <Select id="tarefa-etapa" value={etapa} onChange={(evento) => setEtapa(evento.target.value as EtapaKanban)}>
                {ETAPAS_KANBAN.map((item) => <option key={item} value={item}>{ROTULOS_ETAPA[item]}</option>)}
              </Select>
            </FormField>
            <FormField label="Comprovante de protocolo" htmlFor="tarefa-comprovante">
              <input ref={inputArquivo} id="tarefa-comprovante" type="file" accept="application/pdf" className="sr-only" onChange={(evento) => { const arquivo = evento.target.files?.[0]; evento.target.value = ""; void selecionarArquivo(arquivo); }} />
              <Button type="button" variant="secondary" loading={enviandoComprovante} onClick={() => inputArquivo.current?.click()}>
                <Paperclip className="h-3.5 w-3.5" aria-hidden="true" />
                Anexar comprovante (PDF)
              </Button>
              {recibo ? (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px]">
                  <FileCheck2 className="h-3.5 w-3.5 text-success" aria-hidden="true" />
                  {nomeArquivo ? <span>{nomeArquivo}</span> : <Button type="button" variant="link" size="sm" onClick={abrirComprovante}>Abrir comprovante</Button>}
                  <Button type="button" variant="ghost" size="sm" onClick={() => { setRecibo(""); setNomeArquivo(""); }} aria-label="Remover comprovante">
                    <Trash2 className="h-3 w-3" aria-hidden="true" /> Remover
                  </Button>
                </div>
              ) : null}
            </FormField>
            {etapa === "concluido" ? (
              <>
                <Alert severidade="warning" titulo="Validação necessária">
                  Para concluir a tarefa, anexe o comprovante do protocolo ou confirme que a validação foi realizada externamente.
                </Alert>
                {!recibo ? (
                  <FormField error={erroProtocolo ? "Anexe o comprovante de protocolo ou confirme a validação externa para concluir." : undefined}>
                    <label className="flex items-start gap-2 text-[10px]">
                      <Checkbox checked={confirmacaoExterna} onChange={(evento) => { setConfirmacaoExterna(evento.target.checked); if (evento.target.checked) setErroProtocolo(false); }} />
                      <span>Confirmo que o protocolo foi validado externamente</span>
                    </label>
                  </FormField>
                ) : null}
              </>
            ) : null}
          </section>

          <section>
            <h3 className="mb-3 text-[12px] font-semibold">Histórico de atualizações</h3>
            {eventosQuery.isLoading ? (
              <div className="space-y-2"><Skeleton className="h-12" /><Skeleton className="h-12" /></div>
            ) : eventosQuery.isError ? (
              <Alert severidade="danger" titulo="Não foi possível carregar o histórico." />
            ) : eventos.length === 0 ? (
              <p className="rounded-sm border border-dashed border-border px-4 py-5 text-center text-[10px] text-muted-foreground">Nenhuma atualização registrada.</p>
            ) : (
              <ol className="space-y-3">
                {eventos.map((evento) => (
                  <li key={evento.id} className="border-l-2 border-info/40 pl-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <strong className="text-[10px]">{ROTULOS_ACAO[evento.acao] ?? evento.acao.replace(/_/g, " ")}</strong>
                      <time className="text-[9px] text-muted-foreground">{formatarDataHora(evento.criado_em)}</time>
                    </div>
                    <p className="mt-1 text-[10px] text-muted-foreground">{evento.ator_id ? nomePorId.get(evento.ator_id) ?? "Sistema" : "Sistema"}</p>
                    {evento.acao === "etapa_alterada" ? <p className="mt-1 text-[9px] text-muted-foreground">{evento.antes ? ROTULOS_ETAPA[evento.antes as EtapaKanban] ?? evento.antes : "—"} → {evento.depois ? ROTULOS_ETAPA[evento.depois as EtapaKanban] ?? evento.depois : "—"}</p> : null}
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      ) : null}
    </SlidePanel>
  );
}

export default ExecucaoTarefaPanel;
