import { useEffect, useState } from "react";

/**
 * Atrasa a propagação de um valor (ex.: busca instantânea) para evitar uma
 * requisição por tecla digitada.
 */
export function useValorDebounced<T>(valor: T, atraso = 350): T {
  const [debounced, setDebounced] = useState(valor);

  useEffect(() => {
    const temporizador = setTimeout(() => setDebounced(valor), atraso);
    return () => clearTimeout(temporizador);
  }, [valor, atraso]);

  return debounced;
}
