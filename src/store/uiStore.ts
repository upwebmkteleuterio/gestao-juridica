import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  CriterioDistribuicao,
  FiltroIntimacoes,
  ID,
  UrgenciaEsteira,
} from "@/types";

export type Tema = "light" | "dark";

export interface FiltroEsteira {
  responsavelId: ID | null;
  urgencia: UrgenciaEsteira;
}

export type AbaEsteira = "pipeline" | "arquivados";

interface UiState {
  /* Preferências persistidas */
  tema: Tema;
  sidebarRecolhida: boolean;
  filtrosPainel: FiltroIntimacoes;
  filtroEsteira: FiltroEsteira;
  abaEsteira: AbaEsteira;
  criterioDistribuicao: CriterioDistribuicao;
  scrollPorRota: Record<string, number>;
  rascunhoPrazoManual: Record<string, unknown>;
  /** Evita reaplicar as preferências padrão a cada abertura. */
  preferenciasIniciadas: boolean;
  /** Evita reaplicar o escopo padrão da Esteira a cada abertura. */
  esteiraIniciada: boolean;
  /** Modais/ painéis usados como rotas (controle auxiliar). */
  modalAberto: string | null;
  painelLateral: { tipo: string | null; id: ID | null };

  /* Ações */
  setTema: (tema: Tema) => void;
  alternarTema: () => void;
  alternarSidebar: () => void;
  setSidebarRecolhida: (recolhida: boolean) => void;
  setFiltrosPainel: (filtros: Partial<FiltroIntimacoes>) => void;
  limparFiltrosPainel: () => void;
  setFiltroEsteira: (filtro: Partial<FiltroEsteira>) => void;
  setAbaEsteira: (aba: AbaEsteira) => void;
  setCriterioDistribuicao: (criterio: CriterioDistribuicao) => void;
  registrarScroll: (rota: string, posicao: number) => void;
  setRascunhoPrazoManual: (rascunho: Record<string, unknown>) => void;
  limparRascunhoPrazoManual: () => void;
  marcarPreferenciasIniciadas: () => void;
  marcarEsteiraIniciada: () => void;
  abrirModal: (nome: string | null) => void;
  abrirPainelLateral: (tipo: string | null, id?: ID | null) => void;
}

const FILTROS_INICIAIS: FiltroIntimacoes = {
  busca: "",
  tribunal: "",
  disponibilizacaoDe: "",
  disponibilizacaoAte: "",
  apenasMinhaPauta: false,
  apenasArquivadas: false,
  tipoNumeracao: "todos",
  advogadoId: null,
};

const URGENCIAS_ESTEIRA: UrgenciaEsteira[] = ["todos", "criticos", "hoje", "semana", "em_dia"];

function normalizarFiltroEsteira(valor: unknown): FiltroEsteira {
  const salvo = valor && typeof valor === "object" ? valor as Partial<FiltroEsteira> : {};
  const responsavelId = salvo.responsavelId;
  const idValido = typeof responsavelId === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(responsavelId);
  return {
    responsavelId: idValido ? responsavelId : null,
    urgencia: URGENCIAS_ESTEIRA.includes(salvo.urgencia as UrgenciaEsteira) ? salvo.urgencia as UrgenciaEsteira : "todos",
  };
}

/**
 * Estado de interface global com persistência: tema, filtros, posição de
 * rolagem e rascunhos. Fechar o navegador não perde o contexto do usuário.
 */
export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      tema: "light",
      sidebarRecolhida: false,
      filtrosPainel: FILTROS_INICIAIS,
      filtroEsteira: { responsavelId: null, urgencia: "todos" },
      abaEsteira: "pipeline",
      criterioDistribuicao: "igualitario",
      scrollPorRota: {},
      rascunhoPrazoManual: {},
      preferenciasIniciadas: false,
      esteiraIniciada: false,
      modalAberto: null,
      painelLateral: { tipo: null, id: null },

      setTema: (tema) => set({ tema }),
      alternarTema: () => set({ tema: get().tema === "dark" ? "light" : "dark" }),
      alternarSidebar: () => set({ sidebarRecolhida: !get().sidebarRecolhida }),
      setSidebarRecolhida: (sidebarRecolhida) => set({ sidebarRecolhida }),
      setFiltrosPainel: (filtros) =>
        set({ filtrosPainel: { ...get().filtrosPainel, ...filtros } }),
      limparFiltrosPainel: () => set({ filtrosPainel: FILTROS_INICIAIS }),
      setFiltroEsteira: (filtro) =>
        set({ filtroEsteira: { ...get().filtroEsteira, ...filtro } }),
      setAbaEsteira: (abaEsteira) => set({ abaEsteira }),
      setCriterioDistribuicao: (criterioDistribuicao) =>
        set({ criterioDistribuicao }),
      registrarScroll: (rota, posicao) =>
        set({ scrollPorRota: { ...get().scrollPorRota, [rota]: posicao } }),
      setRascunhoPrazoManual: (rascunhoPrazoManual) => set({ rascunhoPrazoManual }),
      limparRascunhoPrazoManual: () => set({ rascunhoPrazoManual: {} }),
      marcarPreferenciasIniciadas: () => set({ preferenciasIniciadas: true }),
      marcarEsteiraIniciada: () => set({ esteiraIniciada: true }),
      abrirModal: (modalAberto) => set({ modalAberto }),
      abrirPainelLateral: (tipo, id = null) =>
        set({ painelLateral: { tipo, id } }),
    }),
    {
      name: "mg-gestao-juridica:ui",
      partialize: (estado) => ({
        tema: estado.tema,
        sidebarRecolhida: estado.sidebarRecolhida,
        filtrosPainel: estado.filtrosPainel,
        filtroEsteira: estado.filtroEsteira,
        abaEsteira: estado.abaEsteira,
        criterioDistribuicao: estado.criterioDistribuicao,
        scrollPorRota: estado.scrollPorRota,
        rascunhoPrazoManual: estado.rascunhoPrazoManual,
        preferenciasIniciadas: estado.preferenciasIniciadas,
        esteiraIniciada: estado.esteiraIniciada,
      }),
      merge: (persistido, estadoAtual) => {
        const salvo = persistido as Partial<UiState> | undefined;
        const filtroSalvo = salvo?.filtroEsteira as unknown;
        const formatoAntigo = !filtroSalvo || typeof filtroSalvo !== "object" || !("responsavelId" in filtroSalvo);
        return {
          ...estadoAtual,
          ...(salvo ?? {}),
          /* Recortes salvos por versões anteriores não trazem campos novos. */
          filtrosPainel: { ...FILTROS_INICIAIS, ...(salvo?.filtrosPainel ?? {}) },
          filtroEsteira: normalizarFiltroEsteira(filtroSalvo),
          abaEsteira: salvo?.abaEsteira === "arquivados" ? "arquivados" : "pipeline",
          esteiraIniciada: formatoAntigo ? false : salvo?.esteiraIniciada ?? estadoAtual.esteiraIniciada,
        };
      },
    },
  ),
);
