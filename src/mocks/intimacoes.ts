import type { Intimacao, StatusFluxoIntimacao } from "@/types";
import { djenSeeds } from "./intimacoesDjenRaw";

interface TriagemSeed {
  acao: string;
  resumo: string;
  fatal: string | null;
  advogadoId: string | null;
  status: StatusFluxoIntimacao;
}

/** Classificação de triagem alinhada, por índice, a `djenSeeds`. */
const triagemSeeds: TriagemSeed[] = [
  {
    acao: "Apresentar contestação",
    resumo:
      "A parte ré foi intimada a apresentar defesa no prazo de 15 dias úteis. Revisar os autos e os documentos necessários antes de preparar a peça.",
    fatal: "2026-11-06",
    advogadoId: null,
    status: "triagem",
  },
  {
    acao: "Manifestar sobre documentos",
    resumo:
      "A parte autora deve se manifestar sobre os documentos juntados em 5 dias úteis.",
    fatal: "2026-10-22",
    advogadoId: null,
    status: "triagem",
  },
  {
    acao: "Revisar despacho",
    resumo:
      "Despacho de mero expediente, sem prazo explícito. Conferir os autos antes de definir a providência.",
    fatal: null,
    advogadoId: null,
    status: "triagem",
  },
  {
    acao: "Apresentar manifestação sobre o plano",
    resumo:
      "Manifestação em 10 dias úteis acerca do plano apresentado nos autos da recuperação judicial.",
    fatal: "2026-10-29",
    advogadoId: null,
    status: "triagem",
  },
  {
    acao: "Analisar sentença",
    resumo:
      "Sentença publicada. Exige análise humana para identificação de eventual prazo recursal.",
    fatal: null,
    advogadoId: null,
    status: "triagem",
  },
  {
    acao: "Avaliar pagamento e penhora",
    resumo:
      "Intimação para pagamento em 3 dias, sob pena de penhora. Avaliar a estratégia processual.",
    fatal: "2026-10-20",
    advogadoId: null,
    status: "triagem",
  },
  {
    acao: "Manifestar sobre a liminar",
    resumo:
      "Decisão liminar proferida. Prazo de 10 dias para manifestação, se houver interesse.",
    fatal: "2026-10-29",
    advogadoId: null,
    status: "triagem",
  },
  {
    acao: "Apresentar acordo de partilha",
    resumo:
      "Intimação para apresentação de acordo de partilha no prazo de 15 dias úteis.",
    fatal: "2026-11-06",
    advogadoId: null,
    status: "triagem",
  },
  {
    acao: "Apresentar contestação",
    resumo:
      "Contestação no prazo legal de 15 dias úteis, sob pena de revelia. Verificar documentos e procuração.",
    fatal: "2026-11-06",
    advogadoId: null,
    status: "triagem",
  },
  {
    acao: "Avaliar recurso da sentença",
    resumo:
      "Sentença publicada em ação revisional. Prazo de 15 dias úteis para eventual recurso.",
    fatal: "2026-11-06",
    advogadoId: "adv-mariana-costa",
    status: "fila",
  },
  {
    acao: "Juntar documentos complementares",
    resumo:
      "Juntar petição e documentos complementares no prazo de 5 dias úteis.",
    fatal: "2026-10-22",
    advogadoId: "adv-pedro-almeida",
    status: "fila",
  },
  {
    acao: "Cumprir decisão em 48h",
    resumo:
      "Cumprimento de decisão em 48 horas, sob pena de multa diária. Prazo crítico.",
    fatal: "2026-10-17",
    advogadoId: "adv-ana-oliveira",
    status: "fila",
  },
  {
    acao: "Manifestação pré-audiência",
    resumo:
      "Manifestação nos autos no prazo de 5 dias úteis, antes da audiência de instrução.",
    fatal: "2026-10-22",
    advogadoId: "adv-lucas-santos",
    status: "fila",
  },
  {
    acao: "Avaliar recurso da sentença",
    resumo:
      "Prazo recursal de 15 dias úteis contados da publicação da sentença.",
    fatal: "2026-11-06",
    advogadoId: "adv-beatriz-lima",
    status: "fila",
  },
  {
    acao: "Avaliar embargos monitórios",
    resumo:
      "Prazo de 15 dias para apresentação de embargos monitórios, se assim entender.",
    fatal: "2026-11-06",
    advogadoId: null,
    status: "triagem",
  },
  {
    acao: "Manifestar sobre citação por edital",
    resumo:
      "Decisão determinou citação por edital. Prazo de 10 dias úteis para manifestação.",
    fatal: "2026-10-29",
    advogadoId: null,
    status: "triagem",
  },
  {
    acao: "Especificar provas",
    resumo:
      "Especificar as provas que pretende produzir no prazo de 10 dias úteis.",
    fatal: "2026-10-29",
    advogadoId: null,
    status: "triagem",
  },
  {
    acao: "Prestar esclarecimentos",
    resumo:
      "Decisão saneadora. Prazo de 5 dias úteis para esclarecimentos.",
    fatal: "2026-10-22",
    advogadoId: null,
    status: "triagem",
  },
  {
    acao: "Manifestar sobre relação de credores",
    resumo:
      "Manifestação sobre a relação de credores em 10 dias úteis. Item dispensado na triagem.",
    fatal: "2026-10-29",
    advogadoId: null,
    status: "dispensado",
  },
  {
    acao: "Manifestar sobre os cálculos",
    resumo:
      "Cálculos homologados. Manifestação no prazo de 8 dias.",
    fatal: "2026-10-27",
    advogadoId: null,
    status: "triagem",
  },
];

export const intimacoesMock: Intimacao[] = djenSeeds.map((seed, index) => {
  const triagem = triagemSeeds[index];
  return {
    id: seed.id.replace("raw", "int"),
    raw_id: seed.id,
    numero_processo: seed.processo,
    tribunal_sigla: seed.tribunal,
    orgao_julgador: seed.orgao,
    data_disponibilizacao: "2026-10-15",
    acao_sugerida_ia: triagem.acao,
    resumo_ia: triagem.resumo,
    data_fatal_calculada: triagem.fatal,
    advogado_id: triagem.advogadoId,
    status_fluxo: triagem.status,
    distribuido_em:
      triagem.status === "fila" ? "2026-10-15T06:30:00-03:00" : null,
  };
});
