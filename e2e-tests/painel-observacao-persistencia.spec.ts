import { expect, test } from "@playwright/test";
import {
  criarAdminTeste,
  criarIntimacaoTeste,
  entrar,
  gerarNumeroCnj,
  limparProcessoPorNumero,
  removerContaTeste,
  type ContaTeste,
} from "./fixtures/conta-teste";

// O provisionamento do usuário de teste e o login podem ser lentos.
test.describe.configure({ timeout: 90_000 });

let conta: ContaTeste;
let numero: string;

test.beforeEach(async ({ page }) => {
  conta = await criarAdminTeste();
  numero = gerarNumeroCnj();
  await criarIntimacaoTeste({ numero });
  await entrar(page, conta);
});

test.afterEach(async () => {
  await limparProcessoPorNumero(numero);
  await removerContaTeste(conta);
});

test("a observação digitada na lista é persistida no registro", async ({
  page,
}) => {
  const tabela = page.getByRole("table", {
    name: "Intimações capturadas do DJEN",
  });

  await page.locator("#filtro-busca").fill(numero);
  const linha = tabela.locator("tbody tr").first();
  await expect(linha).toContainText("Manual");

  const texto = "Documento original com a sócia";
  await linha.getByRole("button", { name: "Escrever observação" }).click();
  const campo = linha.getByLabel("Editar observação");
  await campo.pressSequentially(texto, { delay: 10 });
  await expect(campo).toHaveValue(texto);

  const [patch] = await Promise.all([
    page.waitForResponse(
      (resposta) =>
        resposta.url().includes("/rest/v1/intimacoes") &&
        resposta.request().method() === "PATCH",
      { timeout: 20_000 },
    ),
    campo.press("Enter"),
  ]);
  expect(patch.ok()).toBeTruthy();

  // Confirma a persistência lendo o registro novamente após recarregar.
  await page.reload();
  await page.locator("#filtro-busca").fill(numero);
  await expect(tabela.locator("tbody tr").first()).toContainText(texto);
});
