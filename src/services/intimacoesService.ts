import { intimacoesMock, tarefasPrazosMock } from "@/mocks";
import type {
  CriterioDistribuicao,
  ID,
  Intimacao,
  IntimacaoInput,
  PreviaDistribuicao,
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

const repositorio = criarRepositorio<Intimacao, IntimacaoInput>({
  chave: CHAVES.intimacoes,
  seed: intimacoesMock,
  construir: (input) => ({ ...input, id: criarId("int") }),
});

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

function contabilizar(
  ordem: ID[],
  quantidade: number,
): Map<ID, number> {
  const contagem = new Map<ID, number>();
  ordem.forEach((id) => contagem.set(id, 0));
  for (let i = 0; i < quantidade; i += 1) {
    const alvo = ordem[i % ordem.length];
    contagem.set(alvo, (contagem.get(alvo) ?? 0) + 1);
  }
  return contagem;
}

/** Repositório da tabela `intimacoes` + algoritmos de distribuição. */
export const intimacoesService = {
  ...repositorio,

  /** Intimações em triagem e ainda sem responsável (Tela 1.1). */
  async listarPendentesDistribuicao(): Promise<Intimacao[]> {
    const todas = await repositorio.getAll();
    return todas.filter(
      (intimacao) =>
        intimacao.status_fluxo === "triagem" && intimacao.advogado_id === null,
    );
  },

  async contarPendentes(): Promise<number> {
    const pendentes = await intimacoesService.listarPendentesDistribuicao();
    return pendentes.length;
  },

  /** Prévia matemática (floor + sobras) sem persistir nada. */
  async calcularPrevia(
    intimacaoIds: ID[],
    advogadoIds: ID[],
    criterio: CriterioDistribuicao,
  ): Promise<PreviaDistribuicao> {
    if (advogadoIds.length === 0) {
      throw new Error("Selecione ao menos um advogado elegível.");
    }
    const tarefas = lerColecao<TarefaPrazo>(
      CHAVES.tarefasPrazos,
      tarefasPrazosMock,
    );
    const carga = cargaAtiva(tarefas);
    const ordem = ordenarParticipantes(advogadoIds, criterio, carga);
    const contagem = contabilizar(ordem, intimacaoIds.length);

    return delay({
      total: intimacaoIds.length,
      participantes: advogadoIds,
      criterio,
      atribuicoes: advogadoIds.map((advogado_id) => ({
        advogado_id,
        quantidade: contagem.get(advogado_id) ?? 0,
        carga_atual: carga[advogado_id] ?? 0,
      })),
    });
  },

  /** Confirma a distribuição em lote e gera as tarefas equivalentes. */
  async distribuirLote(params: {
    intimacaoIds: ID[];
    advogadoIds: ID[];
    criterio: CriterioDistribuicao;
  }): Promise<ResultadoDistribuicao> {
    const { intimacaoIds, advogadoIds, criterio } = params;
    if (advogadoIds.length === 0) {
      throw new Error("Nenhum advogado elegível selecionado.");
    }
    if (intimacaoIds.length === 0) {
      throw new Error("Nenhuma intimação selecionada para distribuir.");
    }

    const intimacoes = lerColecao<Intimacao>(CHAVES.intimacoes, intimacoesMock);
    const tarefas = lerColecao<TarefaPrazo>(
      CHAVES.tarefasPrazos,
      tarefasPrazosMock,
    );
    const carga = cargaAtiva(tarefas);
    const ordem = ordenarParticipantes(advogadoIds, criterio, carga);
    const carimbo = agora();
    const tarefaIds: ID[] = [];
    const contagem = new Map<ID, number>();
    ordem.forEach((id) => contagem.set(id, 0));

    intimacaoIds.forEach((intimacaoId, index) => {
      const alvo = ordem[index % ordem.length];
      const posicao = intimacoes.findIndex((item) => item.id === intimacaoId);
      if (posicao === -1) return;

      const intimacao = intimacoes[posicao];
      intimacoes[posicao] = {
        ...intimacao,
        advogado_id: alvo,
        status_fluxo: "fila",
        distribuido_em: carimbo,
      };

      const tarefa = montarTarefa({
        origem: "djen",
        intimacao_id: intimacao.id,
        advogado_id: alvo,
        numero_processo: intimacao.numero_processo,
        partes_resumo: "",
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
      contagem.set(alvo, (contagem.get(alvo) ?? 0) + 1);
    });

    gravarColecao(CHAVES.intimacoes, intimacoes);
    gravarColecao(CHAVES.tarefasPrazos, tarefas);

    return delay({
      total: intimacaoIds.length,
      participantes: advogadoIds,
      criterio,
      atribuicoes: advogadoIds.map((advogado_id) => ({
        advogado_id,
        quantidade: contagem.get(advogado_id) ?? 0,
        carga_atual: carga[advogado_id] ?? 0,
      })),
      distribuido_em: carimbo,
      intimacao_ids: intimacaoIds,
      tarefa_ids: tarefaIds,
    });
  },
};
