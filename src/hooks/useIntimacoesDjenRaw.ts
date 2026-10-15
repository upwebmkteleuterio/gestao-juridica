import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { intimacoesDjenRawService } from "@/services";
import type { IntimacaoDjenRawInput } from "@/types";

export const intimacoesDjenRawKeys = {
  all: ["intimacoes-djen-raw"] as const,
  detalhe: (id: string) => ["intimacoes-djen-raw", id] as const,
  status: ["intimacoes-djen-raw", "status"] as const,
};

export function useIntimacoesDjenRaw() {
  return useQuery({
    queryKey: intimacoesDjenRawKeys.all,
    queryFn: () => intimacoesDjenRawService.getAll(),
  });
}

export function useIntimacaoDjenRaw(id?: string) {
  return useQuery({
    queryKey: intimacoesDjenRawKeys.detalhe(id ?? ""),
    queryFn: () => intimacoesDjenRawService.getById(id as string),
    enabled: Boolean(id),
  });
}

export function useContagemAnaliseIA() {
  return useQuery({
    queryKey: intimacoesDjenRawKeys.status,
    queryFn: () => intimacoesDjenRawService.contarPorStatus(),
  });
}

export function useCriarIntimacaoDjenRaw() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: IntimacaoDjenRawInput) =>
      intimacoesDjenRawService.create(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: intimacoesDjenRawKeys.all }),
  });
}

export function useAtualizarIntimacaoDjenRaw() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Partial<IntimacaoDjenRawInput>;
    }) => intimacoesDjenRawService.update(id, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: intimacoesDjenRawKeys.all }),
  });
}

export function useRemoverIntimacaoDjenRaw() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => intimacoesDjenRawService.remove(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: intimacoesDjenRawKeys.all }),
  });
}
