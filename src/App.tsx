import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell, ProtectedRoute } from "@/components/layout";
import { useAplicarTema } from "@/hooks";

import Index from "./pages/Index";
import Login from "./pages/Login";
import Styleguide from "./pages/Styleguide";
import NotFound from "./pages/NotFound";

/* Menu 1 — Painel do Gestor (1.1 e 1.2 são modal/painel da Tela 1) */
import PainelIntimacoes from "./pages/PainelIntimacoes";

/* Menu 2 — Esteira de Prazos */
import EsteiraPrazos from "./pages/EsteiraPrazos";

/* Menu 3 — Consulta & Captura DJEN */
import DjenMonitor from "./pages/DjenMonitor";

/* Menu 4 — Advogados & Cargas */
import Equipe from "./pages/Equipe";

/* Menu 5 — Configurações & Chaves IA */
import Configuracoes from "./pages/Configuracoes";
import ConfiguracoesEditar from "./pages/ConfiguracoesEditar";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 15_000,
    },
  },
});

/** Sincroniza a classe de tema (claro/escuro) escolhida pelo usuário. */
function TemaGlobal() {
  useAplicarTema();
  return null;
}

/**
 * O App contém apenas as rotas e o layout global.
 * Nenhuma lógica de tabela, gráfico ou formulário vive aqui.
 */
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <TemaGlobal />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          {/* Playground temporário do UI Kit */}
          <Route path="/styleguide" element={<Styleguide />} />

          {/* Rotas protegidas — Layout Global (Sidebar + Topbar + Outlet) */}
          <Route
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            {/* Menu 1 — Painel do Gestor.
                1.1 (distribuição) e 1.2 (detalhe) são sobreposições da
                Tela 1, então compartilham a rota base e mantêm o contexto. */}
            <Route path="/painel" element={<PainelIntimacoes />} />
            <Route path="/painel/distribuicao" element={<PainelIntimacoes />} />
            <Route
              path="/painel/publicacao/:id"
              element={<PainelIntimacoes />}
            />

            {/* Menu 2 — Esteira de Prazos.
                2.1 (execução/protocolo) e 2.2 (prazo manual) são
                sobreposições da Tela 2, então compartilham a rota base e
                mantêm o contexto do Kanban. */}
            <Route path="/esteira" element={<EsteiraPrazos />} />
            <Route path="/esteira/tarefa/:id" element={<EsteiraPrazos />} />
            <Route path="/esteira/novo-prazo" element={<EsteiraPrazos />} />

            {/* Menu 3 — Consulta & Captura DJEN.
                3.1 (disparo manual) e 3.2 (payload bruto) são sobreposições
                da Tela 3, então compartilham a rota base e mantêm o contexto. */}
            <Route path="/djen" element={<DjenMonitor />} />
            <Route path="/djen/nova-consulta" element={<DjenMonitor />} />
            <Route path="/djen/payload/:id" element={<DjenMonitor />} />

            {/* Menu 4 — Advogados & Cargas.
                4.1 (cadastro/edição) é sobreposição da Tela 4. */}
            <Route path="/equipe" element={<Equipe />} />
            <Route path="/equipe/novo" element={<Equipe />} />
            <Route path="/equipe/advogado/:id" element={<Equipe />} />

            {/* Menu 5 — Configurações & Chaves IA */}
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route
              path="/configuracoes/editar"
              element={<ConfiguracoesEditar />}
            />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
      <Sonner />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
