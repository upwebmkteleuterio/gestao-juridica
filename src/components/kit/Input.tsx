import { Search } from "lucide-react";
import {
  forwardRef,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";
import { FormField } from "./FormField";

const baseControle =
  "w-full rounded-sm border border-input bg-card px-3 py-2 text-[11px] text-foreground transition-colors placeholder:text-muted-foreground/70 focus:outline-none focus-visible:border-info focus-visible:ring-2 focus-visible:ring-ring/45 disabled:cursor-not-allowed disabled:opacity-55 aria-[invalid=true]:border-danger";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(baseControle, "min-h-[38px]", className)}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, rows = 4, ...props }, ref) => (
  <textarea
    ref={ref}
    rows={rows}
    className={cn(baseControle, "min-h-[88px] resize-y", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(baseControle, "min-h-[38px] cursor-pointer pr-8", className)}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";

export interface SearchInputProps
  extends InputHTMLAttributes<HTMLInputElement> {
  wrapperClassName?: string;
}

/** Campo de busca instantânea com ícone embutido. */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, wrapperClassName, ...props }, ref) => (
    <div className={cn("relative", wrapperClassName)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <input
        ref={ref}
        type="search"
        className={cn(baseControle, "min-h-[38px] pl-9", className)}
        {...props}
      />
    </div>
  ),
);
SearchInput.displayName = "SearchInput";

export interface DateRangeProps {
  de: string;
  ate: string;
  onDeChange: (valor: string) => void;
  onAteChange: (valor: string) => void;
  idDe?: string;
  idAte?: string;
  rotuloDe?: string;
  rotuloAte?: string;
  erro?: string;
  className?: string;
}

/** Intervalo de disponibilização com validação de ordem. */
export function DateRange({
  de,
  ate,
  onDeChange,
  onAteChange,
  idDe = "data-de",
  idAte = "data-ate",
  rotuloDe = "Disponibilizado de",
  rotuloAte = "Até",
  erro,
  className,
}: DateRangeProps) {
  const intervaloInvalido = Boolean(de && ate && de > ate);
  const mensagem = erro ?? (intervaloInvalido ? "A data inicial deve ser anterior à final." : undefined);

  return (
    <div className={cn("grid grid-cols-2 gap-3", className)}>
      <FormField label={rotuloDe} htmlFor={idDe} error={mensagem}>
        <Input
          id={idDe}
          type="date"
          value={de}
          onChange={(evento) => onDeChange(evento.target.value)}
          aria-invalid={intervaloInvalido || undefined}
        />
      </FormField>
      <FormField label={rotuloAte} htmlFor={idAte}>
        <Input
          id={idAte}
          type="date"
          value={ate}
          onChange={(evento) => onAteChange(evento.target.value)}
          aria-invalid={intervaloInvalido || undefined}
        />
      </FormField>
    </div>
  );
}
