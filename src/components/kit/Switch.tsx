import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type SwitchProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "role"
>;

/** Alternador no estilo do kit (trilha em pílula, botão branco). */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      type="checkbox"
      role="switch"
      className={cn(
        "relative h-5 w-9 shrink-0 cursor-pointer appearance-none rounded-full border border-input bg-input transition-colors",
        "before:absolute before:left-[3px] before:top-[3px] before:h-3.5 before:w-3.5 before:rounded-full before:bg-white before:shadow-sm before:transition-transform before:content-['']",
        "checked:border-primary checked:bg-primary checked:before:translate-x-4",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-55",
        className,
      )}
      {...props}
    />
  ),
);
Switch.displayName = "Switch";

export interface SwitchRowProps {
  id: string;
  titulo: ReactNode;
  descricao?: ReactNode;
  className?: string;
}

/** Linha "rótulo + descrição + alternador" (preferências). */
export function SwitchRow({ id, titulo, descricao, className }: SwitchRowProps) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-center justify-between gap-4 py-3 text-[11px]",
        className,
      )}
    >
      <span>
        <strong className="font-semibold">{titulo}</strong>
        {descricao ? (
          <span className="mt-0.5 block text-[10px] text-muted-foreground">
            {descricao}
          </span>
        ) : null}
      </span>
      <Switch id={id} />
    </label>
  );
}
