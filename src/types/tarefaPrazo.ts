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
  /**
   * Campo auxiliar de apresentação (não persistido no banco): sigla do
   * tribunal exibida no card da esteira. Derivado da intimação quando a
   * tarefa é automática e informado no cadastro quando é manual.
   */
  tribunal_sigla?: string | null;
  /** Data de ciência do prazo manual, persistida no banco. */
  data_ciencia?: DateOnly | null;
}

export type TarefaPrazoInput = Omit<
  TarefaPrazo,
  "id" | "created_at" | "updated_at"
>;

/** Escopo do quadro: fila pessoal do usuário ou pauta geral do escritório. */
export type EscopoEsteira = "meus" | "geral";

/** Pílulas de urgência dos controles superiores da Esteira (Tela 2). */
export type UrgenciaEsteira =
  | "todos"
  | "criticos"
  | "hoje"
  | "semana"
  | "em_dia";

/**
 * Parâmetros aceitos pela consulta do Kanban. O recorte (escopo e urgência)
 * é resolvido no serviço, nunca na tela.
 */
export interface ConsultaEsteira {
  escopo?: EscopoEsteira;
  /** `advogado_id` aplicado quando o escopo é `meus`. */
  advogadoId?: ID | null;
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
