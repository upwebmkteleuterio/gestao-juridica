import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { intimacoesService } from "@/services";
import type {
  ConsultaIntimacoes,
  CriterioDistribuicao,
  ID,
  IntimacaoInput,
} from "@/types";

export const intimacoesKeys = {
  all: ["intimacoes"] as const,
  consulta: (consulta: ConsultaIntimacoes) =>
    ["intimacoes", "consulta", consulta] as const,
  detalhe: (id: string) => ["intimacoes", "detalhe", id] as const,
  analises: (rawId: string) => ["intimacoes", "analises", rawId] as const,
  indicadores: ["intimacoes", "indicadores"] as const,
  tribunais: ["intimacoes", "tribunais"] as const,
  pendentes: (consulta: ConsultaIntimacoes) =>
    ["intimacoes", "pendentes", consulta] as const,
  contagemPendentes: ["intimacoes", "contagem-pendentes"] as const,
};

/** Listagem paginada — filtros, busca e página vão na chave da consulta. */
export function useConsultaIntimacoes(consulta: ConsultaIntimacoes) {
  return useQuery({
    queryKey: intimacoesKeys.consulta(consulta),
    queryFn: () => intimacoesService.listar(consulta),
    placeholderData: keepPreviousData,
  });
}

export function useIndicadoresIntimacoes() {
  return useQuery({
    queryKey: intimacoesKeys.indicadores,
    queryFn: () => intimacoesService.obterIndicadores(),
  });
}

export function useTribunaisIntimacoes() {
  return useQuery({
    queryKey: intimacoesKeys.tribunais,
    queryFn: () => intimacoesService.listarTribunais(),
  });
}

export function useContagemPendentesIntimacoes() {
  return useQuery({
    queryKey: intimacoesKeys.contagemPendentes,
    queryFn: () => intimacoesService.contarPendentes(),
  });
}

/** Pendentes de atribuição dentro do recorte (base da Tela 1.1). */
export function useIntimacoesPendentes(
  consulta: ConsultaIntimacoes,
  habilitado = true,
) {
  return useQuery({
    queryKey: intimacoesKeys.pendentes(consulta),
    queryFn: () => intimacoesService.listarPendentes(consulta),
    enabled: habilitado,
  });
}

export function useIntimacao(id?: string) {
  return useQuery({
    queryKey: intimacoesKeys.detalhe(id ?? ""),
    queryFn: () => intimacoesService.getById(id as string),
    enabled: Boolean(id),
  });
}

export function useNumeroProcessoExistente(numeroDigitos: string) {
  return useQuery({
    queryKey: ["intimacoes", "numero-existente", numeroDigitos],
    queryFn: () => intimacoesService.existeNumero(numeroDigitos),
    enabled: numeroDigitos.length === 20,
    staleTime: 0,
  });
}

export function useCriarProcessoManual() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { numero_processo: string; observacoes: string | null; duplicado: boolean }) =>
      intimacoesService.criarProcessoManual(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: intimacoesKeys.all }),
  });
}

/** Recorte completo (sem paginação) usado pela exportação. */
export function useExportarIntimacoes() {
  return useMutation({
    mutationFn: (consulta: ConsultaIntimacoes) =>
      intimacoesService.listarParaExportacao(consulta),
  });
}

export function useCriarIntimacao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: IntimacaoInput) => intimacoesService.create(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: intimacoesKeys.all }),
  });
}

export function useAtualizarIntimacao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: ID; input: Partial<IntimacaoInput> }) =>
      intimacoesService.update(id, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: intimacoesKeys.all }),
  });
}

export function useAtualizarObservacaoIntimacao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, observacoes }: { id: ID; observacoes: string | null }) =>
      intimacoesService.update(id, { observacoes }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: intimacoesKeys.all }),
  });
}

/** Histórico de tentativas de análise por IA de uma publicação. */
export function useAnalisesIa(rawId?: string) {
  return useQuery({
    queryKey: intimacoesKeys.analises(rawId ?? ""),
    queryFn: () => intimacoesService.listarAnalises(rawId as string),
    enabled: Boolean(rawId),
  });
}

/** Dispara (ou repete) a análise por IA; atualiza o que depende do resultado. */
export function useAnalisarPublicacao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rawId: ID) => intimacoesService.analisar(rawId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: intimacoesKeys.all });
      queryClient.invalidateQueries({ queryKey: ["intimacoes-djen-raw"] });
    },
  });
}

/* ------------------------------------------------------------------ */
/* Distribuição (Tela 1.1)                                             */
/* ------------------------------------------------------------------ */

/** Prévia matemática reativa conforme elegíveis/critério mudam. */
export function usePreviaDistribuicao(
  params: {
    intimacaoIds: ID[];
    advogadoIds: ID[];
    criterio: CriterioDistribuicao;
  },
  habilitado = true,
) {
  return useQuery({
    queryKey: ["distribuicao", "previa", params],
    queryFn: () => intimacoesService.calcularPrevia(params),
    enabled:
      habilitado && params.advogadoIds.length > 0 && params.intimacaoIds.length > 0,
  });
}

export function useDistribuirLote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      intimacaoIds: ID[];
      advogadoIds: ID[];
      criterio: CriterioDistribuicao;
    }) => intimacoesService.distribuirLote(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: intimacoesKeys.all });
      queryClient.invalidateQueries({ queryKey: ["tarefas-prazos"] });
      queryClient.invalidateQueries({ queryKey: ["distribuicao"] });
    },
  });
}

export function useDevolverDistribuicao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (advogadoId: ID) => intimacoesService.devolverDistribuicao(advogadoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: intimacoesKeys.all });
      queryClient.invalidateQueries({ queryKey: ["tarefas-prazos"] });
      queryClient.invalidateQueries({ queryKey: ["distribuicao"] });
      queryClient.invalidateQueries({ queryKey: ["equipe"] });
    },
  });
}

/* ------------------------------------------------------------------ */
/* Ações da Tela 1.2                                                   */
/* ------------------------------------------------------------------ */

export function useEnviarParaEsteira() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      id: ID;
      acao_sugerida_ia: string;
      resumo_ia: string;
      data_fatal_calculada: string | null;
      advogado_id: ID;
    }) => intimacoesService.enviarParaEsteira(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: intimacoesKeys.all });
      queryClient.invalidateQueries({ queryKey: ["tarefas-prazos"] });
    },
  });
}

export function useDispensarIntimacao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: ID) => intimacoesService.dispensar(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: intimacoesKeys.all }),
  });
}

export function useReativarIntimacao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: ID) => intimacoesService.reativar(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: intimacoesKeys.all }),
  });
}
