import { expect, test, type Page } from "@playwright/test";
import {
  criarAdminTeste,
  entrar,
  limparProcessoPorNumero,
  removerContaTeste,
  type ContaTeste,
} from "./fixtures/conta-teste";

// O provisionamento do usuário de teste e o login podem ser lentos.
test.describe.configure({ timeout: 90_000 });

let conta: ContaTeste;
let numero: string;

/** Número no formato do INSS: livre, com pontos, barra e traço. */
function gerarNumeroLivre(): string {
  const bloco = (tamanho: number) =>
    String(Math.floor(Math.random() * 10 ** tamanho)).padStart(tamanho, "0");
  return `${bloco(4)}.${bloco(6)}/${new Date().getFullYear()}-${bloco(2)}`;
}

test.beforeEach(async ({ page }) => {
  conta = await criarAdminTeste();
  numero = gerarNumeroLivre();
  await entrar(page, conta);
});

test.afterEach(async () => {
  await limparProcessoPorNumero(numero);
  await removerContaTeste(conta);
});

/** Inclui um processo com numeração livre pela própria tela do painel. */
async function incluirProcessoLivre(page: Page): Promise<void> {
  await page.getByRole("button", { name: /Incluir processo/ }).click();
  const modal = page.getByRole("dialog", {
    name: "Incluir processo manualmente",
  });
  await expect(modal).toBeVisible();
  await modal.getByTestId("novo-processo-tipo").selectOption("inss");
  await modal.getByTestId("novo-processo-numero").fill(numero);
  await modal.getByRole("button", { name: "Incluir processo" }).click();
  await expect(modal).toBeHidden();
}

test("numeração livre é guardada como digitada, buscável e filtrável por tipo", async ({
  page,
}) => {
  const tabela = page.getByRole("table", {
    name: "Intimações capturadas do DJEN",
  });
  await incluirProcessoLivre(page);

  const linha = tabela
    .getByRole("row")
    .filter({ hasText: numero })
    .first();

  // O número aparece como foi digitado e com o tipo visível.
  await page.locator("#filtro-busca").fill(numero);
  await expect(linha).toContainText(numero);
  await expect(linha).toContainText("INSS");

  // Buscar sem a pontuação encontra o mesmo registro.
  await page.locator("#filtro-busca").fill(numero.replace(/[^0-9A-Za-z]/g, ""));
  await expect(linha).toContainText(numero);

  // O filtro de tipo isola a numeração livre do padrão CNJ.
  await page.locator("#filtro-busca").fill("");
  await page.getByTestId("filtro-tipo-numeracao").selectOption("inss");
  await expect(linha).toBeVisible();

  await page.getByTestId("filtro-tipo-numeracao").selectOption("cnj");
  await expect(linha).toBeHidden();
});

test("o tipo de numeração pode ser corrigido pelo detalhe da publicação", async ({
  page,
}) => {
  const tabela = page.getByRole("table", {
    name: "Intimações capturadas do DJEN",
  });
  await incluirProcessoLivre(page);

  await page.locator("#filtro-busca").fill(numero);
  const linha = tabela
    .getByRole("row")
    .filter({ hasText: numero })
    .first();
  await expect(linha).toContainText("INSS");

  await linha.getByRole("button", { name: `Abrir detalhes de ${numero}` }).click();
  const painel = page.getByRole("dialog", { name: numero });
  await expect(painel.getByTestId("detalhe-tipo-numeracao")).toHaveValue("inss");

  await painel.getByTestId("detalhe-tipo-numeracao").selectOption("outro");
  await expect(page.getByText("Tipo de numeração atualizado.")).toBeVisible();

  // A correção persiste: ao recarregar o detalhe, o tipo salvo é o novo.
  await page.reload();
  await expect(page.getByTestId("detalhe-tipo-numeracao")).toHaveValue("outro");
});
