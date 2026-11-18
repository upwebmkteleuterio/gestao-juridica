import { expect, test } from "@playwright/test";
import {
  criarMembroTeste,
  entrar,
  limparProcessoPorNumero,
  removerContaTeste,
  type MembroTeste,
} from "./fixtures/conta-teste";

// O provisionamento do usuário de teste e o login podem ser lentos.
test.describe.configure({ timeout: 180_000 });

/**
 * Numeração livre com 20 dígitos de propósito: é o caso em que o número era
 * exibido com a máscara do CNJ mesmo sendo de outro tipo.
 */
const NUMERO_LIVRE = "1234567890.1234567890";
const CLIENTE = "Simeão da Silva";

let membro: MembroTeste;

test.beforeEach(async ({ page }) => {
  membro = await criarMembroTeste();
  await entrar(page, membro);
});

test.afterEach(async () => {
  await limparProcessoPorNumero(NUMERO_LIVRE);
  await removerContaTeste(membro);
});

test("advogado cadastra prazo manual com numeração livre e o card mostra o número digitado e o cliente", async ({
  page,
}) => {
  await page.goto("/esteira");
  await page.getByRole("button", { name: "Prazo manual", exact: true }).click();

  const modal = page.getByRole("dialog", { name: "Cadastro de prazo manual" });
  await expect(modal).toBeVisible();

  // A equipe escolhe o tipo de numeração, como o gestor faz no painel.
  await modal.locator("#prazo-tipo-numeracao").selectOption("inss");
  await modal.locator("#prazo-cnj").fill(NUMERO_LIVRE);
  await modal.locator("#prazo-cliente").fill(CLIENTE);
  await modal.locator("#prazo-partes").fill("Simeão da Silva x INSS");
  await modal.locator("#prazo-peca").fill("Requerimento administrativo");
  await modal.locator("#prazo-ciencia").fill("2026-11-10");
  await modal.locator("#prazo-dias").fill("15");
  await modal.getByRole("button", { name: "Cadastrar prazo e inserir na fila" }).click();
  await expect(modal).toBeHidden({ timeout: 20_000 });

  const card = page.getByRole("button", {
    name: /Abrir tarefa Requerimento administrativo/,
  });
  await expect(card).toBeVisible();
  await expect(card).toContainText(NUMERO_LIVRE);
  await expect(card).toContainText(CLIENTE);
  await expect(card).toContainText("INSS");
});
