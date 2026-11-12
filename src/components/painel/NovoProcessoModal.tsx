import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Alert, Button, FormField, Input, Modal, Select, Textarea } from "@/components/kit";
import { useCriarProcessoManual, useNumeroProcessoExistente, useRegistrarEvento, useUsuarioAtual, useValorDebounced } from "@/hooks";
import { cnjValido, formatarDataHora, mascararCnj } from "@/lib/format";
import { TIPOS_NUMERACAO, normalizarNumero } from "@/lib/numeracao";
import type { TipoNumeracao } from "@/types";

interface NovoProcessoModalProps {
  open: boolean;
  onClose: () => void;
}

export function NovoProcessoModal({ open, onClose }: NovoProcessoModalProps) {
  const [tipo, setTipo] = useState<TipoNumeracao | "">("");
  const [numero, setNumero] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [tentouSalvar, setTentouSalvar] = useState(false);
  const navigate = useNavigate();
  const usuario = useUsuarioAtual();

  /* O CNJ é o único formato com padrão definido: recebe máscara e validação.
     Os demais são livres, porque cada órgão numera como quer. */
  const ehCnj = tipo === "cnj";
  const numeroLimpo = numero.trim();
  const numeroValido = ehCnj ? cnjValido(numero) : numeroLimpo.length >= 2;

  /* Duplicidade é igualdade do número sem pontuação: "12345/2024" e
     "12345.2024" são o mesmo processo. O atraso evita uma consulta por tecla. */
  const numeroDebounced = useValorDebounced(numero, 400);
  const existente = useNumeroProcessoExistente(numeroDebounced);
  const verificacaoPendente = normalizarNumero(numero) !== normalizarNumero(numeroDebounced);

  const criar = useCriarProcessoManual();
  const registrarEvento = useRegistrarEvento();

  const erroTipo = tentouSalvar && !tipo ? "Escolha o tipo de numeração." : undefined;
  const erroNumero =
    tentouSalvar && tipo && !numeroValido
      ? ehCnj
        ? "Informe um número CNJ com 20 dígitos."
        : "Informe o número do processo ou procedimento."
      : undefined;

  const dicaNumero = ehCnj
    ? "A máscara do padrão CNJ é aplicada automaticamente (20 dígitos)."
    : tipo
      ? "Digite como está no documento — letras, pontos, barras e traços são aceitos."
      : "Só o CNJ tem formato padronizado; os outros tipos são digitados como estão no documento.";

  useEffect(() => {
    if (!open) return;
    setTipo("");
    setNumero("");
    setObservacoes("");
    setTentouSalvar(false);
  }, [open]);

  function trocarTipo(valor: TipoNumeracao | "") {
    setTipo(valor);
    /* Ao escolher CNJ, o que já estava digitado passa a ser exibido no padrão. */
    setNumero((atual) => (valor === "cnj" ? mascararCnj(atual) : atual));
  }

  async function salvar() {
    setTentouSalvar(true);
    if (!tipo || !numeroValido) return;
    /* Enquanto a checagem está em curso o botão fica bloqueado; estes desvios
       são apenas rede de segurança. */
    if (verificacaoPendente || existente.isFetching) return;
    if (existente.isError) {
      toast.error("Não foi possível confirmar se o processo já existe. Tente novamente.");
      return;
    }

    const duplicado = Boolean(existente.data);
    try {
      const criado = await criar.mutateAsync({
        numero_processo: numeroLimpo,
        tipo_numeracao: tipo,
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
            numero_processo: criado.numero_processo,
            tipo_numeracao: tipo,
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
            disabled={verificacaoPendente || existente.isFetching || existente.isError}
            onClick={salvar}
          >
            Incluir processo
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormField
          label="Tipo de numeração"
          htmlFor="novo-processo-tipo"
          required
          error={erroTipo}
          hint="Defina o tipo antes de digitar: ele fica registrado e aparece na listagem."
        >
          <Select
            id="novo-processo-tipo"
            data-testid="novo-processo-tipo"
            value={tipo}
            onChange={(evento) => trocarTipo(evento.target.value as TipoNumeracao | "")}
            aria-invalid={erroTipo ? true : undefined}
          >
            <option value="">Selecione o tipo</option>
            {TIPOS_NUMERACAO.map((opcao) => (
              <option key={opcao.valor} value={opcao.valor}>
                {opcao.rotulo}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField
          label={ehCnj ? "Número do processo (CNJ)" : "Número do processo / procedimento"}
          htmlFor="novo-processo-numero"
          required
          error={erroNumero}
          hint={dicaNumero}
        >
          <Input
            id="novo-processo-numero"
            data-testid="novo-processo-numero"
            value={numero}
            onChange={(evento) =>
              setNumero(ehCnj ? mascararCnj(evento.target.value) : evento.target.value)
            }
            placeholder={ehCnj ? "0000000-00.0000.0.00.0000" : "Ex.: 12345.000123/2024-11"}
            inputMode={ehCnj ? "numeric" : "text"}
            autoComplete="off"
            aria-invalid={erroNumero ? true : undefined}
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

        {existente.isError ? (
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
