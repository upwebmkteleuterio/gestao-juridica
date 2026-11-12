import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { expect, type Page } from "@playwright/test";
import { normalizarNumero } from "../../src/lib/numeracao";

/**
 * Fixtures para os testes ponta a ponta do sistema Magalhães & Gomes.
 *
 * O app exige que o usuário autenticado tenha `app_metadata.perfil` = "admin"
 * ou "advogado". O usuário padrão provisionado pelo Dyad entra como "advogado",
 * então, para exercitar os fluxos exclusivos do gestor (inclusão manual,
 * distribuição e equipe), cada caso cria o próprio administrador de teste.
 *
 * O cliente administrativo roda SOMENTE no processo Node do Playwright, usando
 * as credenciais de serviço injetadas pelo Dyad. Ele nunca é enviado ao browser.
 */

export interface ContaTeste {
  id: string;
  email: string;
  senha: string;
}

export interface MembroTeste extends ContaTeste {
  nome: string;
}

function clienteAdmin(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const chave = process.env.SUPABASE_SECRET_KEY;
  if (!url || !chave) {
    throw new Error(
      "SUPABASE_URL e SUPABASE_SECRET_KEY não estão disponíveis no processo de teste.",
    );
  }
  return createClient(url, chave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function sufixo(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Falha rápido (com o rótulo da operação) quando uma chamada ao Supabase
 * demora demais, em vez de travar o hook de preparação inteiro.
 */
async function comTimeout<T>(
  promessa: PromiseLike<T>,
  rotulo: string,
  ms = 15_000,
): Promise<T> {
  let temporizador: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promessa,
      new Promise<never>((_, rejeitar) => {
        temporizador = setTimeout(
          () => rejeitar(new Error(`Tempo esgotado (${ms}ms) em: ${rotulo}`)),
          ms,
        );
      }),
    ]);
  } finally {
    if (temporizador) clearTimeout(temporizador);
  }
}

/** Cria um usuário de teste já promovido a administrador. */
export async function criarAdminTeste(nome = "Admin Teste"): Promise<ContaTeste> {
  const supabase = clienteAdmin();
  const email = `teste-${sufixo()}@magalhaesgomes.adv.br`;
  const senha = `Teste!${sufixo()}Aa1`;

  const { data, error } = await comTimeout(
    supabase.auth.admin.createUser({ email, password: senha, email_confirm: true }),
    "auth.admin.createUser (admin de teste)",
  );
  if (error || !data.user) {
    throw new Error(
      `Falha ao criar usuário de teste: ${error?.message ?? "sem usuário retornado"}`,
    );
  }
  const id = data.user.id;

  // O trigger handle_new_user cria a linha em advogados como "advogado".
  // Promover para "admin" dispara a sincronização do perfil no token.
  const { error: erroPerfil } = await comTimeout(
    supabase
      .from("advogados")
      .update({ perfil: "admin", nome_completo: `${nome} ${sufixo()}` })
      .eq("id", id),
    "update advogados (promover admin)",
  );
  if (erroPerfil) {
    await supabase.auth.admin.deleteUser(id);
    throw new Error(`Falha ao promover o usuário de teste: ${erroPerfil.message}`);
  }

  return { id, email, senha };
}

/** Cria um advogado de teste (aparece na distribuição quando ativo). */
export async function criarMembroTeste(
  opcoes: { ativoDistribuicao?: boolean } = {},
): Promise<MembroTeste> {
  const supabase = clienteAdmin();
  const email = `teste-${sufixo()}@magalhaesgomes.adv.br`;
  const senha = `Teste!${sufixo()}Aa1`;
  const nome = `Advogado Teste ${sufixo()}`;

  const { data, error } = await comTimeout(
    supabase.auth.admin.createUser({ email, password: senha, email_confirm: true }),
    "auth.admin.createUser (advogado de teste)",
  );
  if (error || !data.user) {
    throw new Error(
      `Falha ao criar advogado de teste: ${error?.message ?? "sem usuário retornado"}`,
    );
  }
  const id = data.user.id;

  const { error: erroPerfil } = await comTimeout(
    supabase
      .from("advogados")
      .update({
        nome_completo: nome,
        ativo_distribuicao: opcoes.ativoDistribuicao ?? true,
        oculto_da_equipe: false,
      })
      .eq("id", id),
    "update advogados (advogado de teste)",
  );
  if (erroPerfil) {
    await supabase.auth.admin.deleteUser(id);
    throw new Error(`Falha ao preparar o advogado de teste: ${erroPerfil.message}`);
  }

  return { id, email, senha, nome };
}

/** Insere uma intimação de apoio (pré-requisito) e devolve o id. */
export async function criarIntimacaoTeste(input: {
  numero: string;
  advogadoId?: string | null;
  status?: "triagem" | "fila" | "dispensado";
  observacoes?: string | null;
  /**
   * Data de disponibilização do registro de apoio. Datas fora do período real
   * de operação isolam o registro nas ações em lote por período.
   */
  dataDisponibilizacao?: string | null;
}): Promise<string> {
  const supabase = clienteAdmin();
  const { data, error } = await comTimeout(
    supabase
      .from("intimacoes")
      .insert({
        numero_processo: input.numero.replace(/\D/g, ""),
        origem: "manual",
        status_fluxo: input.status ?? "triagem",
        advogado_id: input.advogadoId ?? null,
        observacoes: input.observacoes ?? null,
        data_disponibilizacao: input.dataDisponibilizacao ?? null,
        tribunal_sigla: "",
        orgao_julgador: "",
        acao_sugerida_ia: "",
        resumo_ia: "",
        trecho_fundamentador: "",
        pendencias: [],
        status_analise: "pendente",
      })
      .select("id")
      .single(),
    "insert intimacoes (dados de teste)",
  );
  if (error || !data) {
    throw new Error(`Falha ao criar intimação de teste: ${error?.message ?? "sem id"}`);
  }
  return data.id;
}

