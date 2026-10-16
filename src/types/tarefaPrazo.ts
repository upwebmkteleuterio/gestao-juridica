import type { TipoContagemPrazo } from "@/lib/prazos";
import type {
  DateOnly,
  EtapaKanban,
  ID,
  ISODate,
  OrigemTarefa,
} from "./common";

/**
 * Tabela `tarefas_prazos` — o Kanban de produção.
 * Une intimações automáticas do DJEN com prazos cadastrados manualmente.
 */
export interface TarefaPrazo {
  id: ID;
  origem: OrigemTarefa;
  intimacao_id: ID | null;
  advogado_id: ID;
  numero_processo: string;
  partes_resumo: string;
  tipo_peca: string;
  data_fatal: DateOnly | null;
  etapa_kanban: EtapaKanban;
  link_minuta: string | null;
  notas_internas: string | null;
  recibo_protocolo_url: string | null;
  concluido_em: ISODate | null;
  created_at: ISODate;
  updated_at: ISODate;
  /** Posição manual do card na coluna; null = ainda não reordenado. */
  ordem_kanban: number | null;
  /** Momento em que saiu do quadro para a lista de arquivados. */
  arquivado_em: ISODate | null;
  /** Prazo em dias informado no cadastro manual (vazio nas tarefas do DJEN). */
  dias_prazo: number | null;
  /** Regra de contagem usada no cálculo da data fatal do prazo manual. */
  tipo_contagem_prazo: TipoContagemPrazo | null;
  /**
   * Campo auxiliar de apresentação (não persistido no banco): sigla do
   * tribunal exibida no card da esteira. Derivado da intimação quando a
   * tarefa é automática e informado no cadastro quando é manual.
   */
  tribunal_sigla?: string | null;
  /** Data de disponibilização no DJEN, derivada da intimação de origem. */
  data_disponibilizacao?: DateOnly | null;
  /** Momento em que o escritório ingeriu a publicação (criação da intimação). */
  capturada_em?: ISODate | null;
  /** Data de ciência do prazo manual, persistida no banco. */
  data_ciencia?: DateOnly | null;
}

export type TarefaPrazoInput = Omit<
  TarefaPrazo,
  "id" | "created_at" | "updated_at" | "ordem_kanban" | "arquivado_em"
>;

/** Filtros da lista de tarefas arquivadas (datas puras YYYY-MM-DD). */
export interface ConsultaArquivados {
  de: string;
  ate: string;
  responsavelId?: ID | null;
}

/** Pílulas de urgência dos controles superiores da Esteira (Tela 2). */
export type UrgenciaEsteira =
  | "todos"
  | "criticos"
  | "hoje"
  | "semana"
  | "em_dia";

/**
 * Parâmetros aceitos pela consulta do Kanban. O recorte por responsável e
 * urgência é resolvido no serviço, nunca na tela.
 */
export interface ConsultaEsteira {
  /** `null`/`undefined` = todos os responsáveis. */
  responsavelId?: ID | null;
  urgencia?: UrgenciaEsteira;
}

/** Uma das cinco colunas do Kanban, já com as tarefas ordenadas. */
export interface ColunaKanban {
  etapa: EtapaKanban;
  tarefas: TarefaPrazo[];
}

/** Contagem por faixa de urgência — rótulo das pílulas de filtro. */
export interface ResumoUrgenciaEsteira {
  criticos: number;
  hoje: number;
  semana: number;
  emDia: number;
  /** Total de tarefas no escopo selecionado (inclui protocoladas). */
  total: number;
}

export interface ResultadoEsteira {
  colunas: ColunaKanban[];
  resumo: ResumoUrgenciaEsteira;
  total: number;
}
