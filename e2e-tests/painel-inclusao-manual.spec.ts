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

  await page.getByRole("button", { name: /Incluir processo/ }).click();
  const modal = page.getByRole("dialog", {
    name: "Incluir processo manualmente",
  });
  await expect(modal).toBeVisible();

  // 0) O tipo de numeração é obrigatório e começa sem seleção.
  await modal.getByRole("button", { name: "Incluir processo" }).click();
  await expect(modal.getByText("Escolha o tipo de numeração.")).toBeVisible();

  // 1) Validação: no padrão CNJ, menos de 20 dígitos é recusado.
  await modal.getByTestId("novo-processo-tipo").selectOption("cnj");
  await modal.getByTestId("novo-processo-numero").fill("12345");
  await modal.getByRole("button", { name: "Incluir processo" }).click();
  await expect(
    modal.getByText("Informe um número CNJ com 20 dígitos."),
  ).toBeVisible();

  // 2) Inclusão válida com observação.
  await modal.getByTestId("novo-processo-numero").fill(numero);
  await modal.locator("#novo-processo-observacoes").fill("Protocolo físico pendente");
  await modal.getByRole("button", { name: "Incluir processo" }).click();
  await expect(page.getByText("Processo incluído no painel.")).toBeVisible({
    timeout: 10_000,
  });
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
  await modalDuplicado.getByTestId("novo-processo-tipo").selectOption("cnj");
  await modalDuplicado.getByTestId("novo-processo-numero").fill(numero);
  await expect(
    modalDuplicado.getByText("Este número já está na lista"),
  ).toBeVisible();

  await modalDuplicado
    .getByRole("button", { name: "Abrir o registro existente" })
    .click();
  await expect(page).toHaveURL(/\/painel\/publicacao\//);
});

test("definir o prazo fatal de um processo incluído manualmente", async ({
  page,
}) => {
  const tabela = page.getByRole("table", {
    name: "Intimações capturadas do DJEN",
  });

  // Inclui o processo à mão, como faz o escritório quando não vem do DJEN.
  await page.getByRole("button", { name: /Incluir processo/ }).click();
  const modal = page.getByRole("dialog", {
    name: "Incluir processo manualmente",
  });
  await modal.getByTestId("novo-processo-tipo").selectOption("cnj");
  await modal.getByTestId("novo-processo-numero").fill(numero);
  await modal.getByRole("button", { name: "Incluir processo" }).click();
  await expect(page.getByText("Processo incluído no painel.")).toBeVisible({
    timeout: 10_000,
  });
  await expect(modal).toBeHidden();

  // Sem prazo informado, a lista mostra "Não identificado".
  await page.locator("#filtro-busca").fill(numero);
  const linha = tabela
    .getByRole("row")
    .filter({ hasText: mascararCnj(numero) })
    .first();
  await expect(linha).toContainText("Não identificado");

  // O prazo é opcional e pode ser preenchido à mão (aqui, a data da audiência).
  await linha
    .getByRole("button", { name: `Abrir detalhes de ${mascararCnj(numero)}` })
    .click();
  const painel = page.getByRole("dialog", { name: mascararCnj(numero) });
  await painel.getByTestId("detalhe-prazo-fatal").fill("2026-12-20");
  await painel.getByRole("button", { name: "Salvar prazo" }).click();
  await expect(page.getByText("Prazo fatal salvo.")).toBeVisible();

  // O valor persiste e passa a valer na lista.
  await page.reload();
  await expect(
    page.getByTestId("detalhe-prazo-fatal"),
    "o prazo fatal deve continuar salvo depois de recarregar",
  ).toHaveValue("2026-12-20");
  await page.getByRole("button", { name: "Fechar painel" }).click();
  await page.locator("#filtro-busca").fill(numero);
  await expect(
    tabela.getByRole("row").filter({ hasText: mascararCnj(numero) }).first(),
  ).toContainText("20/12/2026");
});
