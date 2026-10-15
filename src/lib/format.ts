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

/**
 * Normaliza uma inscrição para a chave de comparação `numero/UF`.
 * Aceita "OAB/RJ 197.254", "197254/RJ" ou "OAB/RJ 197254".
 */
export function normalizarOab(valor: string): string {
  const digitos = valor.replace(/\D/g, "");
  const uf = valor.match(/\/([A-Za-z]{2})\b/)?.[1]?.toUpperCase();
  if (!digitos || !uf) return "";
  return `${digitos}/${uf}`;
}

/** Máscara progressiva do número único CNJ: `0000000-00.0000.0.00.0000`. */
export function mascararCnj(valor: string): string {
  const digitos = valor.replace(/\D/g, "").slice(0, 20);
  const blocos = [
    digitos.slice(0, 7),
    digitos.slice(7, 9),
    digitos.slice(9, 13),
    digitos.slice(13, 14),
    digitos.slice(14, 16),
    digitos.slice(16, 20),
  ];
  let saida = blocos[0];
  if (blocos[1]) saida += `-${blocos[1]}`;
  if (blocos[2]) saida += `.${blocos[2]}`;
  if (blocos[3]) saida += `.${blocos[3]}`;
  if (blocos[4]) saida += `.${blocos[4]}`;
  if (blocos[5]) saida += `.${blocos[5]}`;
  return saida;
}

/** O número CNJ é válido quando possui os 20 dígitos exigidos. */
export function cnjValido(valor: string): boolean {
  return valor.replace(/\D/g, "").length === 20;
}
