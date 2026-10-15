import type { IntimacaoDjenRaw, StatusAnaliseIA } from "@/types";

/**
 * Payload bruto de exemplo, no formato de resposta da API pública do CNJ
 * (`GET /api/v1/comunicacao`). Dados fictícios — nenhuma consulta real.
 */
const RECEBIDO_EM = "2026-10-15T06:00:00-03:00";
const DISPONIBILIZACAO = "2026-10-15";

interface Seed {
  id: string;
  djen: number;
  hash: string;
  tribunal: string;
  orgao: string;
  processo: string;
  classe: string;
  documento: string;
  comunicacao: string;
  parteAtiva: string;
  partePassiva: string;
  texto: string;
  status: StatusAnaliseIA;
}

export const djenSeeds: Seed[] = [
  {
    id: "raw-001",
    djen: 1082310942,
    hash: "b1f2c3d4e5a69788190a1b2c3d4e5f60a1b2c3d4e5f60718293a4b5c6d7e8f90",
    tribunal: "TJSP",
    orgao: "3ª Vara Cível da Comarca de São Paulo",
    processo: "1002345-12.2026.8.26.0100",
    classe: "Ação de Indenização por Dano Moral",
    documento: "Despacho",
    comunicacao: "Intimação",
    parteAtiva: "Almeida Comércio Ltda.",
    partePassiva: "Transportadora Bandeirante S.A.",
    texto:
      "Intime-se a parte ré para apresentar contestação no prazo de 15 (quinze) dias úteis, observadas as disposições aplicáveis ao feito. Após, tornem os autos conclusos para decisão.",
    status: "sucesso",
  },
  {
    id: "raw-002",
    djen: 1082310955,
    hash: "c2a3b4d5e6f70819203142536475869708192a3b4c5d6e7f8091a2b3c4d5e6f7",
    tribunal: "TJRJ",
    orgao: "5ª Vara Cível da Comarca do Rio de Janeiro",
    processo: "0814520-34.2026.8.19.0001",
    classe: "Procedimento Comum Cível",
    documento: "Decisão",
    comunicacao: "Intimação",
    parteAtiva: "Carolina Ferreira",
    partePassiva: "Seguradora Litoral S.A.",
    texto:
      "Intime-se a parte autora para se manifestar sobre os documentos juntados, no prazo de 5 (cinco) dias úteis, nos termos do artigo aplicável.",
    status: "sucesso",
  },
  {
    id: "raw-003",
    djen: 1082310968,
    hash: "d3b4c5e6f70819203142536475869708192a3b4c5d6e7f8091a2b3c4d5e6f708",
    tribunal: "TRT-2",
    orgao: "12ª Vara do Trabalho de São Paulo",
    processo: "1000721-50.2026.5.02.0003",
    classe: "Reclamação Trabalhista",
    documento: "Despacho",
    comunicacao: "Notificação",
    parteAtiva: "Oliveira Serviços S.A.",
    partePassiva: "Jorge Ramos da Silva",
    texto:
      "Dê-se ciência às partes do despacho proferido. Não há prazo explícito indicado neste ato; conferir os autos antes de definir a providência.",
    status: "falha",
  },
  {
    id: "raw-004",
    djen: 1082310971,
    hash: "e4c5d6e7f8091a2b3c4d5e6f70819203142536475869708192a3b4c5d6e7f809",
    tribunal: "TJSP",
    orgao: "1ª Vara Empresarial da Comarca de São Paulo",
    processo: "1018820-11.2026.8.26.0100",
    classe: "Recuperação Judicial",
    documento: "Decisão",
    comunicacao: "Intimação",
    parteAtiva: "Horizonte Participações S.A.",
    partePassiva: "Credores interessados",
    texto:
      "Intime-se para apresentação de manifestação no prazo de 10 (dez) dias úteis acerca do plano apresentado.",
    status: "sucesso",
  },
  {
    id: "raw-005",
    djen: 1082310984,
    hash: "f5d6e7f8091a2b3c4d5e6f70819203142536475869708192a3b4c5d6e7f8091a",
    tribunal: "TJRJ",
    orgao: "2ª Vara de Família da Comarca do Rio de Janeiro",
    processo: "0823301-92.2026.8.19.0001",
    classe: "Ação de Alimentos",
    documento: "Sentença",
    comunicacao: "Intimação",
    parteAtiva: "Roberto Mendes",
    partePassiva: "Helena Mendes",
    texto:
      "Publique-se a sentença e intimem-se as partes. Exemplo fictício que exige análise humana para identificação de eventual prazo recursal.",
    status: "pendente",
  },
  {
    id: "raw-006",
    djen: 1082310990,
    hash: "0a6e7f8091a2b3c4d5e6f70819203142536475869708192a3b4c5d6e7f8091a2b",
    tribunal: "TJMG",
    orgao: "4ª Vara Cível da Comarca de Belo Horizonte",
    processo: "5001234-77.2026.8.13.0024",
    classe: "Execução de Título Extrajudicial",
    documento: "Despacho",
    comunicacao: "Intimação",
    parteAtiva: "Banco Central do Cerrado S.A.",
    partePassiva: "Construtora Vista Alegre Ltda.",
    texto:
      "Intime-se o executado para pagamento no prazo de 3 (três) dias, sob pena de penhora, nos termos do dispositivo aplicável.",
    status: "sucesso",
  },
  {
    id: "raw-007",
    djen: 1082311003,
    hash: "1b7f8091a2b3c4d5e6f70819203142536475869708192a3b4c5d6e7f8091a2b3c",
    tribunal: "TRF-2",
    orgao: "2ª Vara Federal de Niterói",
    processo: "5008899-21.2026.4.02.5102",
    classe: "Mandado de Segurança",
    documento: "Decisão",
    comunicacao: "Intimação",
    parteAtiva: "Clínica São Bento Ltda.",
    partePassiva: "União Federal",
    texto:
      "Intimem-se as partes sobre a decisão liminar. Prazo de 10 (dez) dias para manifestação, se houver interesse.",
    status: "sucesso",
  },
  {
    id: "raw-008",
    djen: 1082311016,
    hash: "2c8091a2b3c4d5e6f70819203142536475869708192a3b4c5d6e7f8091a2b3c4d",
    tribunal: "TJSP",
    orgao: "2ª Vara de Família da Comarca de Campinas",
    processo: "1004520-19.2026.8.26.0100",
    classe: "Divórcio Consensual",
    documento: "Despacho",
    comunicacao: "Intimação",
    parteAtiva: "Patrícia Nunes",
    partePassiva: "Eduardo Nunes",
    texto:
      "Intime-se o casal para apresentar acordo de partilha no prazo de 15 (quinze) dias úteis.",
    status: "sucesso",
  },
  {
    id: "raw-009",
    djen: 1082311029,
    hash: "3d91a2b3c4d5e6f70819203142536475869708192a3b4c5d6e7f8091a2b3c4d5e",
    tribunal: "TJSP",
    orgao: "7ª Vara Cível da Comarca de São Paulo",
    processo: "1009132-44.2026.8.26.0100",
    classe: "Ação de Cobrança",
    documento: "Decisão",
    comunicacao: "Intimação",
    parteAtiva: "Tecnologia Avançada Ltda.",
    partePassiva: "Distribuidora Norte Sul S.A.",
    texto:
      "Intime-se a parte ré para apresentar contestação no prazo legal de 15 (quinze) dias úteis, sob pena de revelia.",
    status: "sucesso",
  },
  {
    id: "raw-010",
    djen: 1082311032,
    hash: "4ea2b3c4d5e6f70819203142536475869708192a3b4c5d6e7f8091a2b3c4d5e6f",
    tribunal: "TJRJ",
    orgao: "9ª Vara Cível da Comarca do Rio de Janeiro",
    processo: "0800320-71.2026.8.19.0001",
    classe: "Ação Revisional de Contrato",
    documento: "Sentença",
    comunicacao: "Intimação",
    parteAtiva: "Marcos Vinícius Andrade",
    partePassiva: "Financeira Progresso S.A.",
    texto:
      "Intimem-se as partes da sentença publicada. Prazo de 15 (quinze) dias úteis para eventual recurso.",
    status: "sucesso",
  },
  {
    id: "raw-011",
    djen: 1082311045,
    hash: "5fb3c4d5e6f70819203142536475869708192a3b4c5d6e7f8091a2b3c4d5e6f70",
    tribunal: "TJSP",
    orgao: "3ª Vara Cível da Comarca de São Paulo",
    processo: "1012240-31.2026.8.26.0100",
    classe: "Ação de Despejo",
    documento: "Despacho",
    comunicacao: "Intimação",
    parteAtiva: "Imobiliária Central Ltda.",
    partePassiva: "Fernanda Ribeiro",
    texto:
      "Intime-se a parte autora para juntar a petição de juntada e os documentos complementares no prazo de 5 (cinco) dias úteis.",
    status: "sucesso",
  },
  {
    id: "raw-012",
    djen: 1082311058,
    hash: "60c4d5e6f70819203142536475869708192a3b4c5d6e7f8091a2b3c4d5e6f7081",
    tribunal: "TJSP",
    orgao: "4ª Vara Cível da Comarca de São Paulo",
    processo: "1001500-14.2026.8.26.0100",
    classe: "Ação de Obrigação de Fazer",
    documento: "Decisão",
    comunicacao: "Intimação",
    parteAtiva: "Plano de Saúde Vida Plena",
    partePassiva: "Tereza Albuquerque",
    texto:
      "Intime-se a operadora para cumprir a decisão no prazo de 48 (quarenta e oito) horas, sob pena de multa diária.",
    status: "sucesso",
  },
  {
    id: "raw-013",
    djen: 1082311061,
    hash: "71d5e6f70819203142536475869708192a3b4c5d6e7f8091a2b3c4d5e6f708192",
    tribunal: "TRT-2",
    orgao: "5ª Vara do Trabalho de São Paulo",
    processo: "1001810-25.2026.5.02.0001",
    classe: "Reclamação Trabalhista",
    documento: "Despacho",
    comunicacao: "Notificação",
    parteAtiva: "Rede de Lojas Aurora Ltda.",
    partePassiva: "Simone Barros",
    texto:
      "Intimem-se as partes para audiência de instrução. Manifestação nos autos no prazo de 5 (cinco) dias úteis.",
    status: "sucesso",
  },
  {
    id: "raw-014",
    djen: 1082311074,
    hash: "82e6f70819203142536475869708192a3b4c5d6e7f8091a2b3c4d5e6f7081920a",
    tribunal: "TJRJ",
    orgao: "6ª Vara Cível da Comarca do Rio de Janeiro",
    processo: "0812420-98.2026.8.19.0001",
    classe: "Ação de Reparação por Danos Materiais",
    documento: "Sentença",
    comunicacao: "Intimação",
    parteAtiva: "Gustavo Teixeira",
    partePassiva: "Concessionária Via Litoral S.A.",
    texto:
      "Intimem-se as partes para revisão da sentença. Prazo recursal de 15 (quinze) dias úteis contados da publicação.",
    status: "sucesso",
  },
  {
    id: "raw-015",
    djen: 1082311087,
    hash: "93f70819203142536475869708192a3b4c5d6e7f8091a2b3c4d5e6f7081920a1b",
    tribunal: "TJSP",
    orgao: "8ª Vara Cível da Comarca de São Paulo",
    processo: "1005670-33.2026.8.26.0100",
    classe: "Ação Monitória",
    documento: "Despacho",
    comunicacao: "Intimação",
    parteAtiva: "Comercial Três Irmãos Ltda.",
    partePassiva: "Luís Fernando Prado",
    texto:
      "Intime-se o réu para, em 15 (quinze) dias, apresentar embargos monitórios, se assim entender.",
    status: "sucesso",
  },
  {
    id: "raw-016",
    djen: 1082311090,
    hash: "a40819203142536475869708192a3b4c5d6e7f8091a2b3c4d5e6f7081920a1b2c",
    tribunal: "TJRJ",
    orgao: "11ª Vara Cível da Comarca do Rio de Janeiro",
    processo: "0809450-27.2026.8.19.0001",
    classe: "Ação de Usucapião",
    documento: "Decisão",
    comunicacao: "Intimação",
    parteAtiva: "Cláudio Nogueira",
    partePassiva: "Espólio de Antônio Nogueira",
    texto:
      "Intimem-se os interessados sobre a decisão que determinou a citação por edital. Prazo de 10 (dez) dias úteis.",
    status: "sucesso",
  },
  {
    id: "raw-017",
    djen: 1082311103,
    hash: "b519203142536475869708192a3b4c5d6e7f8091a2b3c4d5e6f7081920a1b2c3",
    tribunal: "TJSP",
    orgao: "12ª Vara Cível da Comarca de São Paulo",
    processo: "1007788-90.2026.8.26.0100",
    classe: "Ação de Rescisão Contratual",
    documento: "Despacho",
    comunicacao: "Intimação",
    parteAtiva: "Engenharia Pilar Ltda.",
    partePassiva: "Incorporadora Mirante S.A.",
    texto:
      "Intime-se a parte autora para especificar as provas que pretende produzir no prazo de 10 (dez) dias úteis.",
    status: "sucesso",
  },
  {
    id: "raw-018",
    djen: 1082311116,
    hash: "c62a3142536475869708192a3b4c5d6e7f8091a2b3c4d5e6f7081920a1b2c3d4",
    tribunal: "TJSP",
    orgao: "2ª Vara Cível da Comarca de Santos",
    processo: "1015000-05.2026.8.26.0100",
    classe: "Ação de Responsabilidade Civil",
    documento: "Decisão",
    comunicacao: "Intimação",
    parteAtiva: "Marina Duarte",
    partePassiva: "Hotel Porto Seguro Ltda.",
    texto:
      "Intimem-se as partes sobre a decisão saneadora. Prazo de 5 (cinco) dias úteis para esclarecimentos.",
    status: "sucesso",
  },
  {
    id: "raw-019",
    djen: 1082311129,
    hash: "d73b42536475869708192a3b4c5d6e7f8091a2b3c4d5e6f7081920a1b2c3d4e5",
    tribunal: "TJRJ",
    orgao: "3ª Vara Empresarial da Comarca do Rio de Janeiro",
    processo: "0822100-16.2026.8.19.0001",
    classe: "Falência",
    documento: "Despacho",
    comunicacao: "Intimação",
    parteAtiva: "Metalúrgica Sul Fluminense Ltda.",
    partePassiva: "Credores habilitados",
    texto:
      "Intimem-se os credores para manifestação sobre a relação apresentada no prazo de 10 (dez) dias úteis.",
    status: "pendente",
  },
  {
    id: "raw-020",
    djen: 1082311132,
    hash: "e84c536475869708192a3b4c5d6e7f8091a2b3c4d5e6f7081920a1b2c3d4e5f6",
    tribunal: "TRT-2",
    orgao: "18ª Vara do Trabalho de São Paulo",
    processo: "1003311-77.2026.5.02.0003",
    classe: "Ação de Cumprimento de Sentença",
    documento: "Decisão",
    comunicacao: "Notificação",
    parteAtiva: "Grupo Logístico Paulista Ltda.",
    partePassiva: "Sindicato dos Trabalhadores",
    texto:
      "Intimem-se as partes sobre os cálculos homologados. Manifestação no prazo de 8 (oito) dias.",
    status: "sucesso",
  },
];

