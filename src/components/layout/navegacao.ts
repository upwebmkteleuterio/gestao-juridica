import {
  Kanban,
  LayoutDashboard,
  Radar,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { PerfilUsuario } from "@/types";

export interface ItemNavegacao {
  para: string;
  rotulo: string;
  icone: LucideIcon;
  /** Perfis que enxergam o módulo (Mapa de Fluxo 1.1). */
  perfis: PerfilUsuario[];
  /** Chave de contagem exibida no item. */
  contagem?: "pendentes" | "tarefas";
}

export interface GrupoNavegacao {
  titulo: string;
  itens: ItemNavegacao[];
}

/** Estrutura da sidebar — módulos do Mapa de Fluxo com a estética do UI Kit. */
export const GRUPOS_NAVEGACAO: GrupoNavegacao[] = [
  {
    titulo: "Operação",
    itens: [
      {
        para: "/painel",
        rotulo: "Painel do gestor",
        icone: LayoutDashboard,
        perfis: ["admin", "advogado"],
        contagem: "pendentes",
      },
      {
        para: "/esteira",
        rotulo: "Esteira de prazos",
        icone: Kanban,
        perfis: ["admin", "advogado"],
        contagem: "tarefas",
      },
      {
        para: "/djen",
        rotulo: "Consulta & captura DJEN",
        icone: Radar,
        perfis: ["admin"],
      },
    ],
  },
  {
    titulo: "Escritório",
    itens: [
      {
        para: "/equipe",
        rotulo: "Advogados & cargas",
        icone: Users,
        perfis: ["admin"],
      },
    ],
  },
];

/** Descrição curta de cada módulo (usada no contexto e nas telas). */
export const DESCRICAO_MODULOS: Record<string, string> = {
  "/painel":
    "Indicadores, caixa de entrada centralizada e organização da pauta.",
  "/esteira":
    "Kanban da produção por responsável, da fila ao protocolo.",
  "/djen":
    "Monitoramento das capturas oficiais, OABs e auditoria dos payloads.",
  "/equipe":
    "Cadastro da equipe, elegibilidade e controle de carga operacional.",
};
