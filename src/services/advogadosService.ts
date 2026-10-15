import { supabase } from "@/integrations/supabase/client";
import type { Advogado, AdvogadoInput } from "@/types";
import { mensagemDeErro } from "./erros";
import { criarRepositorioSupabase } from "./repositorioSupabase";

const COLUNAS = "id, nome_completo, email_corporativo, oab_numero, oab_uf, perfil, ativo_distribuicao, cargo, data_ingresso, created_at";
const repositorio = criarRepositorioSupabase<Advogado, AdvogadoInput>({
  tabela: "advogados",
  colunas: COLUNAS,
  montar: (linha) => ({
    ...linha,
    oab_numero: linha.oab_numero ?? "",
    oab_uf: linha.oab_uf ?? "",
  }),
});

export const advogadosService = {
  ...repositorio,

  async listarElegiveis(): Promise<Advogado[]> {
    const { data, error } = await supabase
      .from("advogados")
      .select(COLUNAS)
      .eq("ativo_distribuicao", true);
    if (error) throw new Error(mensagemDeErro(error));
    return ((data ?? []) as unknown as Advogado[]).map((linha) => ({
      ...linha,
      oab_numero: linha.oab_numero ?? "",
      oab_uf: linha.oab_uf ?? "",
    }));
  },

  async alternarDisponibilidade(id: string, ativo_distribuicao: boolean): Promise<Advogado> {
    return repositorio.update(id, { ativo_distribuicao });
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
    return { ...advogado, oab_numero: advogado.oab_numero ?? "", oab_uf: advogado.oab_uf ?? "" };
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

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("advogados").delete().eq("id", id);
    if (error) throw new Error(mensagemDeErro(error));
  },
};
