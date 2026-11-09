import { expect, test } from "@playwright/test";
import {
  criarAdminTeste,
  criarIntimacaoTeste,
  entrar,
  gerarNumeroCnj,
  limparMarcoZero,
  mascararCnj,
  removerContaTeste,
  removerIntimacao,
  type ContaTeste,
} from "./fixtures/conta-teste";

/**
 * Data fora do período real de operação: garante que o período usado nas
 * ações em lote atinja apenas o registro criado pelo próprio teste, sem
 * tocar no histórico verdadeiro do escritório.
 */
const DATA_ISOLADA = "2001-01-01";

let conta: ContaTeste;
let intimacaoId: string | null = null;
let numero = "";

test.beforeEach(async ({ page }) => {
  conta = await criarAdminTeste();
  numero = gerarNumeroCnj();
  intimacaoId = await criarIntimacaoTeste({
    numero,
    dataDisponibilizacao: DATA_ISOLADA,
    // Fora da fila de distribuição, para não interferir nos outros cenários.
    status: "dispensado",
  });
  await entrar(page, conta);
});

test.afterEach(async () => {
  if (intimacaoId) await removerIntimacao(intimacaoId);
  await limparMarcoZero();
  await removerContaTeste(conta);
});

test("arquivar e desarquivar publicações por período", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/painel");
  await expect(
    page.getByRole("heading", { name: "Painel de Intimações" }),
  ).toBeVisible({ timeout: 30_000 });

  // O menu de três pontinhos fica ao lado de "Exportar planilha".
  await page.getByRole("button", { name: "Mais ações do painel" }).click();
  await page
    .getByRole("menuitem", { name: "Arquivar publicações do período" })
    .click();

  const modal = page.getByRole("dialog", {
    name: "Arquivar publicações do período",
  });
  await expect(modal).toBeVisible();

  await page.locator("#acao-periodo-inicio").fill(DATA_ISOLADA);
  await page.locator("#acao-periodo-ate").fill(DATA_ISOLADA);

  // A quantidade é contada no banco antes da confirmação.
  await expect(page.getByText("1 publicação será arquivada")).toBeVisible({
    timeout: 30_000,
  });

  await page
    .getByRole("button", { name: "Arquivar publicações", exact: true })
    .click();
  await expect(modal).toBeHidden({ timeout: 30_000 });

  // A publicação arquivada sai da caixa de entrada e aparece na visão própria.
  await page.getByRole("button", { name: "Arquivadas" }).click();
  await page.locator("#filtro-busca").fill(numero);

  const desarquivar = page.getByRole("button", {
    name: `Desarquivar ${mascararCnj(numero)}`,
  });
  await expect(desarquivar).toBeVisible({ timeout: 30_000 });

  await desarquivar.click();
  await expect(desarquivar).toBeHidden({ timeout: 30_000 });
});

test("marco zero recorta o painel e pode ser removido", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/painel");
  await expect(
    page.getByRole("heading", { name: "Painel de Intimações" }),
  ).toBeVisible({ timeout: 30_000 });

  await page.locator("#marco-zero-data").fill("2099-12-31");
  await page.getByRole("checkbox", { name: "Indicadores" }).check();
  await page.getByRole("checkbox", { name: "Lista" }).check();
  await page.getByRole("button", { name: "Aplicar marco" }).click();

  // Com o marco no futuro, nenhuma publicação entra no recorte.
  await expect(page.getByText("Nenhuma intimação encontrada")).toBeVisible({
    timeout: 30_000,
  });

  await page.getByRole("button", { name: "Remover" }).click();

  await expect(page.getByText("Nenhuma intimação encontrada")).toBeHidden({
    timeout: 30_000,
  });
});
