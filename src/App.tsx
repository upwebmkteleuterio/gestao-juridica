import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell, ProtectedRoute } from "@/components/layout";
import { useAplicarTema } from "@/hooks";
import Index from "./pages/Index";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import RedefinirSenha from "./pages/RedefinirSenha";
import NotFound from "./pages/NotFound";
import PainelIntimacoes from "./pages/PainelIntimacoes";
import EsteiraPrazos from "./pages/EsteiraPrazos";
import DjenMonitor from "./pages/DjenMonitor";
import Equipe from "./pages/Equipe";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 15_000,
    },
  },
});

function TemaGlobal() {
  useAplicarTema();
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <TemaGlobal />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/redefinir-senha" element={<RedefinirSenha />} />
          <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
            <Route path="/painel" element={<PainelIntimacoes />} />
            <Route path="/painel/distribuicao" element={<PainelIntimacoes />} />
            <Route path="/painel/publicacao/:id" element={<PainelIntimacoes />} />
            <Route path="/esteira" element={<EsteiraPrazos />} />
            <Route path="/esteira/tarefa/:id" element={<EsteiraPrazos />} />
            <Route path="/esteira/novo-prazo" element={<EsteiraPrazos />} />
            <Route element={<ProtectedRoute somenteAdmin />}>
              <Route path="/djen" element={<DjenMonitor />} />
              <Route path="/djen/nova-consulta" element={<DjenMonitor />} />
              <Route path="/djen/payload/:id" element={<DjenMonitor />} />
              <Route path="/equipe" element={<Equipe />} />
              <Route path="/equipe/novo" element={<Equipe />} />
              <Route path="/equipe/advogado/:id" element={<Equipe />} />
            </Route>
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
