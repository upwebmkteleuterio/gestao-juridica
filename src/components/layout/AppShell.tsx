import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

/** Layout global: sidebar fixa + topbar + área de conteúdo (rotas filhas). */
export function AppShell() {
  const [menuAberto, setMenuAberto] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    setMenuAberto(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar aberta={menuAberto} onFechar={() => setMenuAberto(false)} />
      <div className="lg:pl-[236px]">
        <Topbar onAbrirMenu={() => setMenuAberto(true)} />
        <main className="mx-auto w-full max-w-[1600px] px-5 py-6 sm:px-8 sm:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
