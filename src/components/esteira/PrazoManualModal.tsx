import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Alert,
  Button,
  FormField,
  Input,
  Modal,
  SegmentedControl,
  Select,
  Skeleton,
  Textarea,
} from "@/components/kit";
import { useAdvogadosVisiveis, useCriarTarefaPrazo, useUsuarioAtual } from "@/hooks";
import { calcularDataFatal, type TipoContagemPrazo } from "@/lib/prazos";
import { cnjValido, mascararCnj } from "@/lib/format";
import { useUiStore } from "@/store";

export interface PrazoManualModalProps {
  open: boolean;
  onClose: () => void;
}

type Campos = {
  numero_processo: string;
  tribunal: string;
  partes_resumo: string;
  tipo_peca: string;
  data_ciencia: string;
  dias: string;
  tipo_contagem: TipoContagemPrazo;
  data_fatal: string;
  advogado_id: string;
  notas_internas: string;
};

type Erros = Partial<Record<keyof Campos, string>>;

const CAMPOS_INICIAIS: Campos = {
  numero_processo: "",
  tribunal: "",
  partes_resumo: "",
  tipo_peca: "",
  data_ciencia: "",
  dias: "",
  tipo_contagem: "uteis",
  data_fatal: "",
  advogado_id: "",
  notas_internas: "",
};

function textoRascunho(valor: unknown): string {
  return typeof valor === "string" ? valor : "";
}

