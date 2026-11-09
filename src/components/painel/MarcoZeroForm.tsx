import { Flag, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge, Button, Checkbox, FormField, Input } from "@/components/kit";
import { useAtualizarConfiguracoes, useConfiguracoes } from "@/hooks";
import { formatarData } from "@/lib/format";

interface EscopoOpcao {
  chave: "marco_zero_indicadores" | "marco_zero_lista" | "marco_zero_exportacao";
  rotulo: string;
}

const ESCOPOS: EscopoOpcao[] = [
  { chave: "marco_zero_indicadores", rotulo: "Indicadores" },
  { chave: "marco_zero_lista", rotulo: "Lista" },
  { chave: "marco_zero_exportacao", rotulo: "Exportação" },
];

/**
 * Marco zero do escritório: a partir de qual data o painel contabiliza as
 * publicações. É uma configuração única (vale para todos) e exclusiva do
 * administrador — os demais perfis apenas consultam o marco vigente.
 */
export function MarcoZeroForm({ ehAdmin }: { ehAdmin: boolean }) {
  const { data: config } = useConfiguracoes();
  const atualizar = useAtualizarConfiguracoes();

  const [data, setData] = useState("");
  const [escopo, setEscopo] = useState<Record<EscopoOpcao["chave"], boolean>>({
    marco_zero_indicadores: false,
    marco_zero_lista: false,
    marco_zero_exportacao: false,
  });

  useEffect(() => {
    if (!config) return;
    setData(config.marco_zero ?? "");
    setEscopo({
      marco_zero_indicadores: config.marco_zero_indicadores,
      marco_zero_lista: config.marco_zero_lista,
      marco_zero_exportacao: config.marco_zero_exportacao,
    });
  }, [config]);

  const marcoAtivo = Boolean(config?.marco_zero);
  const escoposAtivos = ESCOPOS.filter((opcao) => config?.[opcao.chave]);

  if (!ehAdmin) {
    if (!marcoAtivo) return null;
    return (
      <div className="flex flex-wrap items-center gap-3 border-t border-border bg-secondary/40 px-5 py-3">
        <span className="flex items-center gap-2 text-[10px] uppercase tracking-wide text-muted-foreground">
          <Flag className="h-3.5 w-3.5" aria-hidden="true" />
          Marco zero
        </span>
        <Badge variant="gold">{formatarData(config?.marco_zero)}</Badge>
        <span className="text-[10px] text-muted-foreground">
          Vale para {escoposAtivos.map((opcao) => opcao.rotulo.toLowerCase()).join(", ") || "nenhum recorte"}.
        </span>
      </div>
    );
  }

  const salvando = atualizar.isPending;

  function aplicar() {
    if (!data) {
      toast.error("Informe a data do marco zero.");
      return;
    }
    if (!ESCOPOS.some((opcao) => escopo[opcao.chave])) {
      toast.error("Escolha ao menos onde o marco zero deve valer.");
      return;
    }
    atualizar.mutate(
      { marco_zero: data, ...escopo },
      {
        onSuccess: () => toast.success("Marco zero aplicado ao painel."),
        onError: () => toast.error("Não foi possível salvar o marco zero."),
      },
    );
  }

  function remover() {
    atualizar.mutate(
      {
        marco_zero: null,
        marco_zero_indicadores: false,
        marco_zero_lista: false,
        marco_zero_exportacao: false,
      },
      {
        onSuccess: () => toast.success("Marco zero removido — o painel volta a contar tudo."),
        onError: () => toast.error("Não foi possível remover o marco zero."),
      },
    );
  }

  return (
    <div className="flex flex-wrap items-end gap-x-6 gap-y-4 border-t border-border bg-secondary/40 px-5 py-4">
      <div className="flex min-w-[190px] items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-gold-100 text-gold-600 dark:bg-gold-500/15 dark:text-gold-400">
          <Flag className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <p className="text-[11px] font-semibold">Marco zero</p>
          <p className="text-[10px] text-muted-foreground">
            Conta apenas o que entrou a partir desta data.
          </p>
        </div>
      </div>

      <FormField label="Contar a partir de" htmlFor="marco-zero-data">
        <Input
          id="marco-zero-data"
          type="date"
          value={data}
          onChange={(evento) => setData(evento.target.value)}
          className="w-[160px]"
        />
      </FormField>

      <fieldset className="flex flex-wrap items-center gap-4 pb-1.5">
        <legend className="sr-only">Onde o marco zero deve valer</legend>
        {ESCOPOS.map((opcao) => (
          <label
            key={opcao.chave}
            htmlFor={`marco-zero-${opcao.chave}`}
            className="flex cursor-pointer items-center gap-2 text-[11px]"
          >
            <Checkbox
              id={`marco-zero-${opcao.chave}`}
              checked={escopo[opcao.chave]}
              onChange={(evento) =>
                setEscopo((atual) => ({
                  ...atual,
                  [opcao.chave]: evento.target.checked,
                }))
              }
            />
            {opcao.rotulo}
          </label>
        ))}
      </fieldset>

      <div className="flex items-center gap-2 pb-0.5">
        <Button variant="gold" onClick={aplicar} loading={salvando}>
          Aplicar marco
        </Button>
        {marcoAtivo ? (
          <Button variant="ghost" onClick={remover} disabled={salvando}>
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Remover
          </Button>
        ) : null}
      </div>

      <p className="w-full text-[10px] text-muted-foreground">
        {marcoAtivo
          ? `Marco vigente: ${formatarData(config?.marco_zero)}${
              escoposAtivos.length
                ? ` · ${escoposAtivos.map((opcao) => opcao.rotulo.toLowerCase()).join(", ")}`
                : ""
            }.`
          : "Sem marco zero: o painel conta todo o histórico capturado."}
      </p>
    </div>
  );
}
