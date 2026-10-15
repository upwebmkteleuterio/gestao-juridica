import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { intimacoesDjenRawService } from "@/services";
import type {
  ConsultaAuditoriaDjen,
  IntimacaoDjenRawInput,
  ParametrosCapturaDjen,
} from "@/types";

export const intimacoesDjenRawKeys = {
  all: ["intimacoes-djen-raw"] as const,
  detalhe: (id: string) => ["intimacoes-djen-raw", id] as const,
  status: ["intimacoes-djen-raw", "status"] as const,
  auditoria: (consulta: ConsultaAuditoriaDjen) =>
    ["intimacoes-djen-raw", "auditoria", consulta] as const,
  indicadores: ["intimacoes-djen-raw", "indicadores"] as const,
  tribunais: ["intimacoes-djen-raw", "tribunais"] as const,
};

/** Data grid da Tela 3 — filtros e página vão na chave da consulta. */
export function useAuditoriaDjen(consulta: ConsultaAuditoriaDjen) {
  return useQuery({
    queryKey: intimacoesDjenRawKeys.auditoria(consulta),
    queryFn: () => intimacoesDjenRawService.listar(consulta),
    placeholderData: keepPreviousData,
  });
}

/** Indicadores do topo da Tela 3. */
export function useIndicadoresIngestaoDjen() {
  return useQuery({
    queryKey: intimacoesDjenRawKeys.indicadores,
    queryFn: () => intimacoesDjenRawService.obterIndicadores(),
  });
}

/** Tribunais presentes no log — seletor opcional da Tela 3.1. */
export function useTribunaisDjen() {
  return useQuery({
    queryKey: intimacoesDjenRawKeys.tribunais,
    queryFn: () => intimacoesDjenRawService.listarTribunais(),
  });
}

/** Disparo manual de captura (Tela 3.1). */
export function useDispararConsultaDjen() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: ParametrosCapturaDjen) =>
      intimacoesDjenRawService.dispararConsulta(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: intimacoesDjenRawKeys.all });
      queryClient.invalidateQueries({ queryKey: ["eventos-auditoria"] });
    },
  });
}

export function useIntimacoesDjenRaw() {
  return useQuery({
    queryKey: intimacoesDjenRawKeys.all,
    queryFn: () => intimacoesDjenRawService.getAll(),
  });
}

export function useIntimacaoDjenRaw(id?: string) {
  return useQuery({
    queryKey: intimacoesDjenRawKeys.detalhe(id ?? ""),
    queryFn: () => intimacoesDjenRawService.getById(id as string),
    enabled: Boolean(id),
  });
}

export function useContagemAnaliseIA() {
  return useQuery({
    queryKey: intimacoesDjenRawKeys.status,
    queryFn: () => intimacoesDjenRawService.contarPorStatus(),
  });
}

export function useCriarIntimacaoDjenRaw() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: IntimacaoDjenRawInput) =>
      intimacoesDjenRawService.create(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: intimacoesDjenRawKeys.all }),
  });
}

export function useAtualizarIntimacaoDjenRaw() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Partial<IntimacaoDjenRawInput>;
    }) => intimacoesDjenRawService.update(id, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: intimacoesDjenRawKeys.all }),
  });
}

export function useRemoverIntimacaoDjenRaw() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => intimacoesDjenRawService.remove(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: intimacoesDjenRawKeys.all }),
  });
}
