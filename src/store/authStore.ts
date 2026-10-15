import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Advogado } from "@/types";

interface AuthState {
  usuario: Advogado | null;
  entrar: (usuario: Advogado) => void;
  sair: () => void;
}

/**
 * Sessão simulada do protótipo. Guarda o usuário logado (admin/advogado)
 * para que a casca de autenticação possa ser trocada por um provedor real.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      usuario: null,
      entrar: (usuario) => set({ usuario }),
      sair: () => set({ usuario: null }),
    }),
    { name: "mg-gestao-juridica:auth" },
  ),
);
