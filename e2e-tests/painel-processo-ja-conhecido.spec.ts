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

// O provisionamento do usuário de teste e o login podem ser lentos.
test.describe.configure({ timeout: 90_000 });

let conta: ContaTeste;
let numero: string;

test.beforeEach(async ({ page }) => {
  conta = await criarAdminTeste();
  numero = gerarNumeroCnj();
  // Primeira publicação do processo: para o escritório, é um processo novo.
  await criarIntimacaoTeste({ numero, dataDisponibilizacao: "2026-10-20" });
  await entrar(page, conta);
});

test.afterEach(async () => {
  await limparProcessoPorNumero(numero);
  await removerContaTeste(conta);
});

test("publicação nova de um processo já conhecido é sinalizada na lista", async ({
  page,
}) => {
  const tabela = page.getByRole("table", {
    name: "Intimações capturadas do DJEN",
  });
  await page.locator("#filtro-busca").fill(numero);

  // Com uma única publicação, o processo é novo: nada de "Já existia".
  const linha = tabela.getByRole("row").filter({ hasText: mascararCnj(numero) });
  await expect(linha).toHaveCount(1);
  await expect(linha).not.toContainText("Já existia");

  // Chega uma publicação posterior do mesmo processo, como faz o DJEN.
  await criarIntimacaoTeste({ numero, dataDisponibilizacao: "2026-11-13" });
  await page.reload();
  await page.locator("#filtro-busca").fill(numero);

  const linhaAtualizada = tabela
    .getByRole("row")
    .filter({ hasText: mascararCnj(numero) })
    .first();
  await expect(linhaAtualizada).toContainText("2 publicações");
  await expect(linhaAtualizada).toContainText("Já existia");
});
