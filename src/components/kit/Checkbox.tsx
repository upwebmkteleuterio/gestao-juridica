import {
  forwardRef,
  useEffect,
  useRef,
  type InputHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** Estado parcial (ex.: "selecionar todos" com seleção incompleta). */
  indeterminate?: boolean;
}

/** Caixa de seleção do kit — usada em tabelas e checklists. */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, indeterminate = false, ...props }, ref) => {
    const interno = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
      if (interno.current) interno.current.indeterminate = indeterminate;
    }, [indeterminate]);

    return (
      <input
        ref={(no) => {
          interno.current = no;
          if (typeof ref === "function") ref(no);
          else if (ref) ref.current = no;
        }}
        type="checkbox"
        className={cn(
          "h-3.5 w-3.5 shrink-0 cursor-pointer rounded-sm accent-[hsl(var(--primary))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-55",
          className,
        )}
        {...props}
      />
    );
  },
);
Checkbox.displayName = "Checkbox";
