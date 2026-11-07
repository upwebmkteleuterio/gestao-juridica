import { expect, test } from "@playwright/test";
import {
  criarAdminTeste,
  entrar,
  gerarNumeroCnj,
  limparProcessoPorNumero,
  mascararCnj,
  removerContaTeste,
  type ContaTeste,
} from "./fixtures/conta-teste";

let conta: ContaTeste;
let numero: string;

test.beforeEach(async ({ page }) => {
  conta = await criarAdminTeste();
  numero = gerarNumeroCnj();
  await entrar(page, conta);
});

test.afterEach(async () => {
  await limparProcessoPorNumero(numero);
  await removerContaTeste(conta);
});

test("incluir processo manual valida o CNJ, avisa duplicidade e abre o existente", async ({
  page,
}) => {
  const tabela = page.getByRole("table", {
    name: "Intimações capturadas do DJEN",
  });

  // 1) Validação: menos de 20 dígitos é recusado.
  await page.getByRole("button", { name: /Incluir processo/ }).click();
  const modal = page.getByRole("dialog", {
    name: "Incluir processo manualmente",
  });
  await expect(modal).toBeVisible();

  await modal.locator("#novo-processo-cnj").fill("12345");
  await modal.getByRole("button", { name: "Incluir processo" }).click();
  await expect(
    modal.getByText("Informe um número CNJ com 20 dígitos."),
  ).toBeVisible();

  // 2) Inclusão válida com observação.
  await modal.locator("#novo-processo-cnj").fill(numero);
  await modal.locator("#novo-processo-observacoes").fill("Protocolo físico pendente");
  await modal.getByRole("button", { name: "Incluir processo" }).click();
  await expect(modal).toBeHidden();

  await page.locator("#filtro-busca").fill(numero);
  const linha = tabela.locator("tbody tr").first();
  await expect(linha).toContainText(mascararCnj(numero));
  await expect(linha).toContainText("Manual");

  // 3) Repetir o número avisa a duplicidade e leva ao registro existente.
  await page.getByRole("button", { name: /Incluir processo/ }).click();
  const modalDuplicado = page.getByRole("dialog", {
    name: "Incluir processo manualmente",
  });
  await modalDuplicado.locator("#novo-processo-cnj").fill(numero);
  await expect(
    modalDuplicado.getByText("Este número já está na lista"),
  ).toBeVisible();

  await modalDuplicado
    .getByRole("button", { name: "Abrir o registro existente" })
    .click();
  await expect(page).toHaveURL(/\/painel\/publicacao\//);
});
