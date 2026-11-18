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
test.describe.configure({ timeout: 240_000 });

let membro: MembroTeste;
let numero: string;

test.beforeEach(async ({ page }) => {
  // Advogado (equipe), não administrador: é quem marca a cor no dia a dia.
  membro = await criarMembroTeste();
  numero = gerarNumeroCnj();
  await criarTarefaTeste({ numero, advogadoId: membro.id, tipoPeca: "Manifestação" });
  await entrar(page, membro);
});

test.afterEach(async () => {
  await limparProcessoPorNumero(numero);
  await removerContaTeste(membro);
});

test("o advogado marca a cor da tarefa e ela aparece no card do quadro", async ({ page }) => {
  await page.goto("/esteira");
  await page.getByRole("button", { name: /Abrir tarefa Manifestação/ }).click();

  const painel = page.getByRole("dialog", { name: mascararCnj(numero) });
  await expect(painel).toBeVisible();

  // A paleta fica disponível para a equipe, sem depender do gestor.
  await painel.getByRole("button", { name: "Cor azul" }).click();
  await painel.getByRole("button", { name: "Salvar e atualizar tarefa" }).click();
  await expect(page.getByText("Tarefa atualizada na esteira.")).toBeVisible({
    timeout: 30_000,
  });

  // O quadro recarrega do banco e o card passa a mostrar a cor escolhida.
  const card = page.getByRole("button", { name: /Abrir tarefa Manifestação/ });
  await expect(card.locator("span.bg-blue-500")).toHaveCount(1, { timeout: 30_000 });
});
