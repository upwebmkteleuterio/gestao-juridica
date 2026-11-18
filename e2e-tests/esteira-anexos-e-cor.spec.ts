import { expect, test } from "@playwright/test";
import {
  criarAdminTeste,
  criarTarefaTeste,
  entrar,
  gerarNumeroCnj,
  limparProcessoPorNumero,
  mascararCnj,
  removerContaTeste,
  type ContaTeste,
} from "./fixtures/conta-teste";

// O provisionamento do usuário de teste e o login podem ser lentos.
test.describe.configure({ timeout: 240_000 });

/** PNG 1x1 válido, usado como print de protocolo/balcão virtual. */
const PRINT = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

let conta: ContaTeste;
let numero: string;

test.beforeEach(async ({ page }) => {
  conta = await criarAdminTeste();
  numero = gerarNumeroCnj();
  await criarTarefaTeste({ numero, advogadoId: conta.id, tipoPeca: "Manifestação" });
  await entrar(page, conta);
});

test.afterEach(async () => {
  await limparProcessoPorNumero(numero);
  await removerContaTeste(conta);
});

test("tarefa aceita vários prints, só conclui com anexo e a cor escolhida aparece no card", async ({
  page,
}) => {
  await page.goto("/esteira");
  await page.getByRole("button", { name: /Abrir tarefa Manifestação/ }).click();

  const painel = page.getByRole("dialog", { name: mascararCnj(numero) });
  await expect(painel).toBeVisible();

  // Sem anexo, a conclusão é recusada.
  await painel.locator("#tarefa-etapa").selectOption("concluido");
  await painel.getByRole("button", { name: "Salvar e atualizar tarefa" }).click();
  await expect(painel).toContainText(
    "Anexe pelo menos um comprovante de protocolo para concluir.",
  );

  // Dois prints anexados na mesma tarefa: protocolo e balcão virtual.
  await painel.getByLabel("Selecionar comprovantes").setInputFiles([
    { name: "print-protocolo.png", mimeType: "image/png", buffer: PRINT },
    { name: "print-balcao-virtual.png", mimeType: "image/png", buffer: PRINT },
  ]);
  await expect(painel).toContainText("print-protocolo.png", { timeout: 60_000 });
  await expect(painel).toContainText("print-balcao-virtual.png");

  // Cor escolhida pela equipe para bater o olho no quadro.
  await painel.getByRole("button", { name: "Cor vermelho" }).click();

  await painel.getByRole("button", { name: "Salvar e atualizar tarefa" }).click();
  await expect(page.getByText("Tarefa atualizada na esteira.")).toBeVisible({
    timeout: 30_000,
  });

  // No quadro, o card fica com a cor escolhida no topo.
  const card = page.getByRole("button", { name: /Abrir tarefa Manifestação/ });
  await expect(card.locator("span.bg-red-500")).toHaveCount(1, { timeout: 30_000 });
});
