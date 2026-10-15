import { useEffect, useRef, useState, type FormEvent } from "react";
import { Zap } from "lucide-react";
import { toast } from "sonner";
import { Alert, Button, DateRange, FormField, Input, Modal, Select } from "@/components/kit";
import { useConfiguracoes, useDispararConsultaDjen, useRegistrarEvento, useTribunaisDjen, useUsuarioAtual } from "@/hooks";
import { UFS } from "@/lib/ufs";
import type { ResultadoCapturaDjen } from "@/types";

export interface CapturaModalProps {
  open: boolean;
  onClose: () => void;
}

interface ErrosFormulario {
  oabNumero?: string;
  oabUf?: string;
  dataDe?: string;
  dataAte?: string;
  filtros?: string;
}

const mensagemFiltro = "Informe tribunal, processo, parte, advogado, OAB ou texto, ou limite a página a 5 itens.";

function dataValida(valor: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(valor) && !Number.isNaN(Date.parse(`${valor}T00:00:00Z`)) && new Date(`${valor}T00:00:00Z`).toISOString().slice(0, 10) === valor;
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
  const [numeroProcesso, setNumeroProcesso] = useState("");
  const [nomeParte, setNomeParte] = useState("");
  const [nomeAdvogado, setNomeAdvogado] = useState("");
  const [texto, setTexto] = useState("");
  const [meio, setMeio] = useState("");
  const [itensPorPagina, setItensPorPagina] = useState<"5" | "100">("100");
  const [erros, setErros] = useState<ErrosFormulario>({});
  const [tentouEnviar, setTentouEnviar] = useState(false);
  const [resultadoParcial, setResultadoParcial] = useState<ResultadoCapturaDjen | null>(null);

  useEffect(() => {
    if (!open) {
      preencheuOab.current = false;
      setResultadoParcial(null);
      return;
    }
    if (!configuracoes.isSuccess || preencheuOab.current) return;
    const [numero = "", uf = ""] = (configuracoes.data.oabs_monitoradas[0] ?? "").split("/");
    setOabNumero(numero.replace(/\D/g, ""));
    setOabUf(uf.toUpperCase());
    preencheuOab.current = true;
  }, [open, configuracoes.data, configuracoes.isSuccess]);

  function validar(): ErrosFormulario {
    const novos: ErrosFormulario = {};
    if (!oabNumero.trim()) novos.oabNumero = "Informe o número da OAB.";
    if (!/^[A-Za-z]{2}$/.test(oabUf)) novos.oabUf = "Selecione uma UF válida.";
    if (Boolean(dataDe) !== Boolean(dataAte)) {
      if (!dataDe) novos.dataDe = "Informe a data inicial ou remova a data final.";
      if (!dataAte) novos.dataAte = "Informe a data final ou remova a data inicial.";
    }
    if (dataDe && !dataValida(dataDe)) novos.dataDe = "Informe uma data inicial válida.";
    if (dataAte && !dataValida(dataAte)) novos.dataAte = "Informe uma data final válida.";
    if (dataDe && dataAte && dataValida(dataDe) && dataValida(dataAte) && dataDe > dataAte) {
      novos.dataDe = "A data inicial deve ser anterior ou igual à final.";
      novos.dataAte = "A data final deve ser posterior ou igual à inicial.";
    }
    const temFiltroForte = Boolean(oabNumero.trim() || tribunal.trim() || numeroProcesso.trim() || nomeParte.trim() || nomeAdvogado.trim() || texto.trim());
    if (!temFiltroForte && itensPorPagina !== "5") novos.filtros = mensagemFiltro;
    return novos;
  }

  async function executarCaptura(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setTentouEnviar(true);
    const novosErros = validar();
    setErros(novosErros);
    if (Object.keys(novosErros).length) return;
    try {
      const resultado = await disparar.mutateAsync({
        oab_numero: oabNumero.trim(),
        oab_uf: oabUf.toUpperCase(),
        disponibilizacaoDe: dataDe || undefined,
        disponibilizacaoAte: dataAte || undefined,
        tribunal: tribunal || undefined,
        numeroProcesso: numeroProcesso || undefined,
        nomeParte: nomeParte || undefined,
        nomeAdvogado: nomeAdvogado || undefined,
        texto: texto || undefined,
        meio: meio ? meio as "D" | "E" : undefined,
        itensPorPagina: Number(itensPorPagina) as 5 | 100,
      });
      registrarEvento.mutate({
        ator_id: usuario?.id ?? null,
        entidade: "captura_djen",
        entidade_id: `${oabNumero}/${oabUf}`,
        acao: "captura_executada",
        antes: null,
        depois: `${resultado.recebidas} recebidas · ${resultado.novas} novas · ${resultado.duplicadas} duplicadas`,
      });
      toast.success(`${resultado.recebidas} recebidas · ${resultado.novas} novas · ${resultado.duplicadas} duplicadas`);
      if (resultado.parcial) setResultadoParcial(resultado);
      else onClose();
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível executar a captura.");
    }
  }

  function atualizarCampo(atualizar: (valor: string) => void, valor: string) {
    atualizar(valor);
    if (tentouEnviar) setErros(validar());
  }

  return (
    <Modal open={open} onClose={onClose} largura="max-w-2xl" titulo="Disparo manual de consulta DJEN"
      descricao="Consulta publicações reais na API pública do CNJ."
      footer={<>
        <Button variant="secondary" onClick={onClose} disabled={disparar.isPending}>Cancelar</Button>
        <Button form="djen-captura-form" type="submit" variant="primary" loading={disparar.isPending}>
          <Zap className="h-3.5 w-3.5" aria-hidden="true" /> Executar captura agora
        </Button>
      </>}>
      <form id="djen-captura-form" className="space-y-4" onSubmit={executarCaptura}>
        {resultadoParcial ? <Alert severidade="warning" titulo="Resultado parcial">{resultadoParcial.mensagem || "A consulta foi interrompida antes de esgotar todos os resultados disponíveis."}</Alert> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Número da OAB" htmlFor="captura-oab-numero" required error={erros.oabNumero}>
            <Input id="captura-oab-numero" inputMode="numeric" value={oabNumero} aria-invalid={Boolean(erros.oabNumero) || undefined}
              onChange={(evento) => atualizarCampo(setOabNumero, evento.target.value.replace(/\D/g, ""))} />
          </FormField>
          <FormField label="UF da OAB" htmlFor="captura-oab-uf" required error={erros.oabUf}>
            <Select id="captura-oab-uf" value={oabUf} aria-invalid={Boolean(erros.oabUf) || undefined}
              onChange={(evento) => atualizarCampo(setOabUf, evento.target.value)}>
              <option value="">Selecione a UF</option>
              {UFS.map((uf) => <option key={uf.sigla} value={uf.sigla}>{uf.sigla} — {uf.nome}</option>)}
            </Select>
          </FormField>
        </div>
        <div>
          <DateRange de={dataDe} ate={dataAte} onDeChange={(valor) => atualizarCampo(setDataDe, valor)} onAteChange={(valor) => atualizarCampo(setDataAte, valor)}
            idDe="captura-data-de" idAte="captura-data-ate" rotuloDe="Disponibilização a partir de" rotuloAte="Disponibilização até" />
          {erros.dataDe ? <p className="mt-1 text-[10px] font-medium text-danger">{erros.dataDe}</p> : null}
          {erros.dataAte ? <p className="mt-1 text-[10px] font-medium text-danger">{erros.dataAte}</p> : null}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Tribunal" htmlFor="captura-tribunal">
            <Select id="captura-tribunal" value={tribunal} onChange={(evento) => atualizarCampo(setTribunal, evento.target.value)}>
              <option value="">Todos os tribunais</option>
              {(tribunais.data ?? []).map((sigla) => <option key={sigla} value={sigla}>{sigla}</option>)}
            </Select>
          </FormField>
          <FormField label="Número do processo" htmlFor="captura-processo">
            <Input id="captura-processo" value={numeroProcesso} onChange={(evento) => atualizarCampo(setNumeroProcesso, evento.target.value)} />
          </FormField>
          <FormField label="Nome da parte" htmlFor="captura-parte">
            <Input id="captura-parte" value={nomeParte} onChange={(evento) => atualizarCampo(setNomeParte, evento.target.value)} />
          </FormField>
          <FormField label="Nome do advogado" htmlFor="captura-advogado">
            <Input id="captura-advogado" value={nomeAdvogado} onChange={(evento) => atualizarCampo(setNomeAdvogado, evento.target.value)} />
          </FormField>
        </div>
        <FormField label="Texto" htmlFor="captura-texto">
          <Input id="captura-texto" value={texto} onChange={(evento) => atualizarCampo(setTexto, evento.target.value)} />
        </FormField>
        {erros.filtros ? <p className="text-[10px] font-medium text-danger">{erros.filtros}</p> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Meio" htmlFor="captura-meio">
            <Select id="captura-meio" value={meio} onChange={(evento) => atualizarCampo(setMeio, evento.target.value)}>
              <option value="">Todos</option><option value="D">Diário</option><option value="E">Editais</option>
            </Select>
          </FormField>
          <FormField label="Itens por página" htmlFor="captura-itens-pagina" error={erros.filtros}>
            <Select id="captura-itens-pagina" value={itensPorPagina} onChange={(evento) => {
              setItensPorPagina(evento.target.value as "5" | "100");
              if (tentouEnviar) setErros(validar());
            }}>
              <option value="100">100 itens</option><option value="5">5 itens</option>
            </Select>
          </FormField>
        </div>
        {erros.filtros ? <Alert severidade="warning" titulo="Filtro mínimo exigido">{mensagemFiltro}</Alert> : null}
      </form>
    </Modal>
  );
}
