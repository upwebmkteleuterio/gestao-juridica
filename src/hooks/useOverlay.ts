import { useEffect, useRef, type RefObject } from "react";

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

  useEffect(() => {
    if (!aberto) return undefined;

    focoAnterior.current = document.activeElement as HTMLElement | null;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") onClose();
    };
    document.addEventListener("keydown", aoTeclar);

    ref.current?.focus();

    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = overflowAnterior;
      focoAnterior.current?.focus?.();
    };
  }, [aberto, onClose, ref]);
}
