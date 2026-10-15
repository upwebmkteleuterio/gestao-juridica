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

export function useCriarAdvogado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AdvogadoInput) => advogadosService.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: advogadosKeys.all }),
  });
}

export function useAtualizarAdvogado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<AdvogadoInput> }) =>
      advogadosService.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: advogadosKeys.all }),
  });
}

export function useRemoverAdvogado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => advogadosService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: advogadosKeys.all }),
  });
}
