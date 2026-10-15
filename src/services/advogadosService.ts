import { advogadosMock } from "@/mocks";
import type { Advogado, AdvogadoInput } from "@/types";
import { CHAVES, agora, criarId, criarRepositorio } from "./storage";

const repositorio = criarRepositorio<Advogado, AdvogadoInput>({
  chave: CHAVES.advogados,
  seed: advogadosMock,
  construir: (input) => ({
    ...input,
    id: criarId("adv"),
    created_at: agora(),
  }),
});

/** Repositório da tabela `advogados`. */
export const advogadosService = {
  ...repositorio,

  /** Advogados habilitados a receber carga na distribuição automática. */
  async listarElegiveis(): Promise<Advogado[]> {
    const todos = await repositorio.getAll();
    return todos.filter((advogado) => advogado.ativo_distribuicao);
  },

  async alternarDisponibilidade(
    id: string,
    ativo_distribuicao: boolean,
  ): Promise<Advogado> {
    return repositorio.update(id, { ativo_distribuicao });
  },

  async buscarPorEmail(email: string): Promise<Advogado | null> {
    const todos = await repositorio.getAll();
    return (
      todos.find(
        (advogado) =>
          advogado.email_corporativo.toLowerCase() === email.toLowerCase(),
      ) ?? null
    );
  },

  /**
   * Checagem de duplicidade da inscrição (Tela 4.1). `ignorarId` permite
   * editar o próprio registro sem acusar conflito com ele mesmo.
   */
  async oabEmUso(
    oab_numero: string,
    oab_uf: string,
    ignorarId?: string,
  ): Promise<boolean> {
    const todos = await repositorio.getAll();
    const numero = oab_numero.replace(/\D/g, "");
    return todos.some(
      (advogado) =>
        advogado.id !== ignorarId &&
        advogado.oab_uf.toUpperCase() === oab_uf.toUpperCase() &&
        advogado.oab_numero.replace(/\D/g, "") === numero,
    );
  },
};
