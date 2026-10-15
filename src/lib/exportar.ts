/**
 * Exportação CSV compatível com Excel (UTF-8 + BOM, separador ";").
 * Células iniciadas por =, +, - ou @ são neutralizadas para impedir que
 * planilhas as interpretem como fórmulas.
 */
const INICIO_FORMULA = /^[=+\-@\t\r]/;

export function neutralizarCelula(valor: string): string {
  return INICIO_FORMULA.test(valor) ? `'${valor}` : valor;
}

export function gerarCsv(cabecalhos: string[], linhas: string[][]): string {
  const escapar = (valor: string) =>
    `"${neutralizarCelula(valor ?? "").replace(/"/g, '""')}"`;
  return `\uFEFF${[cabecalhos, ...linhas]
    .map((linha) => linha.map(escapar).join(";"))
    .join("\r\n")}`;
}

export function baixarArquivo(
  nomeArquivo: string,
  conteudo: string,
  tipo = "text/csv;charset=utf-8;",
): void {
  const blob = new Blob([conteudo], { type: tipo });
  const url = URL.createObjectURL(blob);
  const ancora = document.createElement("a");
  ancora.href = url;
  ancora.download = nomeArquivo;
  ancora.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
