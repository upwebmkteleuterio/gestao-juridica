import { useEffect, useRef, type RefObject } from "react";

/** Pilha das sobreposições abertas: apenas a última responde ao Escape. */
const pilha: symbol[] = [];

/**
 * Comportamento comum a modais e painéis laterais: fecha com Escape,
 * bloqueia a rolagem do fundo e devolve o foco ao elemento de origem.
 */
export function useOverlay(
  aberto: boolean,
  onClose: () => void,
  ref: RefObject<HTMLElement | null>,
): void {
  const focoAnterior = useRef<HTMLElement | null>(null);
  const marca = useRef(Symbol("overlay"));
  const fecharAtual = useRef(onClose);

  useEffect(() => {
    fecharAtual.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!aberto) return undefined;

    const identificador = marca.current;
    pilha.push(identificador);

    focoAnterior.current = document.activeElement as HTMLElement | null;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key !== "Escape") return;
      if (pilha[pilha.length - 1] !== identificador) return;
      fecharAtual.current();
    };
    document.addEventListener("keydown", aoTeclar);

    ref.current?.focus();

    return () => {
      document.removeEventListener("keydown", aoTeclar);
      const posicao = pilha.lastIndexOf(identificador);
      if (posicao >= 0) pilha.splice(posicao, 1);
      document.body.style.overflow = overflowAnterior;
      focoAnterior.current?.focus?.();
    };
  }, [aberto, ref]);
}
