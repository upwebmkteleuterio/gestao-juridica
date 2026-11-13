import { expect, test } from "@playwright/test";
import {
  criarAdminTeste,
  criarIntimacaoTeste,
  entrar,
  gerarNumeroCnj,
  limparProcessoPorNumero,
  mascararCnj,
  removerContaTeste,
  type ContaTeste,
} from "./fixtures/conta-teste";

test.describe.configure({ timeout: 90_000 });

let conta: ContaTeste;
let numero: string;

test.beforeEach(async ({ page }) => {
  conta = await criarAdminTeste();
  numero = gerarNumeroCnj();
  const hoje = new Date();
  const dataRecente = hoje.toISOString().slice(0, 10);
  hoje.setUTCDate(hoje.getUTCDate() - 1);
  const dataAnterior = hoje.toISOString().slice(0, 10);
  await criarIntimacaoTeste({ numero, dataDisponibilizacao: dataAnterior });
  await criarIntimacaoTeste({ numero, dataDisponibilizacao: dataRecente });
  await entrar(page, conta);
});

test.afterEach(async () => {
  await limparProcessoPorNumero(numero);
  await removerContaTeste(conta);
});

test("agrupa publicações por processo e lista todas no detalhe", async ({ page }) => {
  const tabela = page.getByRole("table", {
    name: "Intimações capturadas do DJEN",
  });
  await page.locator("#filtro-busca").fill(numero);

  const linha = tabela.getByRole("row").filter({ hasText: mascararCnj(numero) });
  await expect(linha).toHaveCount(1);
  await expect(linha).toContainText("2 publicações");
  await linha.getByRole("button", { name: `Abrir detalhes de ${mascararCnj(numero)}` }).click();

  const painel = page.getByRole("dialog", { name: mascararCnj(numero) });
  await expect(painel.getByTestId("publicacoes-do-processo").locator("li")).toHaveCount(2);
  await expect(painel.getByText("Inclusão manual")).toHaveCount(2);

  await page.getByRole("button", { name: "Fechar painel" }).click();
  await page.getByRole("switch", { name: "Mostrar todas as publicações" }).check();
  await expect(
    tabela.getByRole("row").filter({ hasText: mascararCnj(numero) }),
  ).toHaveCount(2);
});
