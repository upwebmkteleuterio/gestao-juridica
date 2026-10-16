import { supabase } from "@/integrations/supabase/client";
import type { ConfiguracaoSistema, ConfiguracaoSistemaInput } from "@/types";
import { mensagemDeErro } from "./erros";

const COLUNAS = "id, oabs_monitoradas, horario_cron_djen, prazo_padrao_dias_uteis, ia_modelo, ia_system_prompt, updated_at";

function normalizar(linha: ConfiguracaoSistema): ConfiguracaoSistema {
  return {
    ...linha,
    oabs_monitoradas: linha.oabs_monitoradas ?? [],
    horario_cron_djen: linha.horario_cron_djen ?? "",
    prazo_padrao_dias_uteis: linha.prazo_padrao_dias_uteis ?? null,
    ia_modelo: linha.ia_modelo ?? "",
    ia_system_prompt: linha.ia_system_prompt ?? "",
    updated_at: linha.updated_at ?? "",
  };
}

async function obterLinha(): Promise<ConfiguracaoSistema | null> {
  const { data, error } = await supabase.from("configuracoes_sistema").select(COLUNAS).eq("id", 1).maybeSingle();
  if (error) throw new Error(mensagemDeErro(error));
  return data ? normalizar(data as unknown as ConfiguracaoSistema) : null;
}

export const configuracoesService = {
  async getAll(): Promise<ConfiguracaoSistema[]> {
    return [await configuracoesService.get()];
  },

  async get(): Promise<ConfiguracaoSistema> {
    const existente = await obterLinha();
    if (existente) return existente;
    const { data, error } = await supabase.from("configuracoes_sistema").upsert({ id: 1 }).select(COLUNAS).single();
    if (error) throw new Error(mensagemDeErro(error));
    return normalizar(data as unknown as ConfiguracaoSistema);
  },

  async getById(id: string): Promise<ConfiguracaoSistema | null> {
    return id === "1" ? obterLinha() : null;
  },

  async update(_id: string, input: Partial<ConfiguracaoSistemaInput>): Promise<ConfiguracaoSistema> {
    const { data, error } = await supabase.from("configuracoes_sistema").update(input).eq("id", 1).select(COLUNAS).single();
    if (error) throw new Error(mensagemDeErro(error));
    return normalizar(data as unknown as ConfiguracaoSistema);
  },
};