export function PrazoManualModal({ open, onClose }: PrazoManualModalProps) {
  const usuario = useUsuarioAtual();
  const rascunho = useUiStore((estado) => estado.rascunhoPrazoManual);
  const setRascunho = useUiStore((estado) => estado.setRascunhoPrazoManual);
  const limparRascunho = useUiStore((estado) => estado.limparRascunhoPrazoManual);
  const criar = useCriarTarefaPrazo();
  const advogadosQuery = useAdvogadosVisiveis();
  const [campos, setCampos] = useState<Campos>(CAMPOS_INICIAIS);
  const [dataFatalManual, setDataFatalManual] = useState(false);
  const [erros, setErros] = useState<Erros>({});
  const [hidratado, setHidratado] = useState(false);

  useEffect(() => {
    if (!open) return;
    const valor = rascunho;
    setCampos({
      numero_processo: mascararCnj(textoRascunho(valor.numero_processo)),
      tribunal: textoRascunho(valor.tribunal),
      partes_resumo: textoRascunho(valor.partes_resumo),
      tipo_peca: textoRascunho(valor.tipo_peca),
      data_ciencia: textoRascunho(valor.data_ciencia),
      dias: textoRascunho(valor.dias),
      tipo_contagem: valor.tipo_contagem === "corridos" ? "corridos" : "uteis",
      data_fatal: textoRascunho(valor.data_fatal),
      advogado_id: textoRascunho(valor.advogado_id) || usuario?.id || "",
      notas_internas: textoRascunho(valor.notas_internas),
    });
    setDataFatalManual(valor.dataFatalManual === true);
    setErros({});
    setHidratado(true);
  }, [open, usuario?.id]);

  useEffect(() => {
    if (!open || !hidratado) return;
    setRascunho({ ...campos, dataFatalManual });
  }, [open, hidratado, campos, dataFatalManual, setRascunho]);

  useEffect(() => {
    if (dataFatalManual) return;
    setCampos((atual) => ({
      ...atual,
      data_fatal: calcularDataFatal(atual.data_ciencia, Number(atual.dias), atual.tipo_contagem) ?? "",
    }));
  }, [campos.data_ciencia, campos.dias, campos.tipo_contagem, dataFatalManual]);

  function alterar<K extends keyof Campos>(chave: K, valor: Campos[K]) {
    setCampos((atual) => ({ ...atual, [chave]: valor }));
    setErros((atuais) => ({ ...atuais, [chave]: undefined }));
  }

  function fechar() {
    limparRascunho();
    setHidratado(false);
    onClose();
  }

  function recalcularDataFatal() {
    const recalculada = calcularDataFatal(campos.data_ciencia, Number(campos.dias), campos.tipo_contagem) ?? "";
    setDataFatalManual(false);
    alterar("data_fatal", recalculada);
  }

  function validar(): Erros {
    const novos: Erros = {};
    if (!cnjValido(campos.numero_processo)) novos.numero_processo = "Informe o número no padrão CNJ (0000000-00.0000.0.00.0000).";
    if (!campos.partes_resumo.trim()) novos.partes_resumo = "Informe o nome das partes.";
    if (!campos.tipo_peca.trim()) novos.tipo_peca = "Informe a ação ou tipo de peça.";
    if (!campos.data_ciencia) novos.data_ciencia = "Informe a data de ciência.";
    if (!campos.dias || Number(campos.dias) <= 0) novos.dias = "Informe um número de dias maior que zero.";
    if (!campos.data_fatal) novos.data_fatal = "Informe ou recalcule a data fatal.";
    if (!campos.advogado_id) novos.advogado_id = "Selecione o advogado responsável.";
    return novos;
  }

  async function cadastrar() {
    const novosErros = validar();
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) return;

    try {
      await criar.mutateAsync({
        origem: "manual",
        intimacao_id: null,
        advogado_id: campos.advogado_id,
        numero_processo: campos.numero_processo,
        partes_resumo: campos.partes_resumo.trim(),
        tipo_peca: campos.tipo_peca.trim(),
        data_fatal: campos.data_fatal || null,
        etapa_kanban: "fila",
        link_minuta: null,
        notas_internas: campos.notas_internas.trim() || null,
        recibo_protocolo_url: null,
        concluido_em: null,
        tribunal_sigla: campos.tribunal.trim() || null,
        data_ciencia: campos.data_ciencia || null,
        dias_prazo: Number(campos.dias) || null,
        tipo_contagem_prazo: campos.tipo_contagem,
      });
      toast.success("Prazo manual cadastrado na fila da esteira.");
      limparRascunho();
      setHidratado(false);
      onClose();
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível cadastrar o prazo manual.");
    }
  }

  const resumoErros = Object.values(erros).filter(Boolean);

  return (
    <Modal
      open={open}
      onClose={fechar}
      largura="max-w-2xl"
      titulo="Cadastro de prazo manual"
      descricao="Prazos de audiências, mandados, citações físicas ou notificações extrajudiciais que não tramitam pelo DJEN."
      footer={
        <>
          <Button variant="secondary" onClick={fechar} disabled={criar.isPending}>Cancelar</Button>
          <Button variant="primary" loading={criar.isPending} onClick={cadastrar}>Cadastrar prazo e inserir na fila</Button>
        </>
      }
    >
      <div className="space-y-4">
        {resumoErros.length > 0 ? (
          <Alert severidade="danger" titulo="Revise os campos obrigatórios">
            <ul className="list-inside list-disc">{resumoErros.map((erro, indice) => <li key={`${erro}-${indice}`}>{erro}</li>)}</ul>
          </Alert>
        ) : null}
        {advogadosQuery.isError ? <Alert severidade="danger" titulo="Não foi possível carregar os advogados." /> : null}
        {!advogadosQuery.isLoading && !advogadosQuery.isError && (advogadosQuery.data?.length ?? 0) === 0 ? (
          <Alert severidade="warning" titulo="Nenhum advogado cadastrado para atribuição." />
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Número do processo (CNJ)" htmlFor="prazo-cnj" required error={erros.numero_processo}>
            <Input id="prazo-cnj" value={campos.numero_processo} onChange={(evento) => alterar("numero_processo", mascararCnj(evento.target.value))} placeholder="0000000-00.0000.0.00.0000" aria-invalid={Boolean(erros.numero_processo) || undefined} />
          </FormField>
          <FormField label="Tribunal / comarca" htmlFor="prazo-tribunal">
            <Input id="prazo-tribunal" value={campos.tribunal} onChange={(evento) => alterar("tribunal", evento.target.value)} />
          </FormField>
          <FormField label="Nome das partes (autor e réu)" htmlFor="prazo-partes" required error={erros.partes_resumo} className="sm:col-span-2">
            <Input id="prazo-partes" value={campos.partes_resumo} onChange={(evento) => alterar("partes_resumo", evento.target.value)} aria-invalid={Boolean(erros.partes_resumo) || undefined} />
          </FormField>
          <FormField label="Ação / tipo de peça" htmlFor="prazo-peca" required error={erros.tipo_peca}>
            <Input id="prazo-peca" value={campos.tipo_peca} onChange={(evento) => alterar("tipo_peca", evento.target.value)} placeholder="Ex.: Recurso inominado" aria-invalid={Boolean(erros.tipo_peca) || undefined} />
          </FormField>
          <FormField label="Data de ciência" htmlFor="prazo-ciencia" required error={erros.data_ciencia}>
            <Input id="prazo-ciencia" type="date" value={campos.data_ciencia} onChange={(evento) => alterar("data_ciencia", evento.target.value)} aria-invalid={Boolean(erros.data_ciencia) || undefined} />
          </FormField>
          <FormField label="Prazo em dias" htmlFor="prazo-dias" required error={erros.dias}>
            <Input id="prazo-dias" type="number" min={1} value={campos.dias} onChange={(evento) => alterar("dias", evento.target.value)} aria-invalid={Boolean(erros.dias) || undefined} />
          </FormField>
          <FormField label="Tipo de contagem" htmlFor="prazo-contagem">
            <SegmentedControl
              valor={campos.tipo_contagem}
              onChange={(valor) => alterar("tipo_contagem", valor)}
              ariaLabel="Tipo de contagem de prazo"
              opcoes={[{ valor: "uteis", rotulo: "Dias úteis" }, { valor: "corridos", rotulo: "Dias corridos" }]}
            />
          </FormField>
          <FormField label="Data fatal calculada" htmlFor="prazo-fatal" required error={erros.data_fatal}>
            <div className="flex items-center gap-2">
              <Input id="prazo-fatal" type="date" value={campos.data_fatal} onChange={(evento) => { setDataFatalManual(true); alterar("data_fatal", evento.target.value); }} aria-invalid={Boolean(erros.data_fatal) || undefined} />
              {dataFatalManual ? <Button type="button" variant="ghost" size="sm" onClick={recalcularDataFatal}>Recalcular</Button> : null}
            </div>
          </FormField>
          <FormField label="Atribuir ao advogado" htmlFor="prazo-advogado" required error={erros.advogado_id} className="sm:col-span-2">
            {advogadosQuery.isLoading ? <Skeleton className="h-10" /> : (
              <Select id="prazo-advogado" value={campos.advogado_id} onChange={(evento) => alterar("advogado_id", evento.target.value)} aria-invalid={Boolean(erros.advogado_id) || undefined}>
                <option value="">Selecione um advogado</option>
                {(advogadosQuery.data ?? []).map((advogado) => <option key={advogado.id} value={advogado.id}>{advogado.nome_completo}</option>)}
              </Select>
            )}
          </FormField>
          <FormField label="Orientações / observações" htmlFor="prazo-notas" className="sm:col-span-2">
            <Textarea id="prazo-notas" value={campos.notas_internas} onChange={(evento) => alterar("notas_internas", evento.target.value)} />
          </FormField>
        </div>
      </div>
    </Modal>
  );
}

export default PrazoManualModal;
