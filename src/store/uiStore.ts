import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CriterioDistribuicao, FiltroIntimacoes, ID } from "@/types";

export type Tema = "light" | "dark";

export interface FiltroEsteira {
  escopo: "meus" | "geral";
  urgencia: "todos" | "criticos" | "hoje" | "semana" | "em_dia";
}

interface UiState {
  /* Preferências persistidas */
  tema: Tema;
  sidebarRecolhida: boolean;
  filtrosPainel: FiltroIntimacoes;
  filtroEsteira: FiltroEsteira;
  criterioDistribuicao: CriterioDistribuicao;
  scrollPorRota: Record<string, number>;
  rascunhoPrazoManual: Record<string, unknown>;
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
  setCriterioDistribuicao: (criterio: CriterioDistribuicao) => void;
  registrarScroll: (rota: string, posicao: number) => void;
  setRascunhoPrazoManual: (rascunho: Record<string, unknown>) => void;
  limparRascunhoPrazoManual: () => void;
  abrirModal: (nome: string | null) => void;
  abrirPainelLateral: (tipo: string | null, id?: ID | null) => void;
}

const FILTROS_INICIAIS: FiltroIntimacoes = {
  busca: "",
  tribunal: "",
  disponibilizacaoDe: "",
  disponibilizacaoAte: "",
  apenasMinhaPauta: false,
  advogadoId: null,
};

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
      filtroEsteira: { escopo: "geral", urgencia: "todos" },
      criterioDistribuicao: "igualitario",
      scrollPorRota: {},
      rascunhoPrazoManual: {},
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
      setCriterioDistribuicao: (criterioDistribuicao) =>
        set({ criterioDistribuicao }),
      registrarScroll: (rota, posicao) =>
        set({ scrollPorRota: { ...get().scrollPorRota, [rota]: posicao } }),
      setRascunhoPrazoManual: (rascunhoPrazoManual) => set({ rascunhoPrazoManual }),
      limparRascunhoPrazoManual: () => set({ rascunhoPrazoManual: {} }),
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
        criterioDistribuicao: estado.criterioDistribuicao,
        scrollPorRota: estado.scrollPorRota,
        rascunhoPrazoManual: estado.rascunhoPrazoManual,
      }),
    },
  ),
);
