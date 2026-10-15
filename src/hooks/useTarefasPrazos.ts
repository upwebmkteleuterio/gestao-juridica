import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tarefasPrazosService } from "@/services";
import type { EtapaKanban, TarefaPrazoInput } from "@/types";

export const tarefasKeys = {
  all: ["tarefas-prazos"] as const,
  detalhe: (id: string) => ["tarefas-prazos", id] as const,
  porAdvogado: (id: string) => ["tarefas-prazos", "advogado", id] as const,
  carga: ["tarefas-prazos", "carga"] as const,
  etapas: ["tarefas-prazos", "etapas"] as const,
};

export function useTarefasPrazos() {
  return useQuery({
    queryKey: tarefasKeys.all,
    queryFn: () => tarefasPrazosService.getAll(),
  });
}

export function useTarefaPrazo(id?: string) {
  return useQuery({
    queryKey: tarefasKeys.detalhe(id ?? ""),
    queryFn: () => tarefasPrazosService.getById(id as string),
    enabled: Boolean(id),
  });
}

export function useTarefasPorAdvogado(advogadoId?: string) {
  return useQuery({
    queryKey: tarefasKeys.porAdvogado(advogadoId ?? ""),
    queryFn: () => tarefasPrazosService.listarPorAdvogado(advogadoId as string),
    enabled: Boolean(advogadoId),
  });
}

export function useCargaPorAdvogado() {
  return useQuery({
    queryKey: tarefasKeys.carga,
    queryFn: () => tarefasPrazosService.cargaPorAdvogado(),
  });
}

export function useContagemEtapas() {
  return useQuery({
    queryKey: tarefasKeys.etapas,
    queryFn: () => tarefasPrazosService.contarPorEtapa(),
  });
}

export function useCriarTarefaPrazo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TarefaPrazoInput) => tarefasPrazosService.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tarefasKeys.all }),
  });
}

export function useAtualizarTarefaPrazo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<TarefaPrazoInput> }) =>
      tarefasPrazosService.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tarefasKeys.all }),
  });
}

export function useMoverEtapa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, etapa }: { id: string; etapa: EtapaKanban }) =>
      tarefasPrazosService.moverEtapa(id, etapa),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tarefasKeys.all }),
  });
}

export function useRemoverTarefaPrazo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tarefasPrazosService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tarefasKeys.all }),
  });
}
