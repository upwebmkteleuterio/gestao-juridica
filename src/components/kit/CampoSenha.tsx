import { Eye, EyeOff } from "lucide-react";
import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Input } from "./Input";

export interface CampoSenhaProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  wrapperClassName?: string;
}

export const CampoSenha = forwardRef<HTMLInputElement, CampoSenhaProps>(
  ({ className, wrapperClassName, disabled, ...props }, ref) => {
    const [visivel, setVisivel] = useState(false);
    const rotuloBotao = visivel ? "Ocultar senha" : "Mostrar senha";

    return (
      <div className={cn("relative", wrapperClassName)}>
        <Input
          {...props}
          ref={ref}
          disabled={disabled}
          type={visivel ? "text" : "password"}
          className={cn("pr-10", className)}
        />
        <button
          type="button"
          onClick={() => setVisivel((atual) => !atual)}
          disabled={disabled}
          aria-label={rotuloBotao}
          aria-pressed={visivel}
          title={rotuloBotao}
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        >
          {visivel ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>
    );
  },
);
CampoSenha.displayName = "CampoSenha";
