import { eventosAuditoriaMock } from "@/mocks";
import type { EventoAuditoria, EventoAuditoriaInput } from "@/types";
import { CHAVES, agora, criarId, criarRepositorio } from "./storage";

const repositorio = criarRepositorio<EventoAuditoria, EventoAuditoriaInput>({
  chave: CHAVES.eventosAuditoria,
  seed: eventosAuditoriaMock,
  construir: (input) => ({
    ...input,
    id: criarId("aud"),
    criado_em: agora(),
  }),
});

/** Repositório da trilha de auditoria. */
export const eventosAuditoriaService = {
  ...repositorio,

  async listarRecentes(limite = 10): Promise<EventoAuditoria[]> {
    const todos = await repositorio.getAll();
    return [...todos]
      .sort((a, b) => b.criado_em.localeCompare(a.criado_em))
      .slice(0, limite);
  },

  async listarPorEntidade(entidade_id: string): Promise<EventoAuditoria[]> {
    const todos = await repositorio.getAll();
    return todos
      .filter((evento) => evento.entidade_id === entidade_id)
      .sort((a, b) => b.criado_em.localeCompare(a.criado_em));
  },
};
