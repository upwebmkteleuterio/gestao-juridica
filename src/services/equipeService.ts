import { supabase } from "@/integrations/supabase/client";
import type {
  AcessoAdvogado,
  AtualizarMembroEquipeInput,
  CriarMembroEquipeInput,
  DefinirAcessoEquipeInput,
} from "@/types";

export class ErroEquipe extends Error {
  codigo?: string;

  constructor(mensagem: string, codigo?: string) {
    super(mensagem);
    this.name = "ErroEquipe";
    this.codigo = codigo;
  }
}

interface RespostaEquipe<T> {
  ok: boolean;
  codigo?: string;
  mensagem?: string;
  dados?: T;
}

async function invocar<T>(corpo: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke<RespostaEquipe<T>>("gerenciar-equipe", { body: corpo });
  if (error) {
    let mensagem = "Não foi possível concluir a operação. Tente novamente.";
    let codigo: string | undefined;
    const context = (error as { context?: Response }).context;
    if (context) {
      try {
        const resposta = await context.json() as { mensagem?: unknown; codigo?: unknown };
        if (typeof resposta.mensagem === "string") mensagem = resposta.mensagem;
        if (typeof resposta.codigo === "string") codigo = resposta.codigo;
      } catch {
        // A resposta pode não conter JSON.
      }
    }
    throw new ErroEquipe(mensagem, codigo);
  }
  if (!data?.ok || data.dados === undefined) {
    throw new ErroEquipe(data?.mensagem ?? "Não foi possível concluir a operação. Tente novamente.", data?.codigo);
  }
  return data.dados;
}

export const equipeService = {
  criarMembro(input: CriarMembroEquipeInput) {
    return invocar<{ id: string }>({ acao: "criar", ...input });
  },
  atualizarMembro(input: AtualizarMembroEquipeInput) {
    return invocar<{ id: string }>({ acao: "atualizar", ...input });
  },
  definirAcesso(input: DefinirAcessoEquipeInput) {
    return invocar<{ id: string; pode_entrar: boolean }>({ acao: "definir_acesso", ...input });
  },
  excluirMembro(id: string) {
    return invocar<{ id: string }>({ acao: "excluir", id });
  },
  listarAcesso() {
    return invocar<AcessoAdvogado[]>({ acao: "listar_acesso" });
  },
};

export { invocar };
