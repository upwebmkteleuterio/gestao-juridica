import { Shuffle, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  CapacityMeter,
  Checkbox,
  Modal,
  SegmentedControl,
  Skeleton,
} from "@/components/kit";
import {
  useAdvogadosElegiveis,
  useCapacidadeOperacional,
  useDistribuirLote,
  usePreviaDistribuicao,
} from "@/hooks";
import { formatarOab } from "@/lib/format";
import { useUiStore } from "@/store";
import type { CriterioDistribuicao, ID } from "@/types";

export interface DistribuicaoModalProps {
  open: boolean;
  onClose: () => void;
  /** Lote a distribuir (seleção explícita ou pendentes do filtro). */
  intimacaoIds: ID[];
  origem: "selecao" | "filtro";
  carregandoLote?: boolean;
  onConfirmado: () => void;
}

/**
 * Tela 1.1 — Distribuição Automática de Intimações (Modal).
 * Prévia matemática antes da confirmação: floor(Q/N) + sobras, uma por pessoa.
 */
export function DistribuicaoModal({
  open,
  onClose,
  intimacaoIds,
  origem,
  carregandoLote = false,
  onConfirmado,
}: DistribuicaoModalProps) {
  const { data: elegiveis, isLoading: carregandoElegiveis } =
    useAdvogadosElegiveis();
  const capacidade = useCapacidadeOperacional();
  const distribuir = useDistribuirLote();

  const criterio = useUiStore((estado) => estado.criterioDistribuicao);
  const setCriterio = useUiStore((estado) => estado.setCriterioDistribuicao);
  const [selecionados, setSelecionados] = useState<ID[]>([]);

  useEffect(() => {
    if (open && elegiveis) setSelecionados(elegiveis.map((item) => item.id));
  }, [open, elegiveis]);

  const previa = usePreviaDistribuicao(
    { intimacaoIds, advogadoIds: selecionados, criterio },
    open,
  );

  const cargaPorId = new Map(
    (capacidade.data ?? []).map((item) => [item.advogado_id, item.total]),
  );
  const total = previa.data?.total ?? intimacaoIds.length;
  const semElegiveis = selecionados.length === 0;
  const semLote = intimacaoIds.length === 0;

  function alternar(id: ID) {
    setSelecionados((atual) =>
      atual.includes(id) ? atual.filter((item) => item !== id) : [...atual, id],
    );
  }

  async function confirmar() {
    try {
      const resultado = await distribuir.mutateAsync({
        intimacaoIds,
        advogadoIds: selecionados,
        criterio,
      });
      toast.success(
        `${resultado.total} publicações distribuídas entre ${resultado.participantes.length} advogados.`,
      );
      onConfirmado();
      onClose();
    } catch (erro) {
      toast.error(
        erro instanceof Error ? erro.message : "Falha ao distribuir o lote.",
      );
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      largura="max-w-3xl"
      titulo="Distribuição automática de intimações"
      descricao="Divisão igualitária do lote em triagem entre os advogados elegíveis. A prévia é recalculada a cada alteração."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={distribuir.isPending}>
            Cancelar operação
          </Button>
          <Button
            variant="primary"
            loading={distribuir.isPending}
            disabled={semElegiveis || semLote}
            onClick={confirmar}
          >
            <Shuffle className="h-3.5 w-3.5" aria-hidden="true" />
            Confirmar distribuição
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Panorama atual + volume */}
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-md border border-border p-4">
            <p className="label-kit mb-3">Panorama atual da equipe</p>
            {capacidade.isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4" />
                <Skeleton className="h-4" />
                <Skeleton className="h-4" />
              </div>
            ) : (
              <CapacityMeter itens={capacidade.data ?? []} />
            )}
            <p className="mt-3 text-[10px] text-muted-foreground">
              Carga ativa = tarefas ainda não protocoladas.
            </p>
          </div>

          <div className="flex flex-col justify-between rounded-md bg-navy-950 p-5 text-white">
            <div>
              <span className="eyebrow text-[9px] text-white/60">
                Volume a distribuir
              </span>
              <strong className="mt-1 block text-4xl font-semibold leading-tight tracking-tight text-gold-400">
                {carregandoLote ? "…" : total}
              </strong>
              <p className="mt-2 text-[11px] text-white/60">
                {origem === "selecao"
                  ? "Itens selecionados manualmente na listagem."
                  : "Todas as pendentes do filtro ativo."}
              </p>
            </div>
            {previa.data && previa.data.total > 0 ? (
              <p className="mt-4 text-[10px] text-white/55">
                {(() => {
                  const q = previa.data.total;
                  const n = selecionados.length;
                  const base = Math.floor(q / n);
                  const resto = q % n;
                  return resto
                    ? `${resto} advogado(s) recebem ${base + 1} tarefas; ${n - resto} recebem ${base}.`
                    : `Cada advogado recebe ${base} tarefa(s).`;
                })()}
              </p>
            ) : null}
          </div>
        </div>

        {semLote ? (
          <Alert severidade="info" titulo="Nenhuma publicação pendente">
            Não há intimações em triagem sem responsável neste recorte. Ajuste os
            filtros ou limpe a seleção para distribuir.
          </Alert>
        ) : null}

        {/* Checklist de elegíveis */}
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="label-kit">Advogados elegíveis</p>
            <Badge variant="neutral">
              {selecionados.length} de {elegiveis?.length ?? 0}
            </Badge>
          </div>

          {carregandoElegiveis ? (
            <div className="space-y-2">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          ) : (elegiveis?.length ?? 0) === 0 ? (
            <Alert severidade="warning" titulo="Sem advogados elegíveis">
              Cadastre ou ative um advogado em Equipe &amp; cargas. A
              distribuição fica bloqueada até existir ao menos um profissional
              disponível para receber intimações automáticas.
            </Alert>
          ) : (
            <ul className="space-y-2">
              {elegiveis?.map((advogado) => {
                const marcado = selecionados.includes(advogado.id);
                return (
                  <li key={advogado.id}>
                    <label
                      className={`flex cursor-pointer items-center gap-3 rounded-sm border px-3 py-2.5 transition-colors ${
                        marcado
                          ? "border-primary bg-secondary/60"
                          : "border-border hover:bg-secondary/40"
                      }`}
                    >
                      <Checkbox
                        checked={marcado}
                        onChange={() => alternar(advogado.id)}
                        aria-label={`Incluir ${advogado.nome_completo}`}
                      />
                      <Avatar nome={advogado.nome_completo} tamanho="sm" />
                      <span className="min-w-0 flex-1">
                        <strong className="block truncate text-[11px] font-semibold">
                          {advogado.nome_completo}
                        </strong>
                        <small className="block text-[10px] text-muted-foreground">
                          {formatarOab(advogado.oab_numero, advogado.oab_uf)}
                        </small>
                      </span>
                      <Badge variant="neutral">
                        {cargaPorId.get(advogado.id) ?? 0} ativas
                      </Badge>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Critério algorítmico */}
        <div>
          <p className="label-kit mb-3">Critério algorítmico</p>
          <SegmentedControl
            valor={criterio}
            onChange={(valor) => setCriterio(valor)}
            ariaLabel="Critério da distribuição"
            opcoes={[
              { valor: "igualitario", rotulo: "Divisão igualitária simples" },
              { valor: "compensacao", rotulo: "Compensação de carga" },
            ]}
          />
          <p className="mt-2 text-[10px] text-muted-foreground">
            {criterio === "igualitario"
              ? "Round-robin direto sobre o lote de hoje."
              : "Prioriza quem tem menor volume ativo na esteira."}
          </p>
        </div>

        {/* Prévia por advogado */}
        <div className="rounded-md border border-border">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <p className="label-kit">Prévia da distribuição</p>
            {previa.isFetching ? (
              <Badge variant="info">Calculando…</Badge>
            ) : (
              <Badge variant="gold">
                {previa.data?.atribuicoes.length ?? 0} pessoas
              </Badge>
            )}
          </div>
          <ul className="divide-y divide-border">
            {(previa.data?.atribuicoes ?? []).map((atribuicao) => {
              const advogado = elegiveis?.find(
                (item) => item.id === atribuicao.advogado_id,
              );
              return (
                <li
                  key={atribuicao.advogado_id}
                  className="flex items-center justify-between gap-3 px-4 py-2.5"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Users
                      className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <span className="truncate text-[11px]">
                      {advogado?.nome_completo ?? atribuicao.advogado_id}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <Badge variant="neutral">
                      carga atual {atribuicao.carga_atual}
                    </Badge>
                    <Badge
                      variant={atribuicao.quantidade > 0 ? "success" : "neutral"}
                    >
                      {atribuicao.quantidade} novas
                    </Badge>
                  </span>
                </li>
              );
            })}
            {!previa.data && !previa.isFetching ? (
              <li className="px-4 py-3 text-[11px] text-muted-foreground">
                Selecione advogados para visualizar a divisão.
              </li>
            ) : null}
          </ul>
        </div>

        <Alert severidade="info" titulo="Simulação local">
          Publicações já atribuídas não entram novamente e a confirmação gera as
          tarefas equivalentes na esteira. Nenhum dado é enviado a serviços
          externos.
        </Alert>
      </div>
    </Modal>
  );
}
