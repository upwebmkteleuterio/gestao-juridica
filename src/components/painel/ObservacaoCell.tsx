import { useRef, useState } from "react";
import { toast } from "sonner";
import { useAtualizarObservacaoIntimacao, useRegistrarEvento, useUsuarioAtual } from "@/hooks";
import type { ID } from "@/types";

interface ObservacaoCellProps {
  intimacaoId: ID;
  observacao: string | null;
}

export function ObservacaoCell({ intimacaoId, observacao }: ObservacaoCellProps) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(observacao ?? "");
  const atualizar = useAtualizarObservacaoIntimacao();
  const registrarEvento = useRegistrarEvento();
  const usuario = useUsuarioAtual();
  const salvandoRef = useRef(false);
  const cancelarRef = useRef(false);

  async function salvar() {
    if (salvandoRef.current) return;
    const anterior = observacao ?? "";
    const novo = texto.trim();
    if (novo === anterior) {
      setTexto(anterior);
      setEditando(false);
      return;
    }

    salvandoRef.current = true;
    try {
      await atualizar.mutateAsync({ id: intimacaoId, observacoes: novo || null });
      setTexto(novo);
      setEditando(false);
      try {
        await registrarEvento.mutateAsync({
          ator_id: usuario?.id ?? null,
          entidade: "intimacao",
          entidade_id: intimacaoId,
          acao: "observacao_alterada",
          antes: anterior,
          depois: novo,
        });
      } catch {
        toast.warning("Observação salva, mas não foi possível registrar o histórico.");
      }
    } catch {
      toast.error("Não foi possível salvar a observação.");
    } finally {
      salvandoRef.current = false;
    }
  }

  function cancelar(textarea: HTMLTextAreaElement) {
    cancelarRef.current = true;
    textarea.blur();
    setTexto(observacao ?? "");
    setEditando(false);
  }

  return (
    <div className="min-w-[220px]" onClick={(evento) => evento.stopPropagation()}>
      {editando ? (
        <div>
          <textarea
            autoFocus
            rows={2}
            value={texto}
            onChange={(evento) => setTexto(evento.target.value)}
            onBlur={() => {
              if (cancelarRef.current) {
                cancelarRef.current = false;
                return;
              }
              void salvar();
            }}
            onKeyDown={(evento) => {
              if (evento.key === "Escape") {
                evento.preventDefault();
                cancelar(evento.currentTarget);
              } else if (evento.key === "Enter" && !evento.shiftKey) {
                evento.preventDefault();
                void salvar();
              }
            }}
            disabled={atualizar.isPending}
            aria-label="Editar observação"
            className="w-full resize-y rounded-sm border border-border bg-background px-2 py-1.5 text-[11px] outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          {atualizar.isPending ? <span className="mt-1 block text-[10px] text-muted-foreground">Salvando…</span> : null}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditando(true)}
          aria-label={observacao ? `Editar observação: ${observacao}` : "Escrever observação"}
          className="w-full whitespace-normal rounded-sm px-1 py-1 text-left text-[11px] text-muted-foreground hover:bg-secondary/50"
        >
          {observacao || <span className="italic">Escrever observação…</span>}
        </button>
      )}
    </div>
  );
}
