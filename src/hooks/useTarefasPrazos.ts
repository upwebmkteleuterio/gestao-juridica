import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { tarefasPrazosService } from "@/services";
import type {
  ConsultaEsteira,
  EtapaKanban,
  TarefaPrazoInput,
} from "@/types";

export const tarefasKeys = {
  all: ["tarefas-prazos"] as const,
  detalhe: (id: string) => ["tarefas-prazos", id] as const,
  porAdvogado: (id: string) => ["tarefas-prazos", "advogado", id] as const,
  carga: ["tarefas-prazos", "carga"] as const,
  capacidade: ["tarefas-prazos", "capacidade"] as const,
  ativas: ["tarefas-prazos", "ativas"] as const,
  criticas: ["tarefas-prazos", "criticas"] as const,
  etapas: ["tarefas-prazos", "etapas"] as const,
  esteira: (consulta: ConsultaEsteira) =>
    ["tarefas-prazos", "esteira", consulta] as const,
};

export function useTarefasPrazos() {
  return useQuery({
    queryKey: tarefasKeys.all,
    queryFn: () => tarefasPrazosService.getAll(),
  });
}

/** Kanban da Tela 2 — escopo e urgência vão na chave da consulta. */
export function useEsteira(consulta: ConsultaEsteira) {
  return useQuery({
    queryKey: tarefasKeys.esteira(consulta),
    queryFn: () => tarefasPrazosService.listarEsteira(consulta),
    placeholderData: keepPreviousData,
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

/** Carga operacional por advogado (barra de capacidade — Tela 1 e 1.1). */
export function useCapacidadeOperacional() {
  return useQuery({
    queryKey: tarefasKeys.capacidade,
    queryFn: () => tarefasPrazosService.obterCapacidade(),
  });
}

/** Prazos críticos (< 48h) — central de alertas da topbar. */
export function useTarefasCriticas() {
  return useQuery({
    queryKey: tarefasKeys.criticas,
    queryFn: () => tarefasPrazosService.listarCriticos(),
  });
}

/** Total de tarefas em produção (badge da sidebar). */
export function useContagemTarefasAtivas() {
  return useQuery({
    queryKey: tarefasKeys.ativas,
    queryFn: () => tarefasPrazosService.contarAtivas(),
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
