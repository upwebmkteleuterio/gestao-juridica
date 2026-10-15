import type { ReactNode } from "react";
import { Button } from "./Button";
import { Modal } from "./Modal";

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
          <Button variant={variante} onClick={onConfirm} loading={carregando}>
            {textoConfirmar}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  );
}
