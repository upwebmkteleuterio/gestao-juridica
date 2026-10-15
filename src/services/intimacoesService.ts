import { intimacoesDjenRawMock, intimacoesMock, tarefasPrazosMock } from "@/mocks";
import { diasAte } from "@/lib/format";
import type {
  CampoOrdenacaoIntimacao,
  ConsultaIntimacoes,
  CriterioDistribuicao,
  ID,
  IndicadoresIntimacoes,
  Intimacao,
  IntimacaoDjenRaw,
  IntimacaoInput,
  OrdenacaoConsulta,
  PreviaDistribuicao,
  ResultadoConsultaIntimacoes,
  ResultadoDistribuicao,
  TarefaPrazo,
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
import { montarTarefa } from "./tarefasPrazosService";

const ORDENACAO_PADRAO: OrdenacaoConsulta<CampoOrdenacaoIntimacao> = {
  campo: "data_disponibilizacao",
  direcao: "desc",
};

const TAMANHO_PAGINA_PADRAO = 8;
const DIAS_SEMANA = 7;

const repositorio = criarRepositorio<Intimacao, IntimacaoInput>({
  chave: CHAVES.intimacoes,
  seed: intimacoesMock,
  construir: (input) => ({ ...input, id: criarId("int") }),
});

/* ------------------------------------------------------------------ */
/* Consulta (filtros + busca + ordenação + paginação)                  */
/* ------------------------------------------------------------------ */

function lerIntimacoes(): Intimacao[] {
  return lerColecao<Intimacao>(CHAVES.intimacoes, intimacoesMock);
}

function lerTarefas(): TarefaPrazo[] {
  return lerColecao<TarefaPrazo>(CHAVES.tarefasPrazos, tarefasPrazosMock);
}

/**
 * Aplica os filtros do recorte. Roda no serviço para que a futura query
 * SQL/Supabase receba exatamente os mesmos parâmetros.
 */
function aplicarFiltros(
  lista: Intimacao[],
  consulta: ConsultaIntimacoes,
): Intimacao[] {
  const termo = consulta.busca?.trim().toLowerCase();

  return lista.filter((item) => {
    if (termo) {
      const alvo = [
        item.numero_processo,
        item.tribunal_sigla,
        item.orgao_julgador,
        item.acao_sugerida_ia,
        item.resumo_ia,
      ]
        .join(" ")
        .toLowerCase();
      if (!alvo.includes(termo)) return false;
    }
    if (consulta.tribunal && item.tribunal_sigla !== consulta.tribunal) {
      return false;
    }
    if (
      consulta.disponibilizacaoDe &&
      item.data_disponibilizacao < consulta.disponibilizacaoDe
    ) {
      return false;
    }
    if (
      consulta.disponibilizacaoAte &&
      item.data_disponibilizacao > consulta.disponibilizacaoAte
    ) {
      return false;
    }
    if (
      consulta.status &&
      consulta.status !== "todos" &&
      item.status_fluxo !== consulta.status
    ) {
      return false;
    }
    if (consulta.advogadoId && item.advogado_id !== consulta.advogadoId) {
      return false;
    }
    return true;
  });
}

function ordenar(
  lista: Intimacao[],
  ordenacao: OrdenacaoConsulta<CampoOrdenacaoIntimacao>,
): Intimacao[] {
  const fator = ordenacao.direcao === "asc" ? 1 : -1;
  return [...lista].sort((a, b) => {
    const valorA = String(a[ordenacao.campo] ?? "");
    const valorB = String(b[ordenacao.campo] ?? "");
    if (valorA === valorB) {
      return a.numero_processo.localeCompare(b.numero_processo);
    }
    return valorA > valorB ? fator : -fator;
  });
}

/** Carga ativa (etapas não concluídas) por advogado. */
function cargaAtiva(tarefas: TarefaPrazo[]): Record<ID, number> {
  return tarefas
    .filter((tarefa) => tarefa.etapa_kanban !== "concluido")
    .reduce<Record<ID, number>>((acc, tarefa) => {
      acc[tarefa.advogado_id] = (acc[tarefa.advogado_id] ?? 0) + 1;
      return acc;
    }, {});
}

function ordenarParticipantes(
  advogadoIds: ID[],
  criterio: CriterioDistribuicao,
  carga: Record<ID, number>,
): ID[] {
  const copia = [...advogadoIds];
  if (criterio === "compensacao") {
    copia.sort((a, b) => (carga[a] ?? 0) - (carga[b] ?? 0));
  }
  return copia;
}

/** Distribui `quantidade` itens em round-robin sobre a ordem informada. */
function contabilizar(ordem: ID[], quantidade: number): Map<ID, number> {
  const contagem = new Map<ID, number>();
  ordem.forEach((id) => contagem.set(id, 0));
  for (let i = 0; i < quantidade; i += 1) {
    const alvo = ordem[i % ordem.length];
    contagem.set(alvo, (contagem.get(alvo) ?? 0) + 1);
  }
  return contagem;
}

/** Extrai "Polo Ativo x Polo Passivo" do payload bruto do DJEN. */
function extrairPartes(payload?: Record<string, unknown>): string {
  const destinatarios = payload?.destinatarios;
  if (!Array.isArray(destinatarios)) return "";
  const nome = (polo: string) => {
    const achado = destinatarios.find(
      (item) => (item as { polo?: string })?.polo === polo,
    );
    return (achado as { nome?: string })?.nome ?? "";
  };
  const ativo = nome("A");
  const passivo = nome("P");
  if (!ativo && !passivo) return "";
  return `${ativo || "—"} x ${passivo || "—"}`;
}

function partesDaIntimacao(intimacao: Intimacao): string {
  const raw = lerColecao<IntimacaoDjenRaw>(
    CHAVES.intimacoesDjenRaw,
    intimacoesDjenRawMock,
  ).find((item) => item.id === intimacao.raw_id);
  return extrairPartes(raw?.payload_json);
}

/** Repositório da tabela `intimacoes` + consultas e distribuição. */
export const intimacoesService = {
  ...repositorio,

  /** Listagem paginada da Tela 1 (toda a filtragem acontece aqui). */
  async listar(
    consulta: ConsultaIntimacoes = {},
  ): Promise<ResultadoConsultaIntimacoes> {
    const filtrados = ordenar(
      aplicarFiltros(lerIntimacoes(), consulta),
      consulta.ordenacao ?? ORDENACAO_PADRAO,
    );

    const tamanhoPagina = Math.max(
      1,
      consulta.tamanhoPagina ?? TAMANHO_PAGINA_PADRAO,
    );
    const totalPaginas = Math.max(1, Math.ceil(filtrados.length / tamanhoPagina));
    const pagina = Math.min(Math.max(1, consulta.pagina ?? 1), totalPaginas);
    const inicio = (pagina - 1) * tamanhoPagina;

    return delay({
      dados: filtrados.slice(inicio, inicio + tamanhoPagina),
      total: filtrados.length,
      pagina,
      tamanhoPagina,
      totalPaginas,
    });
  },

  /** Recorte completo (sem paginação) para exportação. */
  async listarParaExportacao(
    consulta: ConsultaIntimacoes = {},
  ): Promise<Intimacao[]> {
    return delay(
      ordenar(
        aplicarFiltros(lerIntimacoes(), consulta),
        consulta.ordenacao ?? ORDENACAO_PADRAO,
      ),
    );
  },

  /** Pendentes de atribuição (triagem e sem responsável). */
  async listarPendentes(
    consulta: ConsultaIntimacoes = {},
  ): Promise<Intimacao[]> {
    const pendentes = aplicarFiltros(lerIntimacoes(), consulta).filter(
      (item) => item.status_fluxo === "triagem" && item.advogado_id === null,
    );
    return delay(
      ordenar(pendentes, {
        campo: "data_disponibilizacao",
        direcao: "asc",
      }),
    );
  },

  /** Mantido por compatibilidade — mesma regra de `listarPendentes`. */
  async listarPendentesDistribuicao(): Promise<Intimacao[]> {
    return intimacoesService.listarPendentes();
  },

  async contarPendentes(): Promise<number> {
    const pendentes = await intimacoesService.listarPendentes();
    return pendentes.length;
  },

  /** Tribunais presentes no recorte, para o seletor de filtros. */
  async listarTribunais(): Promise<string[]> {
    const siglas = new Set(lerIntimacoes().map((item) => item.tribunal_sigla));
    return delay([...siglas].sort((a, b) => a.localeCompare(b)));
  },

  /** Indicadores do topo da Tela 1 — derivados da mesma base. */
  async obterIndicadores(): Promise<IndicadoresIntimacoes> {
    const intimacoes = lerIntimacoes();
    const datas = intimacoes
      .map((item) => item.data_disponibilizacao)
      .sort((a, b) => a.localeCompare(b));
    const dataReferencia = datas[datas.length - 1] ?? "";
    const referencia = new Date(`${dataReferencia}T12:00:00-03:00`);

    const novasHoje = intimacoes.filter(
      (item) => item.data_disponibilizacao === dataReferencia,
    ).length;

    const criticosSemana = intimacoes.filter((item) => {
      const dias = diasAte(item.data_fatal_calculada, referencia);
      return dias !== null && dias >= 0 && dias <= DIAS_SEMANA;
    }).length;

    const pendentesAtribuicao = intimacoes.filter(
      (item) => item.status_fluxo === "triagem" && item.advogado_id === null,
    ).length;

    return delay({
      novasHoje,
      dataReferencia,
      criticosSemana,
      pendentesAtribuicao,
    });
  },

  /* ---------------------------------------------------------------- */
  /* Distribuição (Tela 1.1)                                          */
  /* ---------------------------------------------------------------- */

  /** Prévia matemática (floor + sobras) sem persistir nada. */
  async calcularPrevia(params: {
    intimacaoIds: ID[];
    advogadoIds: ID[];
    criterio: CriterioDistribuicao;
  }): Promise<PreviaDistribuicao> {
    const { advogadoIds, criterio } = params;
    if (advogadoIds.length === 0) {
      throw new Error("Selecione ao menos um advogado elegível.");
    }

    const elegiveis = lerIntimacoes().filter(
      (item) =>
        params.intimacaoIds.includes(item.id) &&
        item.status_fluxo === "triagem" &&
        item.advogado_id === null,
    );
    const carga = cargaAtiva(lerTarefas());
    const ordem = ordenarParticipantes(advogadoIds, criterio, carga);
    const contagem = contabilizar(ordem, elegiveis.length);

    return delay({
      total: elegiveis.length,
      participantes: advogadoIds,
      criterio,
      atribuicoes: advogadoIds.map((advogado_id) => ({
        advogado_id,
        quantidade: contagem.get(advogado_id) ?? 0,
        carga_atual: carga[advogado_id] ?? 0,
      })),
    });
  },

  /**
   * Confirma a distribuição em lote: atualiza as intimações elegíveis,
   * gera as tarefas equivalentes e ignora o que já foi atribuído.
   */
  async distribuirLote(params: {
    intimacaoIds: ID[];
    advogadoIds: ID[];
    criterio: CriterioDistribuicao;
  }): Promise<ResultadoDistribuicao> {
    const { advogadoIds, criterio } = params;
    if (advogadoIds.length === 0) {
      throw new Error("Nenhum advogado elegível selecionado.");
    }

    const intimacoes = lerIntimacoes();
    const tarefas = lerTarefas();
    const elegiveis = intimacoes.filter(
      (item) =>
        params.intimacaoIds.includes(item.id) &&
        item.status_fluxo === "triagem" &&
        item.advogado_id === null,
    );

    if (elegiveis.length === 0) {
      throw new Error("Nenhuma intimação pendente no lote selecionado.");
    }

    const carga = cargaAtiva(tarefas);
    const ordem = ordenarParticipantes(advogadoIds, criterio, carga);
    const carimbo = agora();
    const contagem = new Map<ID, number>(advogadoIds.map((id) => [id, 0]));
    const tarefaIds: ID[] = [];

    elegiveis.forEach((intimacao, index) => {
      const alvo = ordem[index % ordem.length];
      const posicao = intimacoes.findIndex((item) => item.id === intimacao.id);
      intimacoes[posicao] = {
        ...intimacao,
        advogado_id: alvo,
        status_fluxo: "fila",
        distribuido_em: carimbo,
      };

      if (!tarefas.some((tarefa) => tarefa.intimacao_id === intimacao.id)) {
        const tarefa = montarTarefa({
          origem: "djen",
          intimacao_id: intimacao.id,
          advogado_id: alvo,
          numero_processo: intimacao.numero_processo,
          partes_resumo: partesDaIntimacao(intimacao),
          tipo_peca: intimacao.acao_sugerida_ia,
          data_fatal: intimacao.data_fatal_calculada,
          etapa_kanban: "fila",
          link_minuta: null,
          notas_internas: null,
          recibo_protocolo_url: null,
          concluido_em: null,
        });
        tarefas.push(tarefa);
        tarefaIds.push(tarefa.id);
      }

      contagem.set(alvo, (contagem.get(alvo) ?? 0) + 1);
    });

    gravarColecao(CHAVES.intimacoes, intimacoes);
    gravarColecao(CHAVES.tarefasPrazos, tarefas);

    return delay({
      total: elegiveis.length,
      participantes: advogadoIds,
      criterio,
      atribuicoes: advogadoIds.map((advogado_id) => ({
        advogado_id,
        quantidade: contagem.get(advogado_id) ?? 0,
        carga_atual: carga[advogado_id] ?? 0,
      })),
      distribuido_em: carimbo,
      intimacao_ids: elegiveis.map((item) => item.id),
      tarefa_ids: tarefaIds,
    });
  },

  /* ---------------------------------------------------------------- */
  /* Ações da Tela 1.2                                                */
  /* ---------------------------------------------------------------- */

  /** Salva os ajustes humanos e envia a intimação para a esteira. */
  async enviarParaEsteira(params: {
    id: ID;
    acao_sugerida_ia: string;
    resumo_ia: string;
    data_fatal_calculada: string | null;
    advogado_id: ID;
  }): Promise<Intimacao> {
    const intimacoes = lerIntimacoes();
    const indice = intimacoes.findIndex((item) => item.id === params.id);
    if (indice === -1) throw new Error("Intimação não encontrada.");

    const anterior = intimacoes[indice];
    const atualizada: Intimacao = {
      ...anterior,
      acao_sugerida_ia: params.acao_sugerida_ia,
      resumo_ia: params.resumo_ia,
      data_fatal_calculada: params.data_fatal_calculada,
      advogado_id: params.advogado_id,
      status_fluxo: "fila",
      distribuido_em: agora(),
    };
    intimacoes[indice] = atualizada;
    gravarColecao(CHAVES.intimacoes, intimacoes);

    const tarefas = lerTarefas();
    const existente = tarefas.find(
      (tarefa) => tarefa.intimacao_id === params.id,
    );
    if (existente) {
      tarefas[tarefas.indexOf(existente)] = {
        ...existente,
        advogado_id: params.advogado_id,
        tipo_peca: params.acao_sugerida_ia,
        data_fatal: params.data_fatal_calculada,
        updated_at: agora(),
      };
    } else {
      tarefas.push(
        montarTarefa({
          origem: "djen",
          intimacao_id: params.id,
          advogado_id: params.advogado_id,
          numero_processo: anterior.numero_processo,
          partes_resumo: partesDaIntimacao(anterior),
          tipo_peca: params.acao_sugerida_ia,
          data_fatal: params.data_fatal_calculada,
          etapa_kanban: "fila",
          link_minuta: null,
          notas_internas: null,
          recibo_protocolo_url: null,
          concluido_em: null,
        }),
      );
    }
    gravarColecao(CHAVES.tarefasPrazos, tarefas);

    return delay(atualizada);
  },

  /** Arquiva a intimação como ciência, sem gerar prazo. */
  async dispensar(id: ID): Promise<Intimacao> {
    return repositorio.update(id, { status_fluxo: "dispensado" });
  },

  /** Devolve a intimação dispensada para a triagem. */
  async reativar(id: ID): Promise<Intimacao> {
    return repositorio.update(id, { status_fluxo: "triagem" });
  },

  /** Carga ativa por advogado (barra de capacidade operacional). */
  async obterCargaEquipe(): Promise<Record<ID, number>> {
    return delay(cargaAtiva(lerTarefas()));
  },
};
