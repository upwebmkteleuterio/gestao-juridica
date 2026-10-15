import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { advogadosService } from "@/services";
import type { AdvogadoInput } from "@/types";

export const advogadosKeys = {
  all: ["advogados"] as const,
  detalhe: (id: string) => ["advogados", id] as const,
  elegiveis: ["advogados", "elegiveis"] as const,
};

export function useAdvogados() {
  return useQuery({
    queryKey: advogadosKeys.all,
    queryFn: () => advogadosService.getAll(),
  });
}

export function useAdvogadosElegiveis() {
  return useQuery({
    queryKey: advogadosKeys.elegiveis,
    queryFn: () => advogadosService.listarElegiveis(),
  });
}

export function useAdvogado(id?: string) {
  return useQuery({
    queryKey: advogadosKeys.detalhe(id ?? ""),
    queryFn: () => advogadosService.getById(id as string),
    enabled: Boolean(id),
  });
}

/** A equipe mudou: os cards de produtividade da Tela 4 precisam recarregar. */
function invalidarEquipe(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: advogadosKeys.all });
  queryClient.invalidateQueries({ queryKey: ["tarefas-prazos"] });
}

export function useCriarAdvogado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AdvogadoInput) => advogadosService.create(input),
    onSuccess: () => invalidarEquipe(queryClient),
  });
}

export function useAtualizarAdvogado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<AdvogadoInput> }) =>
      advogadosService.update(id, input),
    onSuccess: () => invalidarEquipe(queryClient),
  });
}

/** Checagem de duplicidade da inscrição da OAB (Tela 4.1). */
export function useVerificarOabEmUso() {
  return useMutation({
    mutationFn: (params: {
      oab_numero: string;
      oab_uf: string;
      ignorarId?: string;
    }) =>
      advogadosService.oabEmUso(
        params.oab_numero,
        params.oab_uf,
        params.ignorarId,
      ),
  });
}

export function useRemoverAdvogado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => advogadosService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: advogadosKeys.all }),
  });
}
