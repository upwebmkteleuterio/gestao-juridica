import type { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSessao, useUsuarioAtual } from "@/hooks";

export function ProtectedRoute({
  children,
  somenteAdmin = false,
}: {
  children?: ReactNode;
  somenteAdmin?: boolean;
}) {
  const { sessao, definida } = useSessao();
  const usuario = useUsuarioAtual();
  const local = useLocation();

  if (!definida) return <div className="min-h-screen bg-background" aria-busy="true" />;
  if (!sessao || !usuario) {
    return <Navigate to="/login" replace state={{ de: local.pathname }} />;
  }
  if (somenteAdmin && usuario.perfil !== "admin") {
    return <Navigate to="/painel" replace />;
  }
  return <>{children ?? <Outlet />}</>;
}
