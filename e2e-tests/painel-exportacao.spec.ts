import { expect, test } from "@playwright/test";
import {
  criarAdminTeste,
  entrar,
  removerContaTeste,
  type ContaTeste,
} from "./fixtures/conta-teste";

let conta: ContaTeste;

test.beforeEach(async ({ page }) => {
  conta = await criarAdminTeste();
  await entrar(page, conta);
});

test.afterEach(async () => {
  await removerContaTeste(conta);
});

test("exportar planilha gera um CSV com todos os registros e as novas colunas", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.goto("/painel");

  // A prévia roda sobre o Chrome já aberto, onde o evento de download pode não
  // ser exposto. Capturamos o conteúdo do arquivo direto do Blob gerado e o
  // nome sugerido a partir do clique no link de download.
  await page.evaluate(() => {
    const janela = window as unknown as {
      __csv?: string | null;
      __arquivo?: string | null;
    };
    janela.__csv = null;
    janela.__arquivo = null;

    const criarUrl = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (blob: Blob) => {
      void blob.text().then((texto) => {
        janela.__csv = texto;
      });
      return criarUrl(blob);
    };

    const clicarOriginal = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
      if (this.download) janela.__arquivo = this.download;
      return clicarOriginal.call(this);
    };
  });

  // A exportação vive no menu de ações secundárias, ao lado de "Incluir processo".
  await page.getByRole("button", { name: "Mais ações do painel" }).click();
  await page.getByRole("menuitem", { name: "Exportar planilha" }).click();

  await expect
    .poll(
      () =>
        page.evaluate(
          () => (window as unknown as { __csv?: string | null }).__csv ?? null,
        ),
      { timeout: 60_000 },
    )
    .not.toBeNull();

  const conteudo = await page.evaluate(
    () => (window as unknown as { __csv?: string }).__csv as string,
  );
  const arquivo = await page.evaluate(
    () => (window as unknown as { __arquivo?: string }).__arquivo,
  );

  expect(arquivo).toMatch(/^MG-painel-intimacoes-.*\.csv$/);

  const linhas = conteudo.split("\r\n");
  const cabecalho = linhas[0];
  expect(cabecalho).toContain('"Processo"');
  expect(cabecalho).toContain('"Origem"');
  expect(cabecalho).toContain('"Observações"');

  // A exportação traz o recorte completo, não apenas a página visível.
  expect(linhas.length).toBeGreaterThan(50);
});
