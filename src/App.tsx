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

/* Menu 1 — Painel do Gestor */
import PainelIntimacoes from "./pages/PainelIntimacoes";
import PainelDistribuicao from "./pages/PainelDistribuicao";
import PainelDetalhePublicacao from "./pages/PainelDetalhePublicacao";

/* Menu 2 — Esteira de Prazos */
import EsteiraPrazos from "./pages/EsteiraPrazos";
import EsteiraTarefa from "./pages/EsteiraTarefa";
import EsteiraPrazoManual from "./pages/EsteiraPrazoManual";

/* Menu 3 — Consulta & Captura DJEN */
import DjenMonitor from "./pages/DjenMonitor";
import DjenDisparoConsulta from "./pages/DjenDisparoConsulta";
import DjenPayload from "./pages/DjenPayload";

/* Menu 4 — Advogados & Cargas */
import Equipe from "./pages/Equipe";
import EquipeAdvogado from "./pages/EquipeAdvogado";

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
            {/* Menu 1 — Painel do Gestor */}
            <Route path="/painel" element={<PainelIntimacoes />} />
            <Route
              path="/painel/distribuicao"
              element={<PainelDistribuicao />}
            />
            <Route
              path="/painel/publicacao/:id"
              element={<PainelDetalhePublicacao />}
            />

            {/* Menu 2 — Esteira de Prazos */}
            <Route path="/esteira" element={<EsteiraPrazos />} />
            <Route path="/esteira/tarefa/:id" element={<EsteiraTarefa />} />
            <Route
              path="/esteira/novo-prazo"
              element={<EsteiraPrazoManual />}
            />

            {/* Menu 3 — Consulta & Captura DJEN */}
            <Route path="/djen" element={<DjenMonitor />} />
            <Route
              path="/djen/nova-consulta"
              element={<DjenDisparoConsulta />}
            />
            <Route path="/djen/payload/:id" element={<DjenPayload />} />

            {/* Menu 4 — Advogados & Cargas */}
            <Route path="/equipe" element={<Equipe />} />
            <Route
              path="/equipe/advogado/:id"
              element={<EquipeAdvogado />}
            />

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
