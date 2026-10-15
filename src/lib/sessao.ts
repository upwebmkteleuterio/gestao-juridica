import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface EstadoSessao {
  sessao: Session | null;
  definida: boolean;
  motivoSaida: "manual" | "expirada" | null;
  definirSessao: (sessao: Session | null) => void;
  marcarSaidaManual: () => void;
  limparSessao: (motivo: "manual" | "expirada") => void;
}

export const useEstadoSessao = create<EstadoSessao>((set) => ({
  sessao: null,
  definida: false,
  motivoSaida: null,
  definirSessao: (sessao) => set({ sessao, definida: true, motivoSaida: null }),
  marcarSaidaManual: () => set({ motivoSaida: "manual" }),
  limparSessao: (motivoSaida) => set({ sessao: null, definida: true, motivoSaida }),
}));

let monitorIniciado = false;
let recuperacaoDeSenhaDetectada = false;

export function houveRecuperacaoDeSenha() {
  return recuperacaoDeSenhaDetectada;
}

export function iniciarMonitorDeSessao() {
  if (monitorIniciado) return;
  monitorIniciado = true;

  void supabase.auth.getSession().then(({ data }) => {
    if (!useEstadoSessao.getState().definida) {
      useEstadoSessao.getState().definirSessao(data.session);
    }
  });

  let renovacaoEmCurso = false;
  supabase.auth.onAuthStateChange((evento, sessao) => {
    const estado = useEstadoSessao.getState();
    if (evento === "PASSWORD_RECOVERY") recuperacaoDeSenhaDetectada = true;
    if (evento === "SIGNED_OUT") {
      if (estado.motivoSaida === "manual") {
        estado.limparSessao("manual");
        return;
      }
      if (renovacaoEmCurso) return;
      renovacaoEmCurso = true;
      window.setTimeout(() => {
        void supabase.auth.refreshSession().then(({ data, error }) => {
          renovacaoEmCurso = false;
          if (error || !data.session) {
            useEstadoSessao.getState().limparSessao("expirada");
          } else {
            useEstadoSessao.getState().definirSessao(data.session);
          }
        });
      }, 0);
      return;
    }
    if (sessao) estado.definirSessao(sessao);
    else if (!estado.definida) estado.definirSessao(null);
  });

  const renovarSeNecessario = () => {
    const sessao = useEstadoSessao.getState().sessao;
    if (!sessao?.expires_at || sessao.expires_at - Date.now() / 1000 >= 60) return;
    void supabase.auth.refreshSession().then(({ data, error }) => {
      if (error || !data.session) {
        useEstadoSessao.getState().limparSessao("expirada");
      } else {
        useEstadoSessao.getState().definirSessao(data.session);
      }
    });
  };
  window.addEventListener("focus", renovarSeNecessario);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") renovarSeNecessario();
  });
}

export function marcarSaidaIntencional() {
  useEstadoSessao.getState().marcarSaidaManual();
}
