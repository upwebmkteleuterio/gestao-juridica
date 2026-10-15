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

/**
 * Conta dias úteis (seg–sex) após a data inicial, até a data final.
 * Não considera feriados e serve apenas como referência visual — a
 * conferência do prazo é sempre humana.
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

  let total = 0;
  const cursor = new Date(de);
  cursor.setUTCDate(cursor.getUTCDate() + 1);
  while (cursor <= ate) {
    const dia = cursor.getUTCDay();
    if (dia !== 0 && dia !== 6) total += 1;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return total;
}
