import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store";

/**
 * Casca de autenticação. Hoje valida a sessão simulada; no produto final
 * basta trocar a origem do usuário por um provedor real.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const usuario = useAuthStore((estado) => estado.usuario);
  const local = useLocation();

  if (!usuario) {
    return <Navigate to="/login" replace state={{ de: local.pathname }} />;
  }

  return <>{children}</>;
}
