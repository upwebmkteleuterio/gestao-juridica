import { capturasDjenSimuladas, intimacoesDjenRawMock } from "@/mocks";
import { normalizarOab } from "@/lib/format";
import type {
  ConsultaAuditoriaDjen,
  IndicadoresIngestaoDjen,
  IntimacaoDjenRaw,
  IntimacaoDjenRawInput,
  LinhaAuditoriaDjen,
  ParametrosCapturaDjen,
  ResultadoAuditoriaDjen,
  ResultadoCapturaDjen,
  StatusCaptura,
} from "@/types";
import {
  CHAVES,
  agora,
  criarId,
  criarRepositorio,
  delay,
  gravarColecao,
  lerColecao,
} from "./storage";

const repositorio = criarRepositorio<IntimacaoDjenRaw, IntimacaoDjenRawInput>({
  chave: CHAVES.intimacoesDjenRaw,
  seed: intimacoesDjenRawMock,
  construir: (input) => ({ ...input, id: criarId("raw") }),
});

const TAMANHO_PAGINA_PADRAO = 8;
/** A API do CNJ limita pesquisas amplas a blocos de resultados (Tela 3.1). */
export const MAX_DIAS_CAPTURA = 5;
/** Header `x-ratelimit-limit` simulado da API pública do CNJ. */
const RATE_LIMIT_DIARIO = 1000;
/** Itens devolvidos por página de resposta da API do CNJ. */
const ITENS_POR_RESPOSTA = 20;

function lerRaw(): IntimacaoDjenRaw[] {
  return lerColecao<IntimacaoDjenRaw>(
    CHAVES.intimacoesDjenRaw,
    intimacoesDjenRawMock,
  );
}

function textoPayload(
  payload: Record<string, unknown> | undefined,
  chave: string,
): string {
  const valor = payload?.[chave];
  return typeof valor === "string" ? valor : "";
}

function dataDisponibilizacao(raw: IntimacaoDjenRaw): string {
  return textoPayload(raw.payload_json, "data_disponibilizacao");
}

/** OABs citadas no payload bruto, normalizadas para "numero/UF". */
function oabsCitadas(raw: IntimacaoDjenRaw): string[] {
  const lista = raw.payload_json?.advogados;
  if (!Array.isArray(lista)) return [];
  return lista
    .map((item) =>
      normalizarOab(String((item as { oab?: string } | null)?.oab ?? "")),
    )
    .filter(Boolean);
}

/** Achata o payload bruto nas 7 colunas do data grid da Tela 3. */
function paraLinha(raw: IntimacaoDjenRaw): LinhaAuditoriaDjen {
  return {
    id: raw.id,
    djen_id_original: raw.djen_id_original,
    tribunal_sigla: textoPayload(raw.payload_json, "siglaTribunal"),
    orgao_julgador: textoPayload(raw.payload_json, "nomeOrgao"),
    numero_processo: textoPayload(raw.payload_json, "numero_processo"),
    data_disponibilizacao: dataDisponibilizacao(raw),
    djen_hash: raw.djen_hash,
    status_analise_ia: raw.status_analise_ia,
  };
}

