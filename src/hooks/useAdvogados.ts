import { useMutation, useQuery } from "@tanstack/react-query";
import { advogadosService } from "@/services";

export const advogadosKeys = {
  all: ["advogados"] as const,
  detalhe: (id: string) => ["advogados", id] as const,
  elegiveis: ["advogados", "elegiveis"] as const,
  visiveis: ["advogados", "visiveis"] as const,
};

export function useAdvogados() {
  return useQuery({
    queryKey: advogadosKeys.all,
    queryFn: () => advogadosService.getAll(),
  });
}

export function useAdvogadosVisiveis() {
  return useQuery({
    queryKey: advogadosKeys.visiveis,
    queryFn: () => advogadosService.listarVisiveis(),
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
