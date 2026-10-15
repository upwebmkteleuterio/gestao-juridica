import { Navigate } from "react-router-dom";

/**
 * Página padrão do app. A porta de entrada é a tela de login; o
 * ProtectedRoute encaminha quem não tem sessão para /login.
 */
const Index = () => <Navigate to="/painel" replace />;

export default Index;
