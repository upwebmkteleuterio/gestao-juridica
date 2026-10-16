import { useMemo, useState } from "react";
import { ArchiveRestore, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Badge, Button, CopiarButton, DateRange, EmptyState, ErrorState, Panel, PanelHeader, PessoaTag, Select, Skeleton } from "@/components/kit";
import { useArquivadas, useDesarquivarTarefa, useRegistrarEvento, useUsuarioAtual } from "@/hooks";
import { diaISO, hojeISO, somarDias } from "@/lib/datas";
import { formatarData, formatarDataHora } from "@/lib/format";
import { obterUrlComprovante } from "@/services";
import type { Advogado, ConsultaArquivados, ID, TarefaPrazo } from "@/types";

interface ArquivadosTabProps {
  responsavelId: ID | null;
  advogados: Advogado[];
}

type Periodo = "7" | "30" | "90" | "personalizado";

function DiaGrupo({ dia }: { dia: string }) {
  const data = new Date(`${dia}T12:00:00Z`);
  const texto = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long", timeZone: "UTC" }).format(data);
  return <span className="text-[11px] font-semibold">{texto.charAt(0).toLocaleUpperCase("pt-BR") + texto.slice(1)}</span>;
}

export function ArquivadosTab({ responsavelId, advogados }: ArquivadosTabProps) {
  const hoje = hojeISO();
  const [periodo, setPeriodo] = useState<Periodo>("30");
  const [dePersonalizado, setDePersonalizado] = useState(() => somarDias(hoje, -29));
  const [atePersonalizado, setAtePersonalizado] = useState(hoje);
  const consulta = useMemo<ConsultaArquivados>(() => {
    if (periodo === "personalizado") return { de: dePersonalizado, ate: atePersonalizado, responsavelId };
    const dias = Number(periodo);
    const ate = hojeISO();
    return { de: somarDias(ate, -(dias - 1)), ate, responsavelId };
  }, [periodo, dePersonalizado, atePersonalizado, responsavelId]);
  const intervaloValido = Boolean(consulta.de && consulta.ate && consulta.de <= consulta.ate);
  const arquivadas = useArquivadas(consulta);
  const desarquivar = useDesarquivarTarefa();
  const registrarEvento = useRegistrarEvento();
  const usuario = useUsuarioAtual();
  const grupos = useMemo(() => {
    const resultado = new Map<string, TarefaPrazo[]>();
    (arquivadas.data ?? []).forEach((tarefa) => {
      const dia = diaISO(tarefa.arquivado_em);
      resultado.set(dia, [...(resultado.get(dia) ?? []), tarefa]);
    });
    return [...resultado.entries()];
  }, [arquivadas.data]);
  const descricao = `${arquivadas.data?.length ?? 0} itens arquivados entre ${formatarData(consulta.de)} e ${formatarData(consulta.ate)}`;

  async function restaurar(tarefa: TarefaPrazo) {
    try {
      await desarquivar.mutateAsync(tarefa.id);
      await registrarEvento.mutateAsync({
        entidade: "tarefa", entidade_id: tarefa.id, ator_id: usuario?.id ?? null,
        acao: "tarefa_desarquivada", antes: JSON.stringify({ arquivado_em: tarefa.arquivado_em }), depois: JSON.stringify({ arquivado_em: null }),
      });
      toast.success("Tarefa restaurada no quadro.");
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível restaurar a tarefa.");
    }
  }

  async function abrirComprovante(caminho: string) {
    try {
      const url = await obterUrlComprovante(caminho);
      window.open(url, "_blank", "noopener");
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível abrir o comprovante.");
    }
  }

  function voltarAosUltimos30() {
    setPeriodo("30");
    setDePersonalizado(somarDias(hojeISO(), -29));
    setAtePersonalizado(hojeISO());
  }

  return (
    <Panel>
      <PanelHeader
        titulo="Arquivados"
        descricao={descricao}
        acoes={<Select aria-label="Período de arquivamento" value={periodo} onChange={(evento) => setPeriodo(evento.target.value as Periodo)} className="w-40"><option value="7">Últimos 7 dias</option><option value="30">Últimos 30 dias</option><option value="90">Últimos 90 dias</option><option value="personalizado">Personalizado</option></Select>}
      />
      <div className="space-y-5 p-5">
        {periodo === "personalizado" ? <DateRange de={dePersonalizado} ate={atePersonalizado} onDeChange={setDePersonalizado} onAteChange={setAtePersonalizado} rotuloDe="Arquivado de" rotuloAte="Até" /> : null}
        {!intervaloValido ? null : arquivadas.isLoading ? (
          <div className="space-y-3"><Skeleton className="h-8" /><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
        ) : arquivadas.isError ? (
          <ErrorState titulo="Não foi possível carregar os arquivados" onRetry={() => void arquivadas.refetch()} />
        ) : grupos.length === 0 ? (
          <EmptyState titulo="Nenhuma tarefa arquivada neste período" descricao="Ajuste o intervalo ou consulte os 30 dias mais recentes." acao={<Button variant="secondary" onClick={voltarAosUltimos30}>Ver últimos 30 dias</Button>} />
        ) : grupos.map(([dia, tarefas]) => (
          <section key={dia} className="space-y-3">
            <div className="flex items-center gap-3"><span className="h-px flex-1 bg-border" /><DiaGrupo dia={dia} /><Badge variant="neutral">{tarefas.length}</Badge><span className="h-px flex-1 bg-border" /></div>
            <ul className="divide-y divide-border rounded-sm border border-border">
              {tarefas.map((tarefa) => (
                <li key={tarefa.id} className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3 p-4">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-1"><strong className="text-[11px] tabular-nums">{tarefa.numero_processo}</strong><CopiarButton valor={tarefa.numero_processo} rotulo="Copiar número do processo" mensagem="Número do processo copiado." /></div>
                    <p className="text-[11px] font-medium">{tarefa.tipo_peca}</p>
                    <p className="text-[10px] text-muted-foreground">{tarefa.partes_resumo || "—"}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px]">
                    <div><span className="label-kit">Responsável</span><PessoaTag nome={advogados.find((advogado) => advogado.id === tarefa.advogado_id)?.nome_completo ?? "Não atribuído"} /></div>
                    <div><span className="label-kit">Data fatal</span><p>{formatarData(tarefa.data_fatal)}</p></div>
                    <div><span className="label-kit">Arquivado em</span><p>{formatarDataHora(tarefa.arquivado_em)}</p></div>
                  </div>
                  <div className="flex items-center gap-2">
                    {tarefa.recibo_protocolo_url ? <Button variant="secondary" size="sm" onClick={() => void abrirComprovante(tarefa.recibo_protocolo_url!)}><ExternalLink className="h-3 w-3" aria-hidden="true" />Abrir comprovante</Button> : null}
                    <Button variant="secondary" size="sm" loading={desarquivar.isPending} onClick={() => void restaurar(tarefa)}><ArchiveRestore className="h-3 w-3" aria-hidden="true" />Restaurar</Button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Panel>
  );
}
