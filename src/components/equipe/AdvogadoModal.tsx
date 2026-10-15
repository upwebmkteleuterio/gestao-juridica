import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
  Alert,
  Button,
  FormField,
  Input,
  Modal,
  Select,
  Skeleton,
  Switch,
} from "@/components/kit";
import {
  useAdvogado,
  useAtualizarAdvogado,
  useCriarAdvogado,
  useVerificarOabEmUso,
} from "@/hooks";
import { UFS } from "@/lib/ufs";
import type { AdvogadoInput } from "@/types";

export interface AdvogadoModalProps {
  open: boolean;
  advogadoId: string | null;
  onClose: () => void;
}

interface ErrosFormulario {
  nome_completo?: string;
  email_corporativo?: string;
  oab_numero?: string;
  oab_uf?: string;
}

const FORMULARIO_INICIAL: AdvogadoInput = {
  nome_completo: "",
  email_corporativo: "",
  oab_numero: "",
  oab_uf: "",
  perfil: "advogado",
  ativo_distribuicao: true,
};

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AdvogadoModal({ open, advogadoId, onClose }: AdvogadoModalProps) {
  const advogadoQuery = useAdvogado(advogadoId ?? undefined);
  const criar = useCriarAdvogado();
  const atualizar = useAtualizarAdvogado();
  const verificarOab = useVerificarOabEmUso();
  const [formulario, setFormulario] = useState<AdvogadoInput>(FORMULARIO_INICIAL);
  const [erros, setErros] = useState<ErrosFormulario>({});
  const [tentouSalvar, setTentouSalvar] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFormulario(FORMULARIO_INICIAL);
    setErros({});
    setTentouSalvar(false);
  }, [open, advogadoId]);

  useEffect(() => {
    const advogado = advogadoQuery.data;
    if (!open || !advogadoId || !advogado) return;
    setFormulario({
      nome_completo: advogado.nome_completo,
      email_corporativo: advogado.email_corporativo,
      oab_numero: advogado.oab_numero,
      oab_uf: advogado.oab_uf,
      perfil: advogado.perfil,
      ativo_distribuicao: advogado.ativo_distribuicao,
      ...(advogado.cargo ? { cargo: advogado.cargo } : {}),
      ...(advogado.data_ingresso ? { data_ingresso: advogado.data_ingresso } : {}),
    });
    setErros({});
    setTentouSalvar(false);
  }, [open, advogadoId, advogadoQuery.data]);

  const carregando = criar.isPending || atualizar.isPending || verificarOab.isPending;
  const problemas = Object.values(erros).filter(Boolean);
  const falhaAoCarregar = Boolean(
    advogadoId &&
      !advogadoQuery.isLoading &&
      (advogadoQuery.isError || !advogadoQuery.data),
  );

  function validar(dados: AdvogadoInput): ErrosFormulario {
    const novosErros: ErrosFormulario = {};
    if (!dados.nome_completo.trim()) {
      novosErros.nome_completo = "Informe o nome completo.";
    }
    if (!dados.email_corporativo.trim()) {
      novosErros.email_corporativo = "Informe o e-mail corporativo.";
    } else if (!EMAIL_VALIDO.test(dados.email_corporativo.trim())) {
      novosErros.email_corporativo = "Informe um e-mail válido.";
    }
    if (!dados.oab_numero) {
      novosErros.oab_numero = "Informe o número da OAB.";
    }
    if (!dados.oab_uf) {
      novosErros.oab_uf = "Selecione a UF da OAB.";
    }
    return novosErros;
  }

  function atualizarCampo<K extends keyof AdvogadoInput>(
    campo: K,
    valor: AdvogadoInput[K],
  ) {
    const proximoFormulario = { ...formulario, [campo]: valor };
    setFormulario(proximoFormulario);
    if (tentouSalvar) setErros(validar(proximoFormulario));
  }

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setTentouSalvar(true);
    const novosErros = validar(formulario);
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) return;

    const dados: AdvogadoInput = {
      nome_completo: formulario.nome_completo.trim(),
      email_corporativo: formulario.email_corporativo.trim(),
      oab_numero: formulario.oab_numero,
      oab_uf: formulario.oab_uf,
      perfil: formulario.perfil,
      ativo_distribuicao: formulario.ativo_distribuicao,
    };

    try {
      const emUso = await verificarOab.mutateAsync({
        oab_numero: dados.oab_numero,
        oab_uf: dados.oab_uf,
        ignorarId: advogadoId ?? undefined,
      });
      if (emUso) {
        setErros((atuais) => ({
          ...atuais,
          oab_numero: "Já existe um advogado com esta inscrição na OAB/UF.",
        }));
        return;
      }

      if (advogadoId) {
        await atualizar.mutateAsync({ id: advogadoId, input: dados });
        toast.success("Dados do advogado atualizados.");
      } else {
        await criar.mutateAsync(dados);
        toast.success("Advogado cadastrado na equipe.");
      }
      onClose();
    } catch (erro) {
      toast.error(
        erro instanceof Error
          ? erro.message
          : "Não foi possível salvar os dados do advogado.",
      );
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      largura="max-w-xl"
      titulo={advogadoId ? "Editar dados do advogado" : "Cadastrar novo advogado"}
      descricao="Registro do profissional, perfil de acesso e participação na distribuição automática de intimações."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={carregando}>
            Cancelar
          </Button>
          <Button
            form="advogado-form"
            type="submit"
            variant="primary"
            loading={carregando}
            disabled={falhaAoCarregar || advogadoQuery.isLoading}
          >
            Salvar dados do advogado
          </Button>
        </>
      }
    >
      {advogadoId && advogadoQuery.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
          <Skeleton className="h-10" />
          <Skeleton className="h-14" />
        </div>
      ) : falhaAoCarregar ? (
        <Alert severidade="danger" titulo="Não foi possível carregar os dados do advogado." />
      ) : (
        <form id="advogado-form" className="space-y-4" onSubmit={salvar}>
          {problemas.length > 0 ? (
            <Alert severidade="danger" titulo="Revise os dados informados">
              <ul className="list-disc space-y-0.5 pl-4">
                {problemas.map((problema, indice) => (
                  <li key={`${indice}-${problema}`}>{problema}</li>
                ))}
              </ul>
            </Alert>
          ) : null}

          <FormField
            label="Nome completo"
            htmlFor="advogado-nome"
            required
            error={erros.nome_completo}
          >
            <Input
              id="advogado-nome"
              value={formulario.nome_completo}
              aria-invalid={Boolean(erros.nome_completo) || undefined}
              onChange={(evento) => atualizarCampo("nome_completo", evento.target.value)}
            />
          </FormField>

          <FormField
            label="E-mail corporativo"
            htmlFor="advogado-email"
            required
            error={erros.email_corporativo}
          >
            <Input
              id="advogado-email"
              type="email"
              value={formulario.email_corporativo}
              aria-invalid={Boolean(erros.email_corporativo) || undefined}
              onChange={(evento) => atualizarCampo("email_corporativo", evento.target.value)}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Número da OAB"
              htmlFor="advogado-oab-numero"
              required
              error={erros.oab_numero}
            >
              <Input
                id="advogado-oab-numero"
                inputMode="numeric"
                value={formulario.oab_numero}
                aria-invalid={Boolean(erros.oab_numero) || undefined}
                onChange={(evento) =>
                  atualizarCampo("oab_numero", evento.target.value.replace(/\D/g, ""))
                }
              />
            </FormField>
            <FormField
              label="UF da OAB"
              htmlFor="advogado-oab-uf"
              required
              error={erros.oab_uf}
            >
              <Select
                id="advogado-oab-uf"
                value={formulario.oab_uf}
                aria-invalid={Boolean(erros.oab_uf) || undefined}
                onChange={(evento) => atualizarCampo("oab_uf", evento.target.value)}
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

          <FormField label="Função / perfil do sistema" htmlFor="advogado-perfil" required>
            <Select
              id="advogado-perfil"
              value={formulario.perfil}
              onChange={(evento) =>
                atualizarCampo("perfil", evento.target.value as AdvogadoInput["perfil"])
              }
            >
              <option value="advogado">Advogado</option>
              <option value="admin">Admin (sócio/gestor)</option>
            </Select>
          </FormField>

          <label
            htmlFor="advogado-disponivel"
            className="flex cursor-pointer items-center justify-between gap-4 rounded-sm border border-border px-3 py-3"
          >
            <span>
              <strong className="block text-[11px] font-semibold">
                Disponível para receber intimações automáticas
              </strong>
              <span className="mt-0.5 block text-[10px] text-muted-foreground">
                Advogados pausados não entram no round-robin da distribuição em lote.
              </span>
            </span>
            <Switch
              id="advogado-disponivel"
              checked={formulario.ativo_distribuicao}
              onChange={(evento) =>
                atualizarCampo("ativo_distribuicao", evento.target.checked)
              }
            />
          </label>
        </form>
      )}
    </Modal>
  );
}
