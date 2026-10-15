import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { configuracoesService } from "@/services";
import type { ConfiguracaoSistemaInput } from "@/types";

export const configuracoesKeys = {
  all: ["configuracoes-sistema"] as const,
};

export function useConfiguracoes() {
  return useQuery({
    queryKey: configuracoesKeys.all,
    queryFn: () => configuracoesService.get(),
  });
}

export function useAtualizarConfiguracoes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<ConfiguracaoSistemaInput>) =>
      configuracoesService.update("1", input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: configuracoesKeys.all }),
  });
}

export function useRestaurarConfiguracoes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => configuracoesService.restaurar(),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: configuracoesKeys.all }),
  });
}
