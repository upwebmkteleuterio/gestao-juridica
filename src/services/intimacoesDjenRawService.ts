import { intimacoesDjenRawMock } from "@/mocks";
import type { IntimacaoDjenRaw, IntimacaoDjenRawInput } from "@/types";
import { CHAVES, criarId, criarRepositorio } from "./storage";

const repositorio = criarRepositorio<IntimacaoDjenRaw, IntimacaoDjenRawInput>({
  chave: CHAVES.intimacoesDjenRaw,
  seed: intimacoesDjenRawMock,
  construir: (input) => ({ ...input, id: criarId("raw") }),
});

/** Repositório do log bruto de ingestão da API do DJEN. */
export const intimacoesDjenRawService = {
  ...repositorio,

  async buscarPorIdOriginal(
    djen_id_original: string,
  ): Promise<IntimacaoDjenRaw | null> {
    const todos = await repositorio.getAll();
    return (
      todos.find((item) => item.djen_id_original === djen_id_original) ?? null
    );
  },

  async contarPorStatus(): Promise<Record<string, number>> {
    const todos = await repositorio.getAll();
    return todos.reduce<Record<string, number>>((acc, item) => {
      acc[item.status_analise_ia] = (acc[item.status_analise_ia] ?? 0) + 1;
      return acc;
    }, {});
  },
};
