import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    let ativo = true;
    const codigo = new URLSearchParams(window.location.search).get("code");
    if (!codigo) {
      navigate("/login", { replace: true });
      return;
    }
    void supabase.auth.exchangeCodeForSession(codigo).then(({ error }) => {
      if (!ativo) return;
      navigate(error ? "/login" : "/painel", { replace: true });
    });
    return () => { ativo = false; };
  }, [navigate]);

  return <div className="min-h-screen bg-background" aria-busy="true" />;
}
