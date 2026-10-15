import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks";
import { IconButton } from "@/components/kit";

/** Alternância claro/escuro — a escolha do usuário é persistida. */
export function ThemeToggle() {
  const { tema, alternarTema } = useTheme();
  const escuro = tema === "dark";

  return (
    <IconButton
      variant="secondary"
      onClick={alternarTema}
      aria-label={escuro ? "Ativar tema claro" : "Ativar tema escuro"}
      title={escuro ? "Tema claro" : "Tema escuro"}
    >
      {escuro ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </IconButton>
  );
}
