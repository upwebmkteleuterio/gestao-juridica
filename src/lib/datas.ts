import { feriadosNacionais } from "./prazos";

/** Auxiliares de data (sem regras jurídicas de contagem de prazo). */

/** Data pura de hoje (YYYY-MM-DD) no fuso do escritório. */
export function hojeISO(fuso = "America/Sao_Paulo"): string {
  const formatador = new Intl.DateTimeFormat("en-CA", {
    timeZone: fuso,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatador.format(new Date());
}

/** Soma dias a uma data pura YYYY-MM-DD sem depender do fuso local. */
export function somarDias(dia: string, dias: number): string {
  const data = new Date(`${dia}T12:00:00Z`);
  data.setUTCDate(data.getUTCDate() + dias);
  return data.toISOString().slice(0, 10);
}

/** Retorna o dia de um instante ISO no fuso indicado; entradas inválidas preservam sua parte de data. */
export function diaISO(valor?: string | null, fuso = "America/Sao_Paulo"): string {
  if (!valor) return "";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return valor.slice(0, 10);
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: fuso,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(data);
  const valores = Object.fromEntries(partes.map((parte) => [parte.type, parte.value]));
  return `${valores.year}-${valores.month}-${valores.day}`;
}

/**
 * Horas restantes até o fim do dia da data fatal (negativo = já vencido).
 * Base do cronômetro regressivo exibido na execução da tarefa (Tela 2.1).
 */
export function horasAte(
  dataFatal?: string | null,
  referencia: Date = new Date(),
): number | null {
  if (!dataFatal) return null;
  const alvo = new Date(`${dataFatal.slice(0, 10)}T23:59:59-03:00`);
  if (Number.isNaN(alvo.getTime())) return null;
  return Math.round((alvo.getTime() - referencia.getTime()) / 3_600_000);
}

/**
 * Conta dias úteis (seg–sex) após a data inicial, até a data final,
 * considerando feriados nacionais. A conferência do prazo é sempre humana.
 */
export function contarDiasUteis(
  inicio?: string | null,
  fim?: string | null,
): number | null {
  if (!inicio || !fim) return null;
  const de = new Date(`${inicio.slice(0, 10)}T12:00:00Z`);
  const ate = new Date(`${fim.slice(0, 10)}T12:00:00Z`);
  if (Number.isNaN(de.getTime()) || Number.isNaN(ate.getTime())) return null;
  if (ate < de) return null;

  const feriados = new Set<string>();
  for (let ano = de.getUTCFullYear() - 1; ano <= ate.getUTCFullYear() + 1; ano += 1) {
    feriadosNacionais(ano).forEach((feriado) => feriados.add(feriado));
  }

  let total = 0;
  const cursor = new Date(de);
  cursor.setUTCDate(cursor.getUTCDate() + 1);
  while (cursor <= ate) {
    const dia = cursor.getUTCDay();
    if (dia !== 0 && dia !== 6 && !feriados.has(cursor.toISOString().slice(0, 10))) total += 1;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return total;
}
