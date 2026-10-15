import { configuracoesSistemaMock } from "@/mocks";
import type { ConfiguracaoSistema, ConfiguracaoSistemaInput } from "@/types";
import {
  CHAVES,
  agora,
  delay,
  gravarSingleton,
  lerSingleton,
} from "./storage";

function lerAtual(): ConfiguracaoSistema {
  return lerSingleton<ConfiguracaoSistema>(
    CHAVES.configuracoes,
    configuracoesSistemaMock,
  );
}

/** Repositório da tabela singleton `configuracoes_sistema` (id = 1). */
export const configuracoesService = {
  async getAll(): Promise<ConfiguracaoSistema[]> {
    return delay([lerAtual()]);
  },

  async get(): Promise<ConfiguracaoSistema> {
    return delay(lerAtual());
  },

  async getById(id: string): Promise<ConfiguracaoSistema | null> {
    return delay(id === "1" ? lerAtual() : null);
  },

  async update(
    _id: string,
    input: Partial<ConfiguracaoSistemaInput>,
  ): Promise<ConfiguracaoSistema> {
    const proximo: ConfiguracaoSistema = {
      ...lerAtual(),
      ...input,
      id: 1,
      updated_at: agora(),
    };
    gravarSingleton(CHAVES.configuracoes, proximo);
    return delay(proximo);
  },

  async remove(): Promise<void> {
    gravarSingleton(CHAVES.configuracoes, configuracoesSistemaMock);
    return delay(undefined);
  },

  /** Restaura os parâmetros de demonstração. */
  async restaurar(): Promise<ConfiguracaoSistema> {
    gravarSingleton(CHAVES.configuracoes, configuracoesSistemaMock);
    return delay(configuracoesSistemaMock);
  },
};
