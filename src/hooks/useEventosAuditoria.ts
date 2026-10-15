import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { eventosAuditoriaService } from "@/services";
import type { EventoAuditoriaInput } from "@/types";

export const auditoriaKeys = {
  all: ["eventos-auditoria"] as const,
  recentes: (limite: number) => ["eventos-auditoria", "recentes", limite] as const,
  porEntidade: (id: string) => ["eventos-auditoria", "entidade", id] as const,
};

export function useEventosAuditoria() {
  return useQuery({
    queryKey: auditoriaKeys.all,
    queryFn: () => eventosAuditoriaService.getAll(),
  });
}

export function useEventosRecentes(limite = 10) {
  return useQuery({
    queryKey: auditoriaKeys.recentes(limite),
    queryFn: () => eventosAuditoriaService.listarRecentes(limite),
  });
}

export function useEventosPorEntidade(entidadeId?: string) {
  return useQuery({
    queryKey: auditoriaKeys.porEntidade(entidadeId ?? ""),
    queryFn: () => eventosAuditoriaService.listarPorEntidade(entidadeId as string),
    enabled: Boolean(entidadeId),
  });
}

export function useRegistrarEvento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: EventoAuditoriaInput) => eventosAuditoriaService.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: auditoriaKeys.all }),
  });
}
