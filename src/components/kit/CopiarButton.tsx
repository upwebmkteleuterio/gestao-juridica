import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { IconButton } from "./Button";

export interface CopiarButtonProps {
  valor: string;
  rotulo?: string;
  mensagem?: string;
  className?: string;
}

export function CopiarButton({ valor, rotulo = "Copiar", mensagem = "Copiado.", className }: CopiarButtonProps) {
  const [copiado, setCopiado] = useState(false);
  const timeout = useRef<number | null>(null);

  useEffect(() => () => {
    if (timeout.current !== null) window.clearTimeout(timeout.current);
  }, []);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(valor);
      setCopiado(true);
      toast.success(mensagem);
      if (timeout.current !== null) window.clearTimeout(timeout.current);
      timeout.current = window.setTimeout(() => setCopiado(false), 2000);
    } catch {
      toast.error("Não foi possível copiar.");
    }
  }

  return (
    <IconButton
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={rotulo}
      title={rotulo}
      className={className}
      onClick={() => void copiar()}
    >
      {copiado ? <Check className="h-3.5 w-3.5 text-success" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
    </IconButton>
  );
}
