import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { anexosService } from "@/services";
import type { Anexo, AnexoVinculo } from "@/types";

export const anexosKey = (vinculo: AnexoVinculo) => ["anexos", vinculo] as const;

export function useAnexos(vinculo: AnexoVinculo | null) {
  return useQuery({
    queryKey: vinculo ? anexosKey(vinculo) : ["anexos", "indefinido"],
    queryFn: () => anexosService.listar(vinculo as AnexoVinculo),
    enabled: Boolean(vinculo),
  });
}

export function useCriarAnexo(vinculo: AnexoVinculo) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ arquivo, enviadoPor }: { arquivo: File; enviadoPor: string | null }) => anexosService.criar(vinculo, arquivo, enviadoPor),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: anexosKey(vinculo) }),
  });
}

export function useRemoverAnexo(vinculo: AnexoVinculo) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (anexo: Anexo) => anexosService.remover(anexo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: anexosKey(vinculo) }),
  });
}

export function useUrlAnexo() {
  return useMutation({ mutationFn: (caminho: string) => anexosService.obterUrl(caminho) });
}
