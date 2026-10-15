import { X } from "lucide-react";
import { useRef, type ReactNode } from "react";
import { useOverlay } from "@/hooks";
import { cn } from "@/lib/utils";
import { IconButton } from "./Button";

export interface SlidePanelProps {
  open: boolean;
  onClose: () => void;
  titulo: string;
  eyebrow?: string;
  badge?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/** Painel lateral deslizante — detalhes sem perder o contexto da operação. */
export function SlidePanel({
  open,
  onClose,
  titulo,
  eyebrow,
  badge,
  children,
  footer,
  className,
}: SlidePanelProps) {
  const ref = useRef<HTMLDivElement>(null);
  useOverlay(open, onClose, ref);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70]">
      <div
        className="absolute inset-0 animate-fade-in bg-navy-950/60"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        tabIndex={-1}
        className={cn(
          "absolute inset-y-0 right-0 flex w-full max-w-[520px] animate-slide-in-right flex-col bg-card shadow-drawer focus:outline-none",
          className,
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-border px-7 py-6">
          <div className="min-w-0">
            {eyebrow ? (
              <p className="eyebrow mb-2 text-muted-foreground">{eyebrow}</p>
            ) : null}
            <h2 className="truncate">{titulo}</h2>
            {badge ? <div className="mt-3">{badge}</div> : null}
          </div>
          <IconButton
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Fechar painel"
          >
            <X className="h-4 w-4" />
          </IconButton>
        </header>
        <div className="flex-1 overflow-y-auto px-7 py-6">{children}</div>
        {footer ? (
          <footer className="border-t border-border px-7 py-5">{footer}</footer>
        ) : null}
      </aside>
    </div>
  );
}
