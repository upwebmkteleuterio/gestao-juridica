import type { TipoNumeracao } from "@/types";

/**
 * Tipos de numeração aceitos na inclusão manual.
 *
 * O eixo que importa é "esse número tem padrão?": apenas o CNJ tem formato
 * definido em norma, então só ele recebe máscara e validação. INSS, inquérito
 * policial e demais formatos são livres — o tipo existe para que a listagem
 * diga de que numeração se trata.
 */
export interface OpcaoTipoNumeracao {
  valor: TipoNumeracao;
  /** Rótulo completo, usado no formulário. */
  rotulo: string;
  /** Rótulo curto, usado em selos e colunas estreitas. */
  selo: string;
  /** `true` quando o formato é padronizado (máscara + validação). */
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

/** Rótulo curto para selos e tabelas (ex.: "IP", "INSS"). */
export function seloTipoNumeracao(valor: TipoNumeracao): string {
  return opcaoTipoNumeracao(valor).selo;
}

/** Rótulo completo para formulários e exportação. */
export function rotuloTipoNumeracao(valor: TipoNumeracao): string {
  return opcaoTipoNumeracao(valor).rotulo;
}

/**
 * Chave de comparação de números, ignorando pontuação e caixa.
 * É o que permite reconhecer "12345/2024" e "12345-2024" como o mesmo número,
 * tanto na busca quanto na checagem de duplicidade.
 */
export function normalizarNumero(valor: string): string {
  return valor.replace(/[^0-9A-Za-z]/g, "").toUpperCase();
}
