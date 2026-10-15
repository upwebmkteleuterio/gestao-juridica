import { supabase } from "@/integrations/supabase/client";
import type { EventoAuditoria, EventoAuditoriaInput } from "@/types";
import { mensagemDeErro } from "./erros";
import { criarRepositorioSupabase } from "./repositorioSupabase";

const COLUNAS = "id, ator_id, entidade, entidade_id, acao, antes, depois, criado_em";
const repositorio = criarRepositorioSupabase<EventoAuditoria, EventoAuditoriaInput>({
  tabela: "eventos_auditoria",
  colunas: COLUNAS,
});

export const eventosAuditoriaService = {
  getAll: repositorio.getAll,
  getById: repositorio.getById,
  create: repositorio.create,

  async listarRecentes(limite = 10): Promise<EventoAuditoria[]> {
    const { data, error } = await supabase.from("eventos_auditoria").select(COLUNAS).order("criado_em", { ascending: false }).limit(limite);
    if (error) throw new Error(mensagemDeErro(error));
    return (data ?? []) as unknown as EventoAuditoria[];
  },

  async listarPorEntidade(entidade_id: string): Promise<EventoAuditoria[]> {
    const { data, error } = await supabase.from("eventos_auditoria").select(COLUNAS).eq("entidade_id", entidade_id).order("criado_em", { ascending: false });
    if (error) throw new Error(mensagemDeErro(error));
    return (data ?? []) as unknown as EventoAuditoria[];
  },
};
