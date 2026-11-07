import { expect, test } from "@playwright/test";
import {
  criarAdminTeste,
  entrar,
  removerContaTeste,
  type ContaTeste,
} from "./fixtures/conta-teste";

const MASCARA_CNJ = /^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/;

let conta: ContaTeste;

test.beforeEach(async ({ page }) => {
  conta = await criarAdminTeste();
  await entrar(page, conta);
});

test.afterEach(async () => {
  await removerContaTeste(conta);
});

test("painel mostra números no padrão CNJ e busca aceita o número pontuado", async ({
  page,
}) => {
  await expect(
    page.getByRole("heading", { name: "Painel de Intimações" }),
  ).toBeVisible();

  const tabela = page.getByRole("table", {
    name: "Intimações capturadas do DJEN",
  });
  await expect(tabela).toBeVisible();

  const primeiraLinha = tabela.locator("tbody tr").first();
  const numeroNaLinha = primeiraLinha.locator("td").nth(1).locator("strong");
  const numeroVisivel = (await numeroNaLinha.innerText()).trim();

  // O número completo é exibido com a máscara CNJ (0000000-00.0000.0.00.0000).
  expect(numeroVisivel).toMatch(MASCARA_CNJ);

  // Buscar pelo número pontuado encontra o mesmo registro.
  await page.locator("#filtro-busca").fill(numeroVisivel);
  await expect(tabela.locator("tbody tr").first().locator("td").nth(1).locator("strong")).toHaveText(
    numeroVisivel,
  );
});
