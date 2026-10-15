import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const responder = (status: number, corpo: Record<string, unknown>) =>
  new Response(JSON.stringify(corpo), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const erro = (status: number, codigo: string, mensagem: string, detalhe?: unknown) =>
  responder(status, { ok: false, codigo, mensagem, ...(detalhe === undefined ? {} : { detalhe }) });

const emailValido = (valor: unknown): valor is string =>
  typeof valor === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim());

function conflitoBanco(error: { code?: string; message?: string }) {
  if (error.code === "23505") {
    if (error.message?.includes("advogados_oab_unico")) {
      return erro(409, "oab_em_uso", "Já existe um advogado com esta inscrição na OAB/UF.");
    }
    return erro(409, "email_em_uso", "Já existe um usuário com este e-mail.");
  }
  return null;
}

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("", { status: 204, headers: corsHeaders });
  if (request.method !== "POST") return erro(405, "metodo_invalido", "Método não permitido.");

  const authorization = request.headers.get("Authorization");
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return erro(401, "nao_autenticado", "Sessão não informada.");

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceRoleKey) {
    console.error("[gerenciar-equipe] Configuração do Supabase ausente.");
    return erro(500, "erro_interno", "Não foi possível concluir a operação.");
  }

  const autenticacao = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: usuarioAutenticado, error: erroAutenticacao } = await autenticacao.auth.getUser();
  if (erroAutenticacao || !usuarioAutenticado.user) {
    return erro(401, "nao_autenticado", "Sessão inválida ou expirada.");
  }
  const atorId = usuarioAutenticado.user.id;
  const admin = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: perfilAtor, error: erroPerfil } = await admin
    .from("advogados").select("perfil").eq("id", atorId).maybeSingle();
  if (erroPerfil) {
    console.error("[gerenciar-equipe] Falha ao consultar perfil do chamador.");
    return erro(500, "erro_interno", "Não foi possível validar a autorização.");
  }
  if (perfilAtor?.perfil !== "admin") {
    return erro(403, "nao_autorizado", "Apenas o administrador pode gerenciar a equipe.");
  }

  let corpo: Record<string, unknown>;
  try {
    const valor: unknown = await request.json();
    if (!valor || typeof valor !== "object" || Array.isArray(valor)) throw new Error("invalid");
    corpo = valor as Record<string, unknown>;
  } catch {
    return erro(400, "corpo_invalido", "Informe os dados da operação.");
  }

  const registrar = async (entidadeId: string, acao: string, antes: unknown, depois: unknown) => {
    const { error: erroAuditoria } = await admin.from("eventos_auditoria").insert({
      ator_id: atorId,
      entidade: "advogado",
      entidade_id: entidadeId,
      acao,
      antes: antes === null ? null : JSON.stringify(antes),
      depois: depois === null ? null : JSON.stringify(depois),
    });
    if (erroAuditoria) console.error("[gerenciar-equipe] Falha ao registrar auditoria.");
    return !erroAuditoria;
  };

  const listarUsuarios = async () => {
    const { data, error: erroLista } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (erroLista) return { error: erroLista, users: [] };
    return { error: null, users: data.users };
  };

  const usuarioPodeEntrar = (usuario: { banned_until?: string | null }) =>
    !usuario.banned_until || new Date(usuario.banned_until) <= new Date();

  const alterarAcesso = async (id: string, podeEntrar: boolean, auditar = true) => {
    if (!podeEntrar && id === atorId) {
      return erro(409, "nao_pode_bloquear_a_si", "Você não pode bloquear o próprio acesso.");
    }
    const { data: alvo, error: erroAlvo } = await admin.from("advogados")
      .select("id, perfil").eq("id", id).maybeSingle();
    if (erroAlvo || !alvo) return erro(400, "advogado_nao_encontrado", "Advogado não encontrado.");

    const { users, error: erroLista } = await listarUsuarios();
    if (erroLista) {
      console.error("[gerenciar-equipe] Falha ao consultar usuários do Auth.");
      return erro(500, "erro_interno", "Não foi possível consultar o acesso da equipe.");
    }
    const usuarioAlvo = users.find((usuario) => usuario.id === id);
    if (!usuarioAlvo) return erro(400, "advogado_nao_encontrado", "Usuário de autenticação não encontrado.");
    if (!podeEntrar && alvo.perfil === "admin" && usuarioPodeEntrar(usuarioAlvo)) {
      const { data: admins, error: erroAdmins } = await admin.from("advogados")
        .select("id").eq("perfil", "admin");
      if (erroAdmins) return erro(500, "erro_interno", "Não foi possível validar os administradores.");
      const ativos = (admins ?? []).filter((item) => {
        const usuario = users.find((candidato) => candidato.id === item.id);
        return usuario && usuarioPodeEntrar(usuario);
      });
      if (ativos.length <= 1) {
        return erro(409, "ultimo_admin_com_acesso", "Não é possível bloquear o último administrador com acesso liberado.");
      }
    }

    const { error: erroAuth } = await admin.auth.admin.updateUserById(id, {
      ban_duration: podeEntrar ? "none" : "876000h",
    });
    if (erroAuth) {
      console.error("[gerenciar-equipe] Falha ao atualizar acesso no Auth.");
      return erro(400, "falha_acesso", "Não foi possível alterar o acesso do profissional.");
    }
    const atual = { pode_entrar: usuarioPodeEntrar(usuarioAlvo), banido_ate: usuarioAlvo.banned_until ?? null };
    const depois = { pode_entrar: podeEntrar, banido_ate: podeEntrar ? null : "876000h" };
    if (auditar && !(await registrar(id, "definir_acesso", atual, depois))) {
      return erro(500, "falha_auditoria", "O acesso foi alterado, mas não foi possível registrar a auditoria.");
    }
    return responder(200, { ok: true, dados: { id, pode_entrar } });
  };

  try {
    switch (corpo.acao) {
      case "criar": {
        const nome = typeof corpo.nome_completo === "string" ? corpo.nome_completo.trim() : "";
        const email = typeof corpo.email_corporativo === "string" ? corpo.email_corporativo.trim() : "";
        const numero = typeof corpo.oab_numero === "string" ? corpo.oab_numero.trim() : "";
        const uf = typeof corpo.oab_uf === "string" ? corpo.oab_uf.trim().toUpperCase() : "";
        const perfil = corpo.perfil;
        if (!nome || !emailValido(email) || !numero || !/^[A-Z]{2}$/.test(uf) ||
            (perfil !== "admin" && perfil !== "advogado") || typeof corpo.ativo_distribuicao !== "boolean" ||
            typeof corpo.pode_entrar !== "boolean" || typeof corpo.senha !== "string" || corpo.senha.length < 8) {
          return erro(400, "dados_invalidos", "Informe nome, e-mail válido, inscrição OAB/UF, perfil, controles e senha com ao menos 8 caracteres.");
        }
        const { data: criado, error: erroCriacao } = await admin.auth.admin.createUser({
          email,
          password: corpo.senha,
          email_confirm: true,
          app_metadata: { perfil },
          user_metadata: { nome_completo: nome },
        });
        if (erroCriacao || !criado.user) {
          if (erroCriacao?.message.toLowerCase().includes("already") || erroCriacao?.message.toLowerCase().includes("exists")) {
            return erro(409, "email_em_uso", "Já existe um usuário com este e-mail.");
          }
          console.error("[gerenciar-equipe] Falha ao criar usuário de autenticação.");
          return erro(400, "falha_criacao", "Não foi possível criar o usuário. Verifique os dados informados.");
        }
        const id = criado.user.id;
        const { error: erroAtualizacao } = await admin.from("advogados").update({
          nome_completo: nome,
          email_corporativo: email,
          oab_numero: numero,
          oab_uf: uf,
          perfil,
          ativo_distribuicao: corpo.ativo_distribuicao,
          cargo: typeof corpo.cargo === "string" && corpo.cargo.trim() ? corpo.cargo.trim() : null,
          data_ingresso: typeof corpo.data_ingresso === "string" && corpo.data_ingresso ? corpo.data_ingresso : null,
        }).eq("id", id);
        if (erroAtualizacao) {
          await admin.auth.admin.deleteUser(id);
          const conflito = conflitoBanco(erroAtualizacao);
          if (conflito) return conflito;
          console.error("[gerenciar-equipe] Falha ao completar o cadastro da equipe.");
          return erro(500, "falha_cadastro", "Não foi possível concluir o cadastro do profissional.");
        }
        if (corpo.pode_entrar === false) {
          const acesso = await alterarAcesso(id, false);
          if (acesso.status !== 200) {
            await admin.auth.admin.deleteUser(id);
            return acesso;
          }
        }
        if (!(await registrar(id, "criar", null, { nome_completo: nome, email_corporativo: email, oab_numero: numero, oab_uf: uf, perfil }))) {
          return erro(500, "falha_auditoria", "O profissional foi cadastrado, mas não foi possível registrar a auditoria.");
        }
        return responder(200, { ok: true, dados: { id } });
      }
      case "atualizar": {
        const id = typeof corpo.id === "string" ? corpo.id : "";
        const nome = typeof corpo.nome_completo === "string" ? corpo.nome_completo.trim() : "";
        const email = typeof corpo.email_corporativo === "string" ? corpo.email_corporativo.trim() : "";
        const numero = typeof corpo.oab_numero === "string" ? corpo.oab_numero.trim() : "";
        const uf = typeof corpo.oab_uf === "string" ? corpo.oab_uf.trim().toUpperCase() : "";
        const perfil = corpo.perfil;
        if (!id || !nome || !emailValido(email) || !numero || !/^[A-Z]{2}$/.test(uf) ||
            (perfil !== "admin" && perfil !== "advogado") || typeof corpo.ativo_distribuicao !== "boolean") {
          return erro(400, "dados_invalidos", "Informe os dados obrigatórios do profissional e uma OAB/UF válida.");
        }
        const { data: antes, error: erroLeitura } = await admin.from("advogados")
          .select("*").eq("id", id).maybeSingle();
        if (erroLeitura || !antes) return erro(400, "advogado_nao_encontrado", "Advogado não encontrado.");
        const { data: authAlvo, error: erroAuthAlvo } = await admin.auth.admin.getUserById(id);
        if (erroAuthAlvo || !authAlvo.user) return erro(400, "advogado_nao_encontrado", "Usuário de autenticação não encontrado.");
        const patchAuth: Record<string, unknown> = {};
        if (authAlvo.user.email?.toLowerCase() !== email.toLowerCase()) {
          patchAuth.email = email;
          patchAuth.email_confirm = true;
        }
        if (antes.perfil !== perfil) {
          patchAuth.app_metadata = { ...authAlvo.user.app_metadata, perfil };
        }
        if (Object.keys(patchAuth).length) {
          const { error: erroAtualizarAuth } = await admin.auth.admin.updateUserById(id, patchAuth);
          if (erroAtualizarAuth) {
            if (erroAtualizarAuth.message.toLowerCase().includes("already") || erroAtualizarAuth.message.toLowerCase().includes("exists")) {
              return erro(409, "email_em_uso", "Já existe um usuário com este e-mail.");
            }
            console.error("[gerenciar-equipe] Falha ao atualizar dados do Auth.");
            return erro(400, "falha_atualizacao_auth", "Não foi possível atualizar os dados de autenticação.");
          }
        }
        const depois = {
          nome_completo: nome, email_corporativo: email, oab_numero: numero, oab_uf: uf,
          perfil, ativo_distribuicao: corpo.ativo_distribuicao,
          cargo: typeof corpo.cargo === "string" && corpo.cargo.trim() ? corpo.cargo.trim() : null,
          data_ingresso: typeof corpo.data_ingresso === "string" && corpo.data_ingresso ? corpo.data_ingresso : null,
        };
        const { error: erroAtualizacao } = await admin.from("advogados").update(depois).eq("id", id);
        if (erroAtualizacao) {
          const conflito = conflitoBanco(erroAtualizacao);
          if (conflito) return conflito;
          console.error("[gerenciar-equipe] Falha ao atualizar o cadastro da equipe.");
          return erro(500, "falha_atualizacao", "Não foi possível atualizar o profissional.");
        }
        if (!(await registrar(id, "atualizar", antes, depois))) return erro(500, "falha_auditoria", "Os dados foram atualizados, mas não foi possível registrar a auditoria.");
        return responder(200, { ok: true, dados: { id } });
      }
      case "definir_acesso": {
        const id = typeof corpo.id === "string" ? corpo.id : "";
        if (!id || typeof corpo.pode_entrar !== "boolean") return erro(400, "dados_invalidos", "Informe o profissional e o estado de acesso.");
        return await alterarAcesso(id, corpo.pode_entrar);
      }
      case "excluir": {
        const id = typeof corpo.id === "string" ? corpo.id : "";
        if (!id) return erro(400, "dados_invalidos", "Informe o profissional a excluir.");
        if (id === atorId) return erro(409, "nao_pode_excluir_a_si", "Você não pode excluir o próprio usuário.");
        const { data: alvo, error: erroAlvo } = await admin.from("advogados")
          .select("id, perfil").eq("id", id).maybeSingle();
        if (erroAlvo || !alvo) return erro(400, "advogado_nao_encontrado", "Advogado não encontrado.");
        if (alvo.perfil === "admin") {
          const { data: admins, error: erroAdmins } = await admin.from("advogados").select("id").eq("perfil", "admin");
          if (erroAdmins) return erro(500, "erro_interno", "Não foi possível validar os administradores.");
          if ((admins ?? []).length <= 1) return erro(409, "ultimo_admin", "Não é possível excluir o último administrador.");
        }
        const { count, error: erroPrazos } = await admin.from("tarefas_prazos")
          .select("id", { count: "exact", head: true }).eq("advogado_id", id);
        if (erroPrazos) return erro(500, "erro_interno", "Não foi possível verificar o histórico de prazos.");
        if ((count ?? 0) > 0) {
          return erro(409, "prazos_em_aberto", `Este profissional tem ${count} prazo(s) no histórico. Desabilite o acesso em vez de excluir, para preservar o histórico.`, { quantidade: count });
        }
        const { data: antes, error: erroDados } = await admin.from("advogados").select("*").eq("id", id).maybeSingle();
        if (erroDados || !antes) return erro(400, "advogado_nao_encontrado", "Advogado não encontrado.");
        if (!(await registrar(id, "excluir", antes, null))) return erro(500, "falha_auditoria", "Não foi possível registrar a auditoria; o profissional não foi excluído.");
        const { error: erroExclusao } = await admin.auth.admin.deleteUser(id);
        if (erroExclusao) {
          console.error("[gerenciar-equipe] Falha ao excluir usuário de autenticação.");
          return erro(500, "falha_exclusao", "Não foi possível excluir o profissional.");
        }
        return responder(200, { ok: true, dados: { id } });
      }
      case "listar_acesso": {
        const { users, error: erroLista } = await listarUsuarios();
        if (erroLista) {
          console.error("[gerenciar-equipe] Falha ao listar o acesso da equipe.");
          return erro(500, "erro_interno", "Não foi possível consultar o acesso da equipe.");
        }
        return responder(200, { ok: true, dados: users.map((usuario) => ({
          id: usuario.id,
          email: usuario.email ?? "",
          pode_entrar: usuarioPodeEntrar(usuario),
          banido_ate: usuario.banned_until ?? null,
        })) });
      }
      default:
        return erro(400, "acao_invalida", "Ação de equipe inválida.");
    }
  } catch (cause) {
    console.error("[gerenciar-equipe] Erro inesperado ao processar operação.", cause instanceof Error ? cause.message : "erro desconhecido");
    return erro(500, "erro_interno", "Não foi possível concluir a operação.");
  }
});
