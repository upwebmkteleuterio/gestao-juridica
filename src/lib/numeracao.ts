import type { TipoNumeracao } from "@/types";
import { formatarNumeroProcesso } from "@/lib/format";

export interface OpcaoTipoNumeracao {
  valor: TipoNumeracao;
  rotulo: string;
  selo: string;
  padrao: boolean;
}

export const TIPOS_NUMERACAO: OpcaoTipoNumeracao[] = [
  { valor: "cnj", rotulo: "CNJ", selo: "CNJ", padrao: true },
  { valor: "inss", rotulo: "INSS", selo: "INSS", padrao: false },
  { valor: "inquerito", rotulo: "Inquérito policial", selo: "IP", padrao: false },
  { valor: "outro", rotulo: "Outro formato", selo: "Outro", padrao: false },
];

const POR_VALOR = new Map(TIPOS_NUMERACAO.map((opcao) => [opcao.valor, opcao]));

export function opcaoTipoNumeracao(valor: TipoNumeracao): OpcaoTipoNumeracao {
  return POR_VALOR.get(valor) ?? { valor, rotulo: valor, selo: valor, padrao: false };
}

export function seloTipoNumeracao(valor: TipoNumeracao): string {
  return opcaoTipoNumeracao(valor).selo;
}

export function rotuloTipoNumeracao(valor: TipoNumeracao): string {
  return opcaoTipoNumeracao(valor).rotulo;
}

export function exibirNumeroProcesso(numero: string, tipo: TipoNumeracao): string {
  return tipo === "cnj" ? formatarNumeroProcesso(numero) : numero;
}

export function normalizarNumero(valor: string): string {
  return valor.replace(/[^0-9A-Za-z]/g, "").toUpperCase();
}
