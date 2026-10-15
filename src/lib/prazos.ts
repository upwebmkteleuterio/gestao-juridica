/**
 * Cálculo da data fatal dos prazos cadastrados manualmente (Tela 2.2).
 * Considera fins de semana e feriados nacionais (fixos e móveis) quando a
 * contagem é em dias úteis. Não substitui a conferência humana do prazo.
 */

export type TipoContagemPrazo = "uteis" | "corridos";

const UM_DIA_MS = 86_400_000;

function paraData(iso: string): Date {
  return new Date(`${iso.slice(0, 10)}T12:00:00Z`);
}

function paraISO(data: Date): string {
  return data.toISOString().slice(0, 10);
}

function somarDias(data: Date, dias: number): Date {
  return new Date(data.getTime() + dias * UM_DIA_MS);
}

/** Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher) — base dos móveis. */
function pascoa(ano: number): Date {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(ano, mes - 1, dia, 12));
}

const FERIADOS_FIXOS = [
  "01-01", // Confraternização Universal
  "04-21", // Tiradentes
  "05-01", // Dia do Trabalho
  "09-07", // Independência
  "10-12", // Nossa Senhora Aparecida
  "11-02", // Finados
  "11-15", // Proclamação da República
  "11-20", // Consciência Negra
  "12-25", // Natal
];

/** Feriados nacionais (fixos e móveis) do ano informado. */
export function feriadosNacionais(ano: number): Set<string> {
  const conjunto = new Set(FERIADOS_FIXOS.map((mesDia) => `${ano}-${mesDia}`));
  const base = pascoa(ano);
  [-48, -47, -2, 60].forEach((deslocamento) =>
    conjunto.add(paraISO(somarDias(base, deslocamento))),
  );
  return conjunto;
}

function ehFimDeSemana(data: Date): boolean {
  const dia = data.getUTCDay();
  return dia === 0 || dia === 6;
}

/**
 * Data fatal em dias úteis: avança `dias` dias úteis a partir do dia
 * seguinte à ciência (exclui o dia do começo) e pula fins de semana e
 * feriados nacionais.
 */
export function somarDiasUteis(baseISO: string, dias: number): string {
  const base = paraData(baseISO);
  const ano = base.getUTCFullYear();
  const feriados = new Set([
    ...feriadosNacionais(ano),
    ...feriadosNacionais(ano + 1),
  ]);

  let cursor = base;
  let restantes = Math.max(0, Math.trunc(dias));
  while (restantes > 0) {
    cursor = somarDias(cursor, 1);
    if (ehFimDeSemana(cursor) || feriados.has(paraISO(cursor))) continue;
    restantes -= 1;
  }
  return paraISO(cursor);
}

/** Data fatal em dias corridos (também exclui o dia do começo). */
export function somarDiasCorridos(baseISO: string, dias: number): string {
  return paraISO(somarDias(paraData(baseISO), Math.max(0, Math.trunc(dias))));
}

/** Data fatal final a partir da ciência, da quantidade e do tipo de contagem. */
export function calcularDataFatal(
  baseISO: string,
  dias: number,
  tipo: TipoContagemPrazo,
): string | null {
  if (!baseISO || !Number.isFinite(dias) || dias <= 0) return null;
  return tipo === "uteis"
    ? somarDiasUteis(baseISO, dias)
    : somarDiasCorridos(baseISO, dias);
}
