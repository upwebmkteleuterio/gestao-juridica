import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button, FormField, Input, Panel, PanelHeader } from "@/components/kit";
import { useAtualizarConfiguracoes, useConfiguracoes } from "@/hooks";

export function PrazoConfigPanel() {
  const configuracoes = useConfiguracoes();
  const atualizar = useAtualizarConfiguracoes();
  const [prazo, setPrazo] = useState("");

  useEffect(() => {
    if (!configuracoes.data) return;
    setPrazo(configuracoes.data.prazo_padrao_dias_uteis?.toString() ?? "");
  }, [configuracoes.data]);

  const valor = prazo.trim();
  const dias = valor === "" ? null : Number(valor);
  const erroPrazo = valor !== "" && (!/^\d+$/.test(valor) || !Number.isInteger(dias) || dias! < 1 || dias! > 365)
    ? "Informe um número inteiro entre 1 e 365 dias úteis."
    : "";

  async function salvar() {
    if (erroPrazo) return;
    try {
      await atualizar.mutateAsync({ prazo_padrao_dias_uteis: dias });
      toast.success("Prazo padrão salvo.");
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível salvar o prazo padrão.");
    }
  }

  return (
    <Panel>
      <PanelHeader titulo="Prazo padrão" descricao="Defina um prazo para sugerir a data fatal quando a publicação não declarar um prazo." />
      <div className="space-y-5 p-5">
        <FormField
          label="Prazo padrão (dias úteis)"
          htmlFor="djen-prazo-padrao"
          hint="Usado apenas para sugerir a data fatal quando a publicação não declara o prazo; o advogado confirma a data. Deixe vazio para não configurar."
          error={erroPrazo}
        >
          <Input
            id="djen-prazo-padrao"
            type="number"
            min={1}
            max={365}
            inputMode="numeric"
            value={prazo}
            aria-invalid={Boolean(erroPrazo) || undefined}
            onChange={(evento) => setPrazo(evento.target.value)}
          />
        </FormField>
        <div className="flex justify-end">
          <Button variant="primary" onClick={salvar} loading={atualizar.isPending} disabled={configuracoes.isLoading || Boolean(erroPrazo)}>
            Salvar prazo padrão
          </Button>
        </div>
      </div>
    </Panel>
  );
}
