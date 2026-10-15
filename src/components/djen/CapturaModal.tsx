import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Zap } from "lucide-react";
import { toast } from "sonner";
import {
  Alert,
  Button,
  DateRange,
  FormField,
  Input,
  Modal,
  Select,
} from "@/components/kit";
import {
  useConfiguracoes,
  useDispararConsultaDjen,
  useRegistrarEvento,
  useTribunaisDjen,
} from "@/hooks";
import { MAX_DIAS_CAPTURA } from "@/services";
import { UFS } from "@/lib/ufs";
import { useUsuarioAtual } from "@/hooks";

export interface CapturaModalProps {
  open: boolean;
  onClose: () => void;
}

interface ErrosFormulario {
  oabNumero?: string;
  oabUf?: string;
  dataDe?: string;
  dataAte?: string;
}

function diferencaEmDias(de: string, ate: string): number {
  const inicio = Date.parse(`${de.slice(0, 10)}T12:00:00Z`);
  const fim = Date.parse(`${ate.slice(0, 10)}T12:00:00Z`);
  return Math.round((fim - inicio) / 86_400_000);
}

export function CapturaModal({ open, onClose }: CapturaModalProps) {
  const usuario = useUsuarioAtual();
  const configuracoes = useConfiguracoes();
  const tribunais = useTribunaisDjen();
  const disparar = useDispararConsultaDjen();
  const registrarEvento = useRegistrarEvento();
  const preencheuOab = useRef(false);

  const [oabNumero, setOabNumero] = useState("");
  const [oabUf, setOabUf] = useState("");
  const [dataDe, setDataDe] = useState("");
  const [dataAte, setDataAte] = useState("");
  const [tribunal, setTribunal] = useState("");
  const [erros, setErros] = useState<ErrosFormulario>({});
  const [tentouEnviar, setTentouEnviar] = useState(false);

  useEffect(() => {
    if (!open) {
      preencheuOab.current = false;
      return;
    }
    if (!configuracoes.isSuccess || preencheuOab.current) return;

    const primeiraOab = configuracoes.data.oabs_monitoradas[0] ?? "";
    const [numero = "", uf = ""] = primeiraOab.split("/");
    setOabNumero(numero.replace(/\D/g, ""));
    setOabUf(uf.toUpperCase());
    preencheuOab.current = true;
  }, [open, configuracoes.data, configuracoes.isSuccess]);

  const diasSelecionados = useMemo(
    () => (dataDe && dataAte ? diferencaEmDias(dataDe, dataAte) : null),
    [dataDe, dataAte],
  );
  const periodoExcedeLimite =
    diasSelecionados !== null && diasSelecionados > MAX_DIAS_CAPTURA;

  function validar(
    numero = oabNumero,
    uf = oabUf,
    de = dataDe,
    ate = dataAte,
  ): ErrosFormulario {
    const novosErros: ErrosFormulario = {};
    if (!numero) novosErros.oabNumero = "Informe o número da OAB.";
    if (!uf) novosErros.oabUf = "Selecione a UF da OAB.";
    if (!de) novosErros.dataDe = "Informe a data inicial.";
    if (!ate) novosErros.dataAte = "Informe a data final.";
    if (de && ate && de > ate) {
      novosErros.dataDe = "A data inicial deve ser anterior à final.";
      novosErros.dataAte = "A data final deve ser posterior à inicial.";
    } else if (de && ate && diferencaEmDias(de, ate) > MAX_DIAS_CAPTURA) {
      novosErros.dataDe = `Reduza o período para até ${MAX_DIAS_CAPTURA} dias.`;
    }
    return novosErros;
  }

  async function executarCaptura(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setTentouEnviar(true);
    const novosErros = validar();
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) return;

    try {
      const resultado = await disparar.mutateAsync({
        oab_numero: oabNumero,
        oab_uf: oabUf,
        disponibilizacaoDe: dataDe,
        disponibilizacaoAte: dataAte,
        ...(tribunal ? { tribunal } : {}),
      });
      registrarEvento.mutate({
        ator_id: usuario?.id ?? null,
        entidade: "captura_djen",
        entidade_id: `${oabNumero}/${oabUf}`,
        acao: "captura_executada",
        antes: null,
        depois: `${resultado.recebidas} comunicações recebidas · ${resultado.duplicadas} duplicadas`,
      });
      toast.success(resultado.mensagem);
      onClose();
    } catch (erro) {
      toast.error(
        erro instanceof Error
          ? erro.message
          : "Não foi possível executar a captura.",
      );
    }
  }

  function atualizarDataDe(valor: string) {
    setDataDe(valor);
    if (tentouEnviar) setErros(validar(oabNumero, oabUf, valor, dataAte));
  }

  function atualizarDataAte(valor: string) {
    setDataAte(valor);
    if (tentouEnviar) setErros(validar(oabNumero, oabUf, dataDe, valor));
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      largura="max-w-xl"
      titulo="Disparo manual de consulta DJEN"
      descricao="Aciona imediatamente a captura na API pública do CNJ, sem esperar o agendamento diário do robô."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={disparar.isPending}>
            Cancelar
          </Button>
          <Button
            form="djen-captura-form"
            type="submit"
            variant="primary"
            loading={disparar.isPending}
          >
            <Zap className="h-3.5 w-3.5" aria-hidden="true" />
            Executar captura agora
          </Button>
        </>
      }
    >
      <form id="djen-captura-form" className="space-y-4" onSubmit={executarCaptura}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Número da OAB"
            htmlFor="captura-oab-numero"
            required
            error={erros.oabNumero}
          >
            <Input
              id="captura-oab-numero"
              inputMode="numeric"
              value={oabNumero}
              aria-invalid={Boolean(erros.oabNumero) || undefined}
              onChange={(evento) => {
                const numero = evento.target.value.replace(/\D/g, "");
                setOabNumero(numero);
                if (tentouEnviar) setErros(validar(numero, oabUf));
              }}
            />
          </FormField>
          <FormField
            label="UF da OAB"
            htmlFor="captura-oab-uf"
            required
            error={erros.oabUf}
          >
            <Select
              id="captura-oab-uf"
              value={oabUf}
              aria-invalid={Boolean(erros.oabUf) || undefined}
              onChange={(evento) => {
                const uf = evento.target.value;
                setOabUf(uf);
                if (tentouEnviar) setErros(validar(oabNumero, uf));
              }}
            >
              <option value="">Selecione a UF</option>
              {UFS.map((uf) => (
                <option key={uf.sigla} value={uf.sigla}>
                  {uf.sigla} — {uf.nome}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <div>
          <DateRange
            de={dataDe}
            ate={dataAte}
            onDeChange={atualizarDataDe}
            onAteChange={atualizarDataAte}
            idDe="captura-data-de"
            idAte="captura-data-ate"
            rotuloDe="Data de disponibilização inicial *"
            rotuloAte="Data de disponibilização final *"
            erro={erros.dataDe}
          />
          {erros.dataAte ? (
            <p className="mt-1.5 text-[10px] font-medium text-danger">
              {erros.dataAte}
            </p>
          ) : null}
          {periodoExcedeLimite ? (
            <Alert
              className="mt-3"
              severidade="warning"
              titulo="Período acima do limite"
            >
              A API do CNJ limita pesquisas amplas a blocos de resultados. Reduza o período para até 5 dias para não exceder a paginação.
            </Alert>
          ) : null}
        </div>

        <FormField label="Tribunal específico (opcional)" htmlFor="captura-tribunal">
          <Select
            id="captura-tribunal"
            value={tribunal}
            onChange={(evento) => setTribunal(evento.target.value)}
          >
            <option value="">Todos os tribunais</option>
            {(tribunais.data ?? []).map((sigla) => (
              <option key={sigla} value={sigla}>
                {sigla}
              </option>
            ))}
          </Select>
        </FormField>

        <Alert severidade="info" titulo="Ambiente de demonstração">
          A captura é simulada localmente e o UPSERT usa o <code>djen_id_original</code> como chave, descartando publicações já ingeridas.
        </Alert>
      </form>
    </Modal>
  );
}
