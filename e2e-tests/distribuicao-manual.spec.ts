import { expect, test } from "@playwright/test";
import {
  criarAdminTeste,
  criarMembroTeste,
  entrar,
  gerarNumeroCnj,
  limparProcessoPorNumero,
  mascararCnj,
  removerContaTeste,
  type ContaTeste,
  type MembroTeste,
} from "./fixtures/conta-teste";

// O provisionamento de dois usuários de teste e o login podem ser lentos.
test.describe.configure({ timeout: 90_000 });

const OBSERVACAO = "Juntar comprovante de residencia";

let conta: ContaTeste;
let membro: MembroTeste;
let numero: string;

test.beforeEach(async ({ page }) => {
  conta = await criarAdminTeste();
  membro = await criarMembroTeste({ ativoDistribuicao: true });
  numero = gerarNumeroCnj();
  await entrar(page, conta);
});

test.afterEach(async () => {
  await limparProcessoPorNumero(numero);
  await removerContaTeste(membro);
  await removerContaTeste(conta);
});

test("distribuir um processo manual gera tarefa na esteira com o título da observação", async ({
  page,
}) => {
  // Cria o processo manual pela própria interface.
  await page.getByRole("button", { name: /Incluir processo/ }).click();
  const modal = page.getByRole("dialog", {
    name: "Incluir processo manualmente",
  });
  await modal.getByTestId("novo-processo-tipo").selectOption("cnj");
  await modal.getByTestId("novo-processo-numero").fill(numero);
  await modal.locator("#novo-processo-observacoes").fill(OBSERVACAO);
  await modal.getByRole("button", { name: "Incluir processo" }).click();
  await expect(modal).toBeHidden();

  // Seleciona apenas esse registro e abre a distribuição em lote.
  await page.locator("#filtro-busca").fill(numero);
  const tabela = page.getByRole("table", {
    name: "Intimações capturadas do DJEN",
  });
  await tabela.getByLabel(`Selecionar ${mascararCnj(numero)}`).check();
  await page.getByRole("button", { name: /Distribuir selecionadas/ }).click();

  const modalDistribuicao = page.getByRole("dialog", {
    name: "Distribuição automática de intimações",
  });
  await expect(modalDistribuicao).toBeVisible();

  // Gabriel está fora da distribuição: aparece na lista, mas não vem marcado.
  await expect(
    modalDistribuicao.getByLabel("Incluir Gabriel Magalhães"),
  ).not.toBeChecked();
  // O advogado de teste ativo já vem pré-selecionado.
  await expect(
    modalDistribuicao.getByLabel(`Incluir ${membro.nome}`),
  ).toBeChecked();

  await modalDistribuicao
    .getByRole("button", { name: "Confirmar distribuição" })
    .click();
  await expect(modalDistribuicao).toBeHidden();

  // A tarefa criada na esteira recebe a observação como título.
  await page.goto("/esteira");
  await expect(page.getByText(OBSERVACAO, { exact: true })).toBeVisible();
});
