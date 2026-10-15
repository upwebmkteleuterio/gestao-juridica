import { supabase } from "@/integrations/supabase/client";
import { mensagemDeErro } from "./erros";

interface OpcoesRepositorio<T> {
  tabela: string;
  colunas: string;
  ordenarPor?: string;
  montar?: (linha: T) => T;
}

export function criarRepositorioSupabase<T extends { id: string }, TInput>(
  opcoes: OpcoesRepositorio<T>,
) {
  const converter = (linha: unknown): T => {
    const registro = linha as unknown as T;
    return opcoes.montar ? opcoes.montar(registro) : registro;
  };

  return {
    async getAll(): Promise<T[]> {
      let consulta = supabase.from(opcoes.tabela).select(opcoes.colunas);
      if (opcoes.ordenarPor) {
        consulta = consulta.order(opcoes.ordenarPor, { ascending: true });
      }
      const { data, error } = await consulta;
      if (error) throw new Error(mensagemDeErro(error));
      return (data ?? []).map(converter);
    },

    async getById(id: string): Promise<T | null> {
      const { data, error } = await supabase
        .from(opcoes.tabela)
        .select(opcoes.colunas)
        .eq("id", id)
        .maybeSingle();
      if (error) throw new Error(mensagemDeErro(error));
      return data ? converter(data) : null;
    },

    async create(input: TInput): Promise<T> {
      const { data, error } = await supabase
        .from(opcoes.tabela)
        .insert(input as never)
        .select(opcoes.colunas)
        .single();
      if (error) throw new Error(mensagemDeErro(error));
      return converter(data);
    },

    async update(id: string, input: Partial<TInput>): Promise<T> {
      const { data, error } = await supabase
        .from(opcoes.tabela)
        .update(input as never)
        .eq("id", id)
        .select(opcoes.colunas)
        .single();
      if (error) throw new Error(mensagemDeErro(error));
      return converter(data);
    },
  };
}
