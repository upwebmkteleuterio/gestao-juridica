import { RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge, Button, Checkbox, FormField, Input, Modal } from "@/components/kit";
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

const ESCOPO_NEUTRO: Record<EscopoOpcao["chave"], boolean> = {
  marco_zero_indicadores: false,
  marco_zero_lista: false,
  marco_zero_exportacao: false,
};

export interface MarcoZeroModalProps {
  open: boolean;
  onClose: () => void;
  ehAdmin: boolean;
}

/**
 * Marco zero do escritório: a partir de qual data o painel contabiliza as
 * publicações. É uma configuração única (vale para todos) e exclusiva do
 * administrador — os demais perfis apenas consultam o marco vigente.
 */
export function MarcoZeroModal({ open, onClose, ehAdmin }: MarcoZeroModalProps) {
  const { data: config } = useConfiguracoes();
  const atualizar = useAtualizarConfiguracoes();

  const [data, setData] = useState("");
  const [escopo, setEscopo] = useState(ESCOPO_NEUTRO);

  /* Cada abertura parte do que está salvo no banco. */
  useEffect(() => {
    if (!open || !config) return;
    setData(config.marco_zero ?? "");
    setEscopo({
      marco_zero_indicadores: config.marco_zero_indicadores,
      marco_zero_lista: config.marco_zero_lista,
      marco_zero_exportacao: config.marco_zero_exportacao,
    });
  }, [open, config]);

  const marcoAtivo = Boolean(config?.marco_zero);
  const escoposAtivos = ESCOPOS.filter((opcao) => config?.[opcao.chave]);
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
        onSuccess: () => {
          toast.success("Marco zero aplicado ao painel.");
          onClose();
        },
        onError: () => toast.error("Não foi possível salvar o marco zero."),
      },
    );
  }

  function remover() {
    atualizar.mutate(
      { marco_zero: null, ...ESCOPO_NEUTRO },
      {
        onSuccess: () => {
          toast.success("Marco zero removido — o painel volta a contar tudo.");
          onClose();
        },
        onError: () => toast.error("Não foi possível remover o marco zero."),
      },
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      titulo="Marco zero do painel"
      descricao="Define a partir de qual data o escritório contabiliza as publicações. O recorte é aplicado no banco, de forma independente para indicadores, lista e exportação."
      footer={
        <>
          {ehAdmin && marcoAtivo ? (
            <Button
              variant="ghost"
              onClick={remover}
              disabled={salvando}
              className="mr-auto"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Remover marco
            </Button>
          ) : null}
          <Button variant="secondary" onClick={onClose} disabled={salvando}>
            {ehAdmin ? "Cancelar" : "Fechar"}
          </Button>
          {ehAdmin ? (
            <Button variant="gold" onClick={aplicar} loading={salvando}>
              Aplicar marco
            </Button>
          ) : null}
        </>
      }
    >
      {ehAdmin ? (
        <div className="space-y-5">
          <FormField
            label="Contar a partir de"
            htmlFor="marco-zero-data"
            hint="Publicações anteriores a esta data ficam fora dos recortes marcados abaixo."
          >
            <Input
              id="marco-zero-data"
              type="date"
              value={data}
              onChange={(evento) => setData(evento.target.value)}
            />
          </FormField>

          <fieldset className="rounded-sm border border-border px-4 py-3">
            <legend className="px-1 text-[11px] font-semibold">
              Onde o marco zero vale
            </legend>
            <div className="flex flex-wrap gap-x-6 gap-y-3 pt-1">
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
            </div>
          </fieldset>
        </div>
      ) : (
        <div className="space-y-3 text-[11px]">
          {marcoAtivo ? (
            <>
              <p className="flex items-center gap-2">
                <span className="text-muted-foreground">Marco vigente:</span>
                <Badge variant="gold">{formatarData(config?.marco_zero)}</Badge>
              </p>
              <p className="text-muted-foreground">
                Vale para{" "}
                {escoposAtivos.length
                  ? escoposAtivos
                      .map((opcao) => opcao.rotulo.toLowerCase())
                      .join(", ")
                  : "nenhum recorte"}
                . Somente o administrador altera o marco zero.
              </p>
            </>
          ) : (
            <p className="text-muted-foreground">
              Sem marco zero: o painel conta todo o histórico capturado.
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
