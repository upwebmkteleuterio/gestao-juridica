/** Utilitários de formatação (pt-BR) usados pelos componentes do UI Kit. */

export function formatarData(valor?: string | null): string {
  if (!valor) return "—";
  const iso = valor.slice(0, 10);
  const [ano, mes, dia] = iso.split("-");
  if (!ano || !mes || !dia) return "—";
  return `${dia}/${mes}/${ano}`;
}

export function formatarDataHora(valor?: string | null): string {
  if (!valor) return "—";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(data);
}

export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

export function truncar(texto: string, limite = 25): string {
  if (texto.length <= limite) return texto;
  return `${texto.slice(0, Math.max(0, limite - 1))}…`;
}

/** Diferença em dias entre hoje e a data fatal (negativo = vencido). */
export function diasAte(
  dataFatal?: string | null,
  referencia: Date = new Date(),
): number | null {
  if (!dataFatal) return null;
  const alvo = new Date(`${dataFatal.slice(0, 10)}T00:00:00-03:00`);
  if (Number.isNaN(alvo.getTime())) return null;
  const base = new Date(
    `${referencia.toISOString().slice(0, 10)}T00:00:00-03:00`,
  );
  return Math.round((alvo.getTime() - base.getTime()) / 86_400_000);
}

export function formatarOab(numero: string, uf: string): string {
  return `OAB/${uf} ${numero}`;
}