/** Insere uma tarefa de apoio na esteira e devolve o id. */
export async function criarTarefaTeste(input: {
  numero: string;
  advogadoId: string;
  etapa?: "fila" | "redacao" | "revisao" | "pronto_protocolo" | "concluido";
  tipoPeca?: string;
  intimacaoId?: string | null;
}): Promise<string> {
  const supabase = clienteAdmin();
  const { data, error } = await comTimeout(
    supabase
      .from("tarefas_prazos")
      .insert({
        origem: "manual",
        intimacao_id: input.intimacaoId ?? null,
        advogado_id: input.advogadoId,
        numero_processo: input.numero.replace(/\D/g, ""),
        tipo_peca: input.tipoPeca ?? "Verificar andamento do processo",
        etapa_kanban: input.etapa ?? "fila",
      })
      .select("id")
      .single(),
    "insert tarefas_prazos (dados de teste)",
  );
  if (error || !data) {
    throw new Error(`Falha ao criar tarefa de teste: ${error?.message ?? "sem id"}`);
  }
  return data.id;
}

/** Remove o usuário de teste (e, em cascata, o cadastro em advogados). */
export async function removerContaTeste(
  conta: ContaTeste | null | undefined,
): Promise<void> {
  if (!conta) return;
  const supabase = clienteAdmin();
  const { error } = await supabase.auth.admin.deleteUser(conta.id);
  if (error) throw new Error(`Falha ao remover o usuário de teste: ${error.message}`);
}

/** Autentica pela própria tela de login do app. */
export async function entrar(page: Page, conta: ContaTeste): Promise<void> {
  await page.goto("/login");
  // Na prévia o navegador é compartilhado entre os casos: uma sessão anterior
  // faria a tela de login redirecionar e o formulário nunca apareceria.
  await page.evaluate(() => {
    try {
      window.localStorage.clear();
    } catch {
      /* sem acesso ao storage — segue o fluxo normal */
    }
  });
  await page.goto("/login");
  await expect(
    page.locator("#login-email"),
    "o formulário de login deve aparecer",
  ).toBeVisible({ timeout: 20_000 });
  await page.locator("#login-email").fill(conta.email);
  await page.locator("#login-senha").fill(conta.senha);
  await page.getByRole("button", { name: /Entrar no sistema/i }).click();
  await Promise.race([
    page.waitForURL("**/painel", { timeout: 45_000 }),
    page
      .getByText(/Muitas tentativas|E-mail ou senha inválidos|Não foi possível entrar/)
      .waitFor({ timeout: 45_000 })
      .then(() => {
        throw new Error(
          "O Supabase recusou o login (provável limite de tentativas).",
        );
      }),
  ]);
}

/** Gera um número CNJ de 20 dígitos, improvável de colidir com dados reais. */
export function gerarNumeroCnj(): string {
  return Array.from({ length: 20 }, () => Math.floor(Math.random() * 10)).join("");
}

/** Formata um número CNJ no padrão de exibição do app. */
export function mascararCnj(numero: string): string {
  const digitos = numero.replace(/\D/g, "").slice(0, 20);
  const blocos = [
    digitos.slice(0, 7),
    digitos.slice(7, 9),
    digitos.slice(9, 13),
    digitos.slice(13, 14),
    digitos.slice(14, 16),
    digitos.slice(16, 20),
  ];
  let saida = blocos[0];
  if (blocos[1]) saida += `-${blocos[1]}`;
  if (blocos[2]) saida += `.${blocos[2]}`;
  if (blocos[3]) saida += `.${blocos[3]}`;
  if (blocos[4]) saida += `.${blocos[4]}`;
  if (blocos[5]) saida += `.${blocos[5]}`;
  return saida;
}

/**
 * Remove um processo de teste e as tarefas associadas (limpeza de dados).
 * As intimações saem pelo número normalizado, o que funciona tanto para o
 * padrão CNJ quanto para a numeração livre (INSS, inquérito etc.).
 */
export async function limparProcessoPorNumero(numero: string): Promise<void> {
  const supabase = clienteAdmin();
  const digitos = numero.replace(/\D/g, "");
  await supabase
    .from("tarefas_prazos")
    .delete()
    .in("numero_processo", Array.from(new Set([digitos, numero])));
  await supabase
    .from("intimacoes")
    .delete()
    .eq("numero_processo_normalizado", normalizarNumero(numero));
}

/** Remove uma intimação de apoio pelo id. */
export async function removerIntimacao(id: string): Promise<void> {
  const supabase = clienteAdmin();
  await supabase.from("tarefas_prazos").delete().eq("intimacao_id", id);
  await supabase.from("intimacoes").delete().eq("id", id);
}

/**
 * Devolve o marco zero ao estado neutro. É uma configuração compartilhada:
 * os testes que a alteram precisam restaurá-la mesmo em caso de falha.
 */
export async function limparMarcoZero(): Promise<void> {
  const supabase = clienteAdmin();
  const { error } = await supabase
    .from("configuracoes_sistema")
    .update({
      marco_zero: null,
      marco_zero_indicadores: false,
      marco_zero_lista: false,
      marco_zero_exportacao: false,
    })
    .eq("id", 1);
  if (error) throw new Error(`Falha ao limpar o marco zero: ${error.message}`);
}