function diferencaEmDias(de: string, ate: string): number {
  const inicio = new Date(`${de.slice(0, 10)}T12:00:00Z`);
  const fim = new Date(`${ate.slice(0, 10)}T12:00:00Z`);
  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime())) return 0;
  return Math.round((fim.getTime() - inicio.getTime()) / 86_400_000);
}

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

  /**
   * Data grid de auditoria da Tela 3. O filtro por OAB monitorada e pelo
   * período da comunicação, a ordenação e a paginação acontecem aqui —
   * exatamente como a query SQL/Supabase receberá esses parâmetros.
   */
  async listar(
    consulta: ConsultaAuditoriaDjen = {},
  ): Promise<ResultadoAuditoriaDjen> {
    const linhas = lerRaw()
      .filter((raw) => {
        if (consulta.oab && !oabsCitadas(raw).includes(consulta.oab)) {
          return false;
        }
        const data = dataDisponibilizacao(raw);
        if (
          consulta.disponibilizacaoDe &&
          data < consulta.disponibilizacaoDe
        ) {
          return false;
        }
        if (
          consulta.disponibilizacaoAte &&
          data > consulta.disponibilizacaoAte
        ) {
          return false;
        }
        return true;
      })
      .map(paraLinha)
      .sort((a, b) => {
        if (a.data_disponibilizacao !== b.data_disponibilizacao) {
          return b.data_disponibilizacao.localeCompare(a.data_disponibilizacao);
        }
        return b.djen_id_original.localeCompare(a.djen_id_original);
      });

    const tamanhoPagina = Math.max(
      1,
      consulta.tamanhoPagina ?? TAMANHO_PAGINA_PADRAO,
    );
    const totalPaginas = Math.max(
      1,
      Math.ceil(linhas.length / tamanhoPagina),
    );
    const pagina = Math.min(Math.max(1, consulta.pagina ?? 1), totalPaginas);
    const inicio = (pagina - 1) * tamanhoPagina;

    return delay({
      dados: linhas.slice(inicio, inicio + tamanhoPagina),
      total: linhas.length,
      pagina,
      tamanhoPagina,
      totalPaginas,
    });
  },

  /** Tribunais presentes no log — seletor opcional da Tela 3.1. */
  async listarTribunais(): Promise<string[]> {
    const siglas = new Set(
      lerRaw()
        .map((raw) => textoPayload(raw.payload_json, "siglaTribunal"))
        .filter(Boolean),
    );
    return delay([...siglas].sort((a, b) => a.localeCompare(b)));
  },

  /** Indicadores do topo da Tela 3 (headers simulados da API do CNJ). */
  async obterIndicadores(): Promise<IndicadoresIngestaoDjen> {
    const todos = lerRaw();
    const falhas = todos.filter(
      (item) => item.status_analise_ia === "falha",
    ).length;
    const taxaSucesso =
      todos.length === 0
        ? 0
        : Math.round(((todos.length - falhas) / todos.length) * 100);

    const datas = todos
      .map(dataDisponibilizacao)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
    const dataReferencia = datas[datas.length - 1] ?? "";
    const mesReferencia = dataReferencia.slice(0, 7);
    const totalMes = todos.filter((item) =>
      dataDisponibilizacao(item).startsWith(mesReferencia),
    ).length;

    /* Headers simulados: cada resposta da API entrega ITENS_POR_RESPOSTA. */
    const respostasNaReferencia = Math.ceil(
      todos.filter((item) => dataDisponibilizacao(item) === dataReferencia)
        .length / ITENS_POR_RESPOSTA,
    );

    const ultimaCapturaEm =
      todos
        .map((item) => item.criado_em)
        .sort((a, b) => a.localeCompare(b))
        .pop() ?? null;

    const status: StatusCaptura =
      todos.length === 0
        ? "ocioso"
        : falhas === 0
          ? "concluido"
          : falhas === todos.length
            ? "falha"
            : "parcial";

    return delay({
      taxaSucesso,
      totalMes,
      mesReferencia,
      rateLimitLimite: RATE_LIMIT_DIARIO,
      rateLimitRestante: Math.max(
        0,
        RATE_LIMIT_DIARIO - respostasNaReferencia,
      ),
      ultimaCapturaEm,
      status,
    });
  },

  /**
   * Disparo manual da Tela 3.1: simula a chamada `GET /api/v1/comunicacao`
   * seguida do UPSERT por `djen_id_original`. O que já existe no log entra
   * como duplicado — nenhuma publicação é ingerida duas vezes.
   */
  async dispararConsulta(
    params: ParametrosCapturaDjen,
  ): Promise<ResultadoCapturaDjen> {
    if (!params.oab_numero.trim() || !params.oab_uf) {
      throw new Error("Informe o número e a UF da OAB a pesquisar.");
    }
    if (!params.disponibilizacaoDe || !params.disponibilizacaoAte) {
      throw new Error("Informe o período de disponibilização da captura.");
    }
    if (params.disponibilizacaoDe > params.disponibilizacaoAte) {
      throw new Error("A data inicial deve ser anterior à data final.");
    }
    if (
      diferencaEmDias(params.disponibilizacaoDe, params.disponibilizacaoAte) >
      MAX_DIAS_CAPTURA
    ) {
      throw new Error(
        `A API do CNJ aceita faixas de até ${MAX_DIAS_CAPTURA} dias. Segmente a requisição para não exceder a paginação.`,
      );
    }

    const oab = normalizarOab(`${params.oab_numero}/${params.oab_uf}`);
    const fonteOficial = [...intimacoesDjenRawMock, ...capturasDjenSimuladas];
    const recebidas = fonteOficial.filter((item) => {
      const data = dataDisponibilizacao(item);
      if (
        data < params.disponibilizacaoDe ||
        data > params.disponibilizacaoAte
      ) {
        return false;
      }
      if (
        params.tribunal &&
        textoPayload(item.payload_json, "siglaTribunal") !== params.tribunal
      ) {
        return false;
      }
      return oabsCitadas(item).includes(oab);
    });

    const existentes = new Set(lerRaw().map((item) => item.djen_id_original));
    const novas = recebidas.filter(
      (item) => !existentes.has(item.djen_id_original),
    );
    const carimbo = agora();

    if (novas.length > 0) {
      gravarColecao(CHAVES.intimacoesDjenRaw, [
        ...lerRaw(),
        ...novas.map((item) => ({ ...item, criado_em: carimbo })),
      ]);
    }

    const status: StatusCaptura =
      novas.length > 0 ? "concluido" : "sem_novidades";
    const mensagem =
      novas.length > 0
        ? `${novas.length} nova(s) publicação(ões) ingerida(s) na fila de análise da IA.`
        : recebidas.length > 0
          ? "Nenhuma publicação inédita: todas já constavam no log de ingestão."
          : "A fonte oficial não devolveu publicações para os parâmetros informados.";

    return delay({
      status,
      recebidas: recebidas.length,
      novas: novas.length,
      duplicadas: recebidas.length - novas.length,
      mensagem,
      executado_em: carimbo,
    });
  },
};
