import { expect, test } from "@playwright/test";
import {
  criarMembroTeste,
  criarTarefaTeste,
  entrar,
  gerarNumeroCnj,
  limparProcessoPorNumero,
  mascararCnj,
  removerContaTeste,
  type MembroTeste,
} from "./fixtures/conta-teste";

// O provisionamento do usuário de teste e o login podem ser lentos.
test.describe.configure({ timeout: 90_000 });

let membro: MembroTeste;
let numero: string;

test.beforeEach(async ({ page }) => {
  membro = await criarMembroTeste();
  numero = gerarNumeroCnj();
  await criarTarefaTeste({ numero, advogadoId: membro.id, tipoPeca: "Contestação" });
  await entrar(page, membro);
});

test.afterEach(async () => {
  await limparProcessoPorNumero(numero);
  await removerContaTeste(membro);
});

test("advogado vê a carga da equipe em modo leitura, sem ações de gestão", async ({
  page,
}) => {
  await page.goto("/equipe");

  await expect(
    page.getByRole("heading", { name: /Painel da Equipe/ }),
  ).toBeVisible();
  // Enxerga quem está com cada prazo...
  await expect(page.getByText("Prazos vinculados").first()).toBeVisible();
  // ...e não tem nenhuma ação de gestão da equipe.
  await expect(page.getByRole("button", { name: /Cadastrar novo advogado/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Editar advogado/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Excluir/ })).toHaveCount(0);
});

test("advogado descobre de quem é um processo pelo número", async ({ page }) => {
  await page.goto("/esteira");
  await page.locator("#consulta-responsavel-numero").fill(numero);

  await expect(page.getByText(/Responsável:/).first()).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(mascararCnj(numero)).first()).toBeVisible();
});
