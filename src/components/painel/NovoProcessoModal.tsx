import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Alert, Button, FormField, Input, Modal, Textarea } from "@/components/kit";
import { useCriarProcessoManual, useNumeroProcessoExistente, useRegistrarEvento, useUsuarioAtual } from "@/hooks";
import { cnjValido, formatarDataHora, mascararCnj } from "@/lib/format";

interface NovoProcessoModalProps {
  open: boolean;
  onClose: () => void;
}

export function NovoProcessoModal({ open, onClose }: NovoProcessoModalProps) {
  const [numero, setNumero] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [tentouSalvar, setTentouSalvar] = useState(false);
  const navigate = useNavigate();
  const usuario = useUsuarioAtual();
  const numeroDigitos = numero.replace(/\D/g, "");
  const existente = useNumeroProcessoExistente(numeroDigitos);
  const criar = useCriarProcessoManual();
  const registrarEvento = useRegistrarEvento();
  const numeroInvalido = tentouSalvar && !cnjValido(numero);

  useEffect(() => {
    if (!open) return;
    setNumero("");
    setObservacoes("");
    setTentouSalvar(false);
  }, [open]);

  async function salvar() {
    setTentouSalvar(true);
    if (!cnjValido(numero)) return;
    if (existente.isFetching || existente.isError) {
      toast.error("Não foi possível confirmar se o processo já existe. Tente novamente.");
      return;
    }

    const duplicado = Boolean(existente.data);
    try {
      const criado = await criar.mutateAsync({
        numero_processo: numeroDigitos,
        observacoes: observacoes.trim() || null,
        duplicado,
      });
      try {
        await registrarEvento.mutateAsync({
          ator_id: usuario?.id ?? null,
          entidade: "intimacao",
          entidade_id: criado.id,
          acao: "criar",
          antes: null,
          depois: JSON.stringify({
            numero_processo: numeroDigitos,
            observacoes: observacoes.trim() || null,
            duplicado,
          }),
        });
      } catch {
        toast.warning("Processo incluído, mas não foi possível registrar o histórico.");
      }
      toast.success("Processo incluído no painel.");
      onClose();
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível incluir o processo.");
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      titulo="Incluir processo manualmente"
      descricao="O processo será adicionado à triagem do Painel de Intimações."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={criar.isPending}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            loading={criar.isPending}
            disabled={existente.isFetching || existente.isError}
            onClick={salvar}
          >
            Incluir processo
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormField
          label="Número do processo (CNJ)"
          htmlFor="novo-processo-cnj"
          required
          error={numeroInvalido ? "Informe um número CNJ com 20 dígitos." : undefined}
        >
          <Input
            id="novo-processo-cnj"
            value={numero}
            onChange={(evento) => setNumero(mascararCnj(evento.target.value))}
            placeholder="0000000-00.0000.0.00.0000"
            inputMode="numeric"
            aria-invalid={numeroInvalido || undefined}
          />
        </FormField>

        <FormField
          label="Observações"
          htmlFor="novo-processo-observacoes"
          hint="Anotações operacionais, como documentos a juntar e com quem está o documento."
        >
          <Textarea
            id="novo-processo-observacoes"
            rows={3}
            value={observacoes}
            onChange={(evento) => setObservacoes(evento.target.value)}
            placeholder="Escreva uma observação (opcional)"
          />
        </FormField>

        {numeroDigitos.length === 20 && existente.isError ? (
          <Alert
            severidade="danger"
            titulo="Não foi possível verificar duplicidade"
            acao={<Button variant="secondary" size="sm" onClick={() => void existente.refetch()}>Tentar novamente</Button>}
          >
            Tente novamente antes de incluir o processo.
          </Alert>
        ) : null}

        {existente.data ? (
          <Alert
            severidade="warning"
            titulo="Este número já está na lista"
            acao={(
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate(`/painel/publicacao/${existente.data?.id}`)}
              >
                Abrir o registro existente
              </Button>
            )}
          >
            Já existe um registro desde {formatarDataHora(existente.data.created_at)}. Você ainda pode incluir outro, mas o recomendado é escrever a informação no registro que já existe.
          </Alert>
        ) : null}
      </div>
    </Modal>
  );
}

