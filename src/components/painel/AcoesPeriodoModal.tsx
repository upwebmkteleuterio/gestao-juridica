import { Archive, Eraser, ListChecks } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  Alert,
  Button,
  DateRange,
  FormField,
  Input,
  Modal,
  Skeleton,
} from "@/components/kit";
import {
  useArquivarIntimacoesPeriodo,
  useEncerrarPendenciasPeriodo,
  useExcluirIntimacoesPeriodo,
  useResumoAcoesPeriodo,
  useValorDebounced,
} from "@/hooks";

export type TipoAcaoPeriodo = "encerrar" | "arquivar" | "excluir";

const PALAVRA_CONFIRMACAO = "EXCLUIR";

interface Definicao {
  titulo: string;
  descricao: string;
  verbo: string;
  rotuloContagem: (total: number) => string;
  sucesso: (total: number) => string;
  icone: ReactNode;
  variante: "primary" | "danger";
}

const DEFINICOES: Record<TipoAcaoPeriodo, Definicao> = {
  encerrar: {
    titulo: "Encerrar pendências anteriores",
    descricao:
      "Dispensa as publicações que ainda estão em triagem e sem responsável dentro do período escolhido. Elas saem da fila de distribuição, mas continuam consultáveis pelo filtro de status.",
    verbo: "Encerrar pendências",
    rotuloContagem: (total) =>
      total === 1
        ? "1 pendência será encerrada"
        : `${total} pendências serão encerradas`,
    sucesso: (total) => `${total} pendências encerradas.`,
    icone: <ListChecks className="h-4 w-4" aria-hidden="true" />,
    variante: "primary",
  },
  arquivar: {
    titulo: "Arquivar publicações do período",
    descricao:
      "Retira as publicações do período da caixa de entrada. Nada é apagado: os registros continuam disponíveis na visão de arquivados.",
    verbo: "Arquivar publicações",
    rotuloContagem: (total) =>
      total === 1 ? "1 publicação será arquivada" : `${total} publicações serão arquivadas`,
    sucesso: (total) => `${total} publicações arquivadas.`,
    icone: <Archive className="h-4 w-4" aria-hidden="true" />,
    variante: "primary",
  },
  excluir: {
    titulo: "Excluir publicações definitivamente",
    descricao:
      "Apaga as publicações do período do banco de dados. Esta ação não pode ser desfeita e é exclusiva do administrador.",
    verbo: "Excluir definitivamente",
    rotuloContagem: (total) =>
      total === 1 ? "1 publicação será excluída" : `${total} publicações serão excluídas`,
    sucesso: (total) => `${total} publicações excluídas definitivamente.`,
    icone: <Eraser className="h-4 w-4" aria-hidden="true" />,
    variante: "danger",
  },
};

export interface AcoesPeriodoModalProps {
  tipo: TipoAcaoPeriodo | null;
  onClose: () => void;
}

/**
 * Ações administrativas em lote sobre um período: encerrar pendências,
 * arquivar e excluir. A contagem é calculada no banco antes de confirmar.
 */
export function AcoesPeriodoModal({ tipo, onClose }: AcoesPeriodoModalProps) {
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [confirmacao, setConfirmacao] = useState("");

  const encerrar = useEncerrarPendenciasPeriodo();
  const arquivar = useArquivarIntimacoesPeriodo();
  const excluir = useExcluirIntimacoesPeriodo();

  /* Cada abertura começa com o período completo ("desde o início" até hoje). */
  useEffect(() => {
    if (!tipo) return;
    setInicio("");
    setFim("");
    setConfirmacao("");
  }, [tipo]);

  const inicioDebounced = useValorDebounced(inicio, 400);
  const fimDebounced = useValorDebounced(fim, 400);

  const resumo = useResumoAcoesPeriodo(
    inicioDebounced || null,
    fimDebounced || null,
    Boolean(tipo),
  );

  if (!tipo) return null;

  const definicao = DEFINICOES[tipo];
  const contagem = resumo.data?.[tipo] ?? 0;
  const palavraDigitada = confirmacao.trim().toUpperCase() === PALAVRA_CONFIRMACAO;
  const intervaloInvalido = Boolean(inicio && fim && inicio > fim);
  const carregando = encerrar.isPending || arquivar.isPending || excluir.isPending;
  const podeConfirmar =
    contagem > 0 &&
    !intervaloInvalido &&
    !resumo.isLoading &&
    (tipo !== "excluir" || palavraDigitada);

  async function confirmar() {
    const parametros = { inicio: inicio || null, fim: fim || null };
    try {
      const total =
        tipo === "encerrar"
          ? await encerrar.mutateAsync(parametros)
          : tipo === "arquivar"
            ? await arquivar.mutateAsync(parametros)
            : await excluir.mutateAsync(parametros);

      if (total === 0) {
        toast.error("Nenhuma publicação no período informado.");
        return;
      }
      toast.success(definicao.sucesso(total));
      onClose();
    } catch {
      toast.error("Não foi possível concluir a ação. Tente novamente.");
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      titulo={definicao.titulo}
      descricao={definicao.descricao}
      largura="max-w-xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={carregando}>
            Cancelar
          </Button>
          <Button
            variant={definicao.variante}
            onClick={confirmar}
            loading={carregando}
            disabled={!podeConfirmar}
          >
            {definicao.verbo}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <DateRange
          de={inicio}
          ate={fim}
          onDeChange={setInicio}
          onAteChange={setFim}
          idDe="acao-periodo-inicio"
          idAte="acao-periodo-ate"
          rotuloDe="Data de início"
          rotuloAte="Até"
        />
        <p className="-mt-3 text-[10px] text-muted-foreground">
          Em branco, a data de início vale desde o começo do histórico e a data
          final vale até hoje.
        </p>

        <div className="flex items-center justify-between gap-3 rounded-sm border border-border bg-secondary/50 px-4 py-3">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {definicao.rotuloContagem(contagem)}
          </span>
          <span className="flex items-center gap-2 text-[11px] font-semibold">
            {definicao.icone}
            {resumo.isLoading ? (
              <Skeleton className="h-4 w-10" />
            ) : resumo.isError ? (
              "—"
            ) : (
              contagem
            )}
          </span>
        </div>

        {tipo === "excluir" ? (
          <>
            <Alert severidade="danger" titulo="Ação irreversível">
              As publicações do período serão apagadas do banco de dados. As
              tarefas já criadas na esteira permanecem, mas perdem o vínculo com
              a publicação.
            </Alert>
            <FormField
              label="Confirmação"
              htmlFor="acao-exclusao-confirmacao"
              hint={`Digite ${PALAVRA_CONFIRMACAO} para liberar a exclusão.`}
            >
              <Input
                id="acao-exclusao-confirmacao"
                value={confirmacao}
                onChange={(evento) => setConfirmacao(evento.target.value)}
                placeholder={PALAVRA_CONFIRMACAO}
                autoComplete="off"
              />
            </FormField>
          </>
        ) : null}
      </div>
    </Modal>
  );
}
