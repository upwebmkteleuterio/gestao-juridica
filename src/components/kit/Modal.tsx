import { X } from "lucide-react";
import { useRef, type ReactNode } from "react";
import { useOverlay } from "@/hooks";
import { cn } from "@/lib/utils";
import { Button, IconButton } from "./Button";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  titulo: string;
  descricao?: string;
  children?: ReactNode;
  footer?: ReactNode;
  largura?: string;
  className?: string;
}

/** Diálogo centralizado (telas do tipo Input). */
export function Modal({
  open,
  onClose,
  titulo,
  descricao,
  children,
  footer,
  largura = "max-w-lg",
  className,
}: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);
  useOverlay(open, onClose, ref);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 animate-fade-in bg-navy-950/60"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        tabIndex={-1}
        className={cn(
          "relative z-[81] max-h-[calc(100vh-2rem)] w-full animate-rise-in overflow-y-auto rounded-lg border border-border bg-card p-7 shadow-panel focus:outline-none",
          largura,
          className,
        )}
      >
        <header className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2>{titulo}</h2>
            {descricao ? (
              <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
                {descricao}
              </p>
            ) : null}
          </div>
          <IconButton
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </IconButton>
        </header>
        {children}
        {footer ? (
          <footer className="mt-6 flex flex-wrap justify-end gap-2">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  titulo: string;
  descricao?: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  variante?: "primary" | "danger";
  carregando?: boolean;
  children?: ReactNode;
}

/** Confirmação de ação destrutiva ou de lote — impede envio duplicado. */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  titulo,
  descricao,
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar",
  variante = "primary",
  carregando = false,
  children,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      titulo={titulo}
      descricao={descricao}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={carregando}>
            {textoCancelar}
          </Button>
          <Button
            variant={variante}
            onClick={onConfirm}
            loading={carregando}
          >
            {textoConfirmar}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  );
}
