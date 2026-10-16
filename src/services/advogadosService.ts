import { supabase } from "@/integrations/supabase/client";
import type { Advogado } from "@/types";
import { mensagemDeErro } from "./erros";

const COLUNAS = "id, nome_completo, email_corporativo, oab_numero, oab_uf, perfil, ativo_distribuicao, cargo, data_ingresso, created_at";

function montar(linha: Advogado): Advogado {
  return {
    ...linha,
    oab_numero: linha.oab_numero ?? "",
    oab_uf: linha.oab_uf ?? "",
  };
}

export const advogadosService = {
  async getAll(): Promise<Advogado[]> {
    const { data, error } = await supabase.from("advogados").select(COLUNAS);
    if (error) throw new Error(mensagemDeErro(error));
    return ((data ?? []) as unknown as Advogado[]).map(montar);
  },

  async listarVisiveis(): Promise<Advogado[]> {
    const { data, error } = await supabase.from("advogados").select(COLUNAS).eq("oculto_da_equipe", false);
    if (error) throw new Error(mensagemDeErro(error));
    return ((data ?? []) as unknown as Advogado[]).map(montar);
  },

  async getById(id: string): Promise<Advogado | null> {
    const { data, error } = await supabase.from("advogados").select(COLUNAS).eq("id", id).maybeSingle();
    if (error) throw new Error(mensagemDeErro(error));
    return data ? montar(data as unknown as Advogado) : null;
  },

  async listarElegiveis(): Promise<Advogado[]> {
    const { data, error } = await supabase
      .from("advogados")
      .select(COLUNAS)
      .eq("ativo_distribuicao", true)
      .eq("oculto_da_equipe", false);
    if (error) throw new Error(mensagemDeErro(error));
    return ((data ?? []) as unknown as Advogado[]).map(montar);
  },

  async buscarPorEmail(email: string): Promise<Advogado | null> {
    const { data, error } = await supabase
      .from("advogados")
      .select(COLUNAS)
      .ilike("email_corporativo", email)
      .maybeSingle();
    if (error) throw new Error(mensagemDeErro(error));
    const advogado = data as unknown as Advogado | null;
    if (!advogado || advogado.email_corporativo.toLowerCase() !== email.toLowerCase()) return null;
    return montar(advogado);
  },

  async oabEmUso(oab_numero: string, oab_uf: string, ignorarId?: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("advogados")
      .select("id, oab_numero, oab_uf");
    if (error) throw new Error(mensagemDeErro(error));
    const numero = oab_numero.replace(/\D/g, "");
    return ((data ?? []) as unknown as Pick<Advogado, "id" | "oab_numero" | "oab_uf">[]).some(
      (advogado) => advogado.id !== ignorarId &&
        (advogado.oab_uf ?? "").toUpperCase() === oab_uf.toUpperCase() &&
        (advogado.oab_numero ?? "").replace(/\D/g, "") === numero,
    );
  },
};
