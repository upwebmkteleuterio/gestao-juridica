import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { intimacoesService } from "@/services";
import type {
  CriterioDistribuicao,
  ID,
  IntimacaoInput,
} from "@/types";

export const intimacoesKeys = {
  all: ["intimacoes"] as const,
  detalhe: (id: string) => ["intimacoes", id] as const,
  pendentes: ["intimacoes", "pendentes"] as const,
};

export function useIntimacoes() {
  return useQuery({
    queryKey: intimacoesKeys.all,
    queryFn: () => intimacoesService.getAll(),
  });
}

export function useIntimacao(id?: string) {
  return useQuery({
    queryKey: intimacoesKeys.detalhe(id ?? ""),
    queryFn: () => intimacoesService.getById(id as string),
    enabled: Boolean(id),
  });
}

export function useIntimacoesPendentes() {
  return useQuery({
    queryKey: intimacoesKeys.pendentes,
    queryFn: () => intimacoesService.listarPendentesDistribuicao(),
  });
}

export function useCriarIntimacao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: IntimacaoInput) => intimacoesService.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: intimacoesKeys.all }),
  });
}

export function useAtualizarIntimacao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: ID; input: Partial<IntimacaoInput> }) =>
      intimacoesService.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: intimacoesKeys.all }),
  });
}

export function useRemoverIntimacao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: ID) => intimacoesService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: intimacoesKeys.all }),
  });
}

/** Prévia matemática da distribuição (Tela 1.1). */
export function usePreviaDistribuicao() {
  return useMutation({
    mutationFn: (params: {
      intimacaoIds: ID[];
      advogadoIds: ID[];
      criterio: CriterioDistribuicao;
    }) =>
      intimacoesService.calcularPrevia(
        params.intimacaoIds,
        params.advogadoIds,
        params.criterio,
      ),
  });
}

/** Confirma a distribuição e atualiza intimações + tarefas. */
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
    },
  });
}
