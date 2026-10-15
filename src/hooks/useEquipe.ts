import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { equipeService } from "@/services/equipeService";
import type {
  AtualizarMembroEquipeInput,
  CriarMembroEquipeInput,
  DefinirAcessoEquipeInput,
} from "@/types";

export function useAcessoEquipe() {
  return useQuery({
    queryKey: ["equipe", "acesso"],
    queryFn: () => equipeService.listarAcesso(),
  });
}

function useMutacaoEquipe<TInput>(mutationFn: (input: TInput) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["advogados"] }),
        queryClient.invalidateQueries({ queryKey: ["equipe", "acesso"] }),
        queryClient.invalidateQueries({ queryKey: ["tarefas-prazos"] }),
      ]);
    },
  });
}

export function useCriarMembro() {
  return useMutacaoEquipe((input: CriarMembroEquipeInput) => equipeService.criarMembro(input));
}

export function useAtualizarMembro() {
  return useMutacaoEquipe((input: AtualizarMembroEquipeInput) => equipeService.atualizarMembro(input));
}

export function useDefinirAcesso() {
  return useMutacaoEquipe((input: DefinirAcessoEquipeInput) => equipeService.definirAcesso(input));
}

export function useExcluirMembro() {
  return useMutacaoEquipe((id: string) => equipeService.excluirMembro(id));
}
