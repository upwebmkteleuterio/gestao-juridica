import { useEffect } from "react";
import { useUiStore, type Tema } from "@/store";

/** Aplica a classe `dark` no <html> conforme a preferência do usuário. */
export function useAplicarTema(): void {
  const tema = useUiStore((estado) => estado.tema);

  useEffect(() => {
    const raiz = document.documentElement;
    raiz.classList.toggle("dark", tema === "dark");
    raiz.style.colorScheme = tema;
  }, [tema]);
}

export function useTheme() {
  const tema = useUiStore((estado) => estado.tema);
  const setTema = useUiStore((estado) => estado.setTema);
  const alternarTema = useUiStore((estado) => estado.alternarTema);

  return {
    tema,
    setTema: (valor: Tema) => setTema(valor),
    alternarTema,
    isDark: tema === "dark",
  };
}
