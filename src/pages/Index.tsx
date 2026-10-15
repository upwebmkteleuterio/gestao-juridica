import { Navigate } from "react-router-dom";

/**
 * Página padrão do app. A porta de entrada é a tela de login simulada;
 * depois de autenticado o usuário cai no Painel do gestor.
 */
const Index = () => <Navigate to="/painel" replace />;

export default Index;
