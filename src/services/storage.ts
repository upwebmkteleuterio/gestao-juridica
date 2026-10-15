import type { ID, ISODate } from "@/types";

/**
 * Camada de persistência local que simula um banco de dados.
 * Cada "tabela" é um array em memória hidratado a partir do localStorage e
 * alimentado inicialmente pela pasta /mocks. Todas as operações retornam
 * Promises com latência simulada de 500 ms.
 */

const PREFIXO = "mg-gestao-juridica:v1:";

/** Latência simulada de rede (ms). */
export const LATENCIA_MS = 500;

/** Chaves de armazenamento — 1 por entidade/tabela. */
export const CHAVES = {
  advogados: "advogados",
  intimacoesDjenRaw: "intimacoes_djen_raw",
  intimacoes: "intimacoes",
  tarefasPrazos: "tarefas_prazos",
  configuracoes: "configuracoes_sistema",
  eventosAuditoria: "eventos_auditoria",
} as const;

export function delay<T>(valor: T, ms: number = LATENCIA_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(valor), ms));
}

function clonar<T>(valor: T): T {
  return JSON.parse(JSON.stringify(valor)) as T;
}

export function agora(): ISODate {
  return new Date().toISOString();
}

export function criarId(prefixo = "id"): ID {
  const uuid =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefixo}-${uuid}`;
}

export function lerColecao<T>(chave: string, seed: T[]): T[] {
  if (typeof localStorage === "undefined") return clonar(seed);
  try {
    const bruto = localStorage.getItem(PREFIXO + chave);
    if (!bruto) return clonar(seed);
    return JSON.parse(bruto) as T[];
  } catch {
    return clonar(seed);
  }
}

export function gravarColecao<T>(chave: string, linhas: T[]): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(PREFIXO + chave, JSON.stringify(linhas));
  } catch {
    /* cota excedida — mantém apenas a memória */
  }
}

export function lerSingleton<T>(chave: string, seed: T): T {
  if (typeof localStorage === "undefined") return clonar(seed);
  try {
    const bruto = localStorage.getItem(PREFIXO + chave);
    if (!bruto) return clonar(seed);
    return JSON.parse(bruto) as T;
  } catch {
    return clonar(seed);
  }
}

export function gravarSingleton<T>(chave: string, valor: T): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(PREFIXO + chave, JSON.stringify(valor));
  } catch {
    /* cota excedida — mantém apenas a memória */
  }
}

/** Restaura os dados de demonstração (remove tudo que foi persistido). */
export function restaurarMocks(): void {
  if (typeof localStorage === "undefined") return;
  const chaves: string[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const chave = localStorage.key(i);
    if (chave && chave.startsWith(PREFIXO)) chaves.push(chave);
  }
  chaves.forEach((chave) => localStorage.removeItem(chave));
}

/** Contrato CRUD completo seguido por todos os serviços. */
export interface Repositorio<T, TInput> {
  getAll: () => Promise<T[]>;
  getById: (id: ID) => Promise<T | null>;
  create: (input: TInput) => Promise<T>;
  update: (id: ID, input: Partial<TInput>) => Promise<T>;
  remove: (id: ID) => Promise<void>;
}

interface ConfigRepositorio<T, TInput> {
  chave: string;
  seed: T[];
  /** Monta a entidade completa (id + timestamps) a partir do formulário. */
  construir: (input: TInput) => T;
  antesDeAtualizar?: (proximo: T, anterior: T) => T;
}

/** Fábrica de repositórios CRUD persistidos em localStorage. */
export function criarRepositorio<T extends { id: ID }, TInput>(
  config: ConfigRepositorio<T, TInput>,
): Repositorio<T, TInput> {
  const ler = () => lerColecao<T>(config.chave, config.seed);

  return {
    async getAll() {
      return delay(ler());
    },
    async getById(id) {
      return delay(ler().find((linha) => linha.id === id) ?? null);
    },
    async create(input) {
      const linhas = ler();
      const linha = config.construir(input);
      gravarColecao(config.chave, [...linhas, linha]);
      return delay(linha);
    },
    async update(id, input) {
      const linhas = ler();
      const indice = linhas.findIndex((linha) => linha.id === id);
      if (indice === -1) {
        throw new Error(`Registro ${id} não encontrado.`);
      }
      const anterior = linhas[indice];
      let proximo = { ...anterior, ...input } as T;
      if (config.antesDeAtualizar) {
        proximo = config.antesDeAtualizar(proximo, anterior);
      }
      linhas[indice] = proximo;
      gravarColecao(config.chave, linhas);
      return delay(proximo);
    },
    async remove(id) {
      gravarColecao(
        config.chave,
        ler().filter((linha) => linha.id !== id),
      );
      return delay(undefined);
    },
  };
}
