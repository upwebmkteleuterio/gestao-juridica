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
test.describe.configure({ timeout: 300_000 });

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

test("tarefa conclui sem exigir anexo, aceita vários prints e mostra a cor no card", async ({
  page,
}) => {
  // O quadro do gestor tem outras tarefas do escritório: mira no processo do teste.
  const cartao = () =>
    page.getByRole("button", {
      name: `Abrir tarefa Manifestação, processo ${mascararCnj(numero)}`,
    });

  await page.goto("/esteira");
  await cartao().click();

  const painel = page.getByRole("dialog", { name: mascararCnj(numero) });
  await expect(painel).toBeVisible();

  // Protocolado não depende de anexo: salva e fecha normalmente.
  await painel.locator("#tarefa-etapa").selectOption("concluido");
  await painel.getByRole("button", { name: "Salvar e atualizar tarefa" }).click();
  await expect(painel).toBeHidden({ timeout: 30_000 });

  // Reabre a tarefa protocolada para anexar os prints e marcar a cor.
  await cartao().click();
  await expect(painel).toBeVisible();

  await painel.getByLabel("Selecionar comprovantes").setInputFiles([
    { name: "print-protocolo.png", mimeType: "image/png", buffer: PRINT },
    { name: "print-balcao-virtual.png", mimeType: "image/png", buffer: PRINT },
  ]);
  await expect(painel).toContainText("print-protocolo.png", { timeout: 60_000 });
  await expect(painel).toContainText("print-balcao-virtual.png");

  await painel.getByRole("button", { name: "Cor vermelho" }).click();
  await painel.getByRole("button", { name: "Salvar e atualizar tarefa" }).click();
  await expect(painel).toBeHidden({ timeout: 30_000 });

  // No quadro, o card fica com a cor escolhida no topo.
  await expect(cartao().locator("span.bg-red-500")).toHaveCount(1, { timeout: 30_000 });
});
