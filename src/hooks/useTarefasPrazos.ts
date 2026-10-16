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
  ConsultaArquivados,
  ID,
  ResultadoEsteira,
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
  produtividade: ["tarefas-prazos", "produtividade"] as const,
  esteira: (consulta: ConsultaEsteira) =>
    ["tarefas-prazos", "esteira", consulta] as const,
  arquivados: (consulta: ConsultaArquivados) =>
    ["tarefas-prazos", "arquivados", consulta] as const,
};

export function reordenarLocalmente(
  atual: ResultadoEsteira,
  etapa: EtapaKanban,
  ids: ID[],
): ResultadoEsteira {
  const coluna = atual.colunas.find((item) => item.etapa === etapa);
  if (!coluna) return atual;
  const porId = new Map(coluna.tarefas.map((tarefa) => [tarefa.id, tarefa]));
  const tarefas = ids.flatMap((id, indice) => {
    const tarefa = porId.get(id);
    return tarefa ? [{ ...tarefa, ordem_kanban: indice }] : [];
  });
  return {
    ...atual,
    colunas: atual.colunas.map((item) =>
      item.etapa === etapa ? { ...item, tarefas } : item,
    ),
  };
}

export function useTarefasPrazos() {
  return useQuery({
    queryKey: tarefasKeys.all,
    queryFn: () => tarefasPrazosService.getAll(),
  });
}

/** Kanban da Tela 2 — responsável e urgência vão na chave da consulta. */
export function useEsteira(consulta: ConsultaEsteira) {
  return useQuery({
    queryKey: tarefasKeys.esteira(consulta),
    queryFn: () => tarefasPrazosService.listarEsteira(consulta),
    placeholderData: keepPreviousData,
  });
}

export function useArquivadas(consulta: ConsultaArquivados) {
  return useQuery({
    queryKey: tarefasKeys.arquivados(consulta),
    queryFn: () => tarefasPrazosService.listarArquivadas(consulta),
    enabled: Boolean(consulta.de && consulta.ate && consulta.de <= consulta.ate),
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

/** Cards do Painel da Equipe (Tela 4) — view de produtividade + advogados. */
export function useProdutividadeEquipe() {
  return useQuery({
    queryKey: tarefasKeys.produtividade,
    queryFn: () => tarefasPrazosService.obterProdutividadeEquipe(),
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

export function useArquivarTarefa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: ID) => tarefasPrazosService.arquivar(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tarefasKeys.all }),
  });
}

export function useDesarquivarTarefa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: ID) => tarefasPrazosService.desarquivar(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tarefasKeys.all }),
  });
}

export function useReordenarKanban(consulta: ConsultaEsteira) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ etapa, ids }: { etapa: EtapaKanban; ids: ID[] }) =>
      tarefasPrazosService.reordenarKanban(etapa, ids),
    onMutate: async ({ etapa, ids }) => {
      await queryClient.cancelQueries({ queryKey: tarefasKeys.all });
      const chave = tarefasKeys.esteira(consulta);
      const snapshot = queryClient.getQueryData<ResultadoEsteira>(chave);
      if (snapshot) queryClient.setQueryData(chave, reordenarLocalmente(snapshot, etapa, ids));
      return { snapshot, chave };
    },
    onError: (_erro, _variaveis, contexto) => {
      if (contexto?.snapshot) queryClient.setQueryData(contexto.chave, contexto.snapshot);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: tarefasKeys.all }),
  });
}