/** Advogados citados nas publicações (dados fictícios). */
const ADVOGADOS_CITADOS = [
  { nome: "Mariana Costa", oab: "OAB/RJ 197.254" },
  { nome: "Pedro Almeida", oab: "OAB/SP 204.812" },
  { nome: "Ana Oliveira", oab: "OAB/RJ 211.560" },
  { nome: "Lucas Santos", oab: "OAB/SP 220.114" },
  { nome: "Beatriz Lima", oab: "OAB/MG 226.905" },
  { nome: "Rafael Gomes", oab: "OAB/RJ 187.412" },
];

export const intimacoesDjenRawMock: IntimacaoDjenRaw[] = djenSeeds.map(
  (s, indice) => ({
    id: s.id,
    djen_id_original: String(s.djen),
    djen_hash: s.hash,
    status_analise_ia: s.status,
    criado_em: RECEBIDO_EM,
    payload_json: {
      advogados: [
        ADVOGADOS_CITADOS[indice % ADVOGADOS_CITADOS.length],
        ADVOGADOS_CITADOS[(indice + 3) % ADVOGADOS_CITADOS.length],
      ],
      id: s.djen,
      data_disponibilizacao: DISPONIBILIZACAO,
      siglaTribunal: s.tribunal,
      tipoComunicacao: s.comunicacao,
      nomeOrgao: s.orgao,
      numero_processo: s.processo,
      nomeClasse: s.classe,
      tipoDocumento: s.documento,
      texto: s.texto,
      link: `https://comunica.pje.jus.br/documentos/${s.djen}`,
      hash: s.hash,
      meio: "Diário de Justiça Eletrônico Nacional",
      destinatarios: [
        { nome: s.parteAtiva, polo: "A", comunicacao_id: s.djen },
        { nome: s.partePassiva, polo: "P", comunicacao_id: s.djen },
      ],
    },
  }),
);
