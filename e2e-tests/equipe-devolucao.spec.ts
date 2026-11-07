import { expect, test } from "@playwright/test";
import {
  criarAdminTeste,
  criarIntimacaoTeste,
  criarMembroTeste,
  criarTarefaTeste,
  entrar,
  gerarNumeroCnj,
  removerContaTeste,
  removerIntimacao,
  type ContaTeste,
  type MembroTeste,
} from "./fixtures/conta-teste";

let conta: ContaTeste;
let membro: MembroTeste;
let numero: string;
let intimacaoId: string;

test.beforeEach(async ({ page }) => {
  conta = await criarAdminTeste();
  membro = await criarMembroTeste({ ativoDistribuicao: true });
  numero = gerarNumeroCnj();
  intimacaoId = await criarIntimacaoTeste({
    numero,
    advogadoId: membro.id,
    status: "fila",
    observacoes: "Aguardando protocolo",
  });
  await criarTarefaTeste({
    numero,
    advogadoId: membro.id,
    etapa: "fila",
    intimacaoId,
  });
  await entrar(page, conta);
});

test.afterEach(async () => {
  await removerIntimacao(intimacaoId);
  await removerContaTeste(membro);
  await removerContaTeste(conta);
});

test("a equipe mostra Gabriel e permite devolver a carga de um advogado", async ({
  page,
}) => {
  await page.goto("/equipe");

  // Gabriel permanece visível na equipe, mesmo fora da distribuição automática.
  await expect(
    page.getByRole("heading", { name: "Gabriel Magalhães" }),
  ).toBeVisible();

  // O advogado de teste aparece com a carga e o botão de devolução.
  await page.getByRole("button", { name: "Devolver 1 ao painel" }).click();

  const confirmacao = page.getByRole("dialog", {
    name: "Devolver as intimações ao painel de gestor?",
  });
  await expect(confirmacao).toBeVisible();
  await confirmacao.getByRole("button", { name: "Devolver ao painel" }).click();

  await expect(
    page.getByText(/publicações devolvidas à triagem/),
  ).toBeVisible();
});
