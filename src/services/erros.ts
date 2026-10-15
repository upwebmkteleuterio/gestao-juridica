import { supabase } from "@/integrations/supabase/client";

export class ErroFuncao extends Error {
  codigo?: string;

  constructor(mensagem: string, codigo?: string) {
    super(mensagem);
    this.name = "ErroFuncao";
    this.codigo = codigo;
  }
}

interface EnvelopeFuncao<T> {
  ok?: boolean;
  codigo?: string;
  mensagem?: string;
  dados?: T;
}

export async function invocarFuncao<T>(nome: string, corpo: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke<EnvelopeFuncao<T>>(nome, { body: corpo });
  if (error) {
    let mensagem = "Não foi possível concluir a operação. Tente novamente.";
    let codigo: string | undefined;
    const context = (error as { context?: unknown }).context;
    if (context && typeof context === "object" && "json" in context && typeof context.json === "function") {
      try {
        const resposta = await context.json() as { mensagem?: unknown; codigo?: unknown };
        if (typeof resposta.mensagem === "string") mensagem = resposta.mensagem;
        if (typeof resposta.codigo === "string") codigo = resposta.codigo;
      } catch {
        // Resposta sem JSON utilizável.
      }
    }
    throw new ErroFuncao(mensagem, codigo);
  }
  if (!data?.ok || data.dados === undefined) {
    throw new ErroFuncao(data?.mensagem ?? "Não foi possível concluir a operação. Tente novamente.", data?.codigo);
  }
  return data.dados;
}

export function mensagemDeErro(erro: unknown): string {
  const detalhe = erro as { code?: unknown; message?: unknown } | null;
  switch (detalhe?.code) {
    case "42501":
      return "Você não tem permissão para esta operação.";
    case "23505":
      return "Este registro já existe.";
    case "23503":
      return "Este registro está em uso e não pode ser excluído.";
    case "PGRST116":
      return "Registro não encontrado.";
    default:
      return "Não foi possível concluir a operação. Tente novamente.";
  }
}
