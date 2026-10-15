import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEstadoSessao } from "@/lib/sessao";

export function useSessao() {
  const sessao = useEstadoSessao((estado) => estado.sessao);
  const definida = useEstadoSessao((estado) => estado.definida);
  const motivoSaida = useEstadoSessao((estado) => estado.motivoSaida);
  return { sessao, definida, motivoSaida };
}

export function useUsuarioAtual() {
  const sessao = useEstadoSessao((estado) => estado.sessao);
  if (!sessao) return null;
  const perfil = sessao.user.app_metadata.perfil;
  if (perfil !== "admin" && perfil !== "advogado") return null;
  return { id: sessao.user.id, email: sessao.user.email ?? "", perfil };
}

export function useMeuPerfil() {
  const usuario = useUsuarioAtual();
  return useQuery({
    queryKey: ["meu-perfil", usuario?.id],
    enabled: Boolean(usuario?.id),
    queryFn: async () => {
      if (!usuario) return null;
      const { data, error } = await supabase
        .from("advogados")
        .select("nome_completo, oab_numero, oab_uf")
        .eq("id", usuario.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
