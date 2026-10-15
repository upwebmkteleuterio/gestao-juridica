import type { ConfiguracaoSistema } from "@/types";

/** Linha única da tabela `configuracoes_sistema` (id = 1). */
export const configuracoesSistemaMock: ConfiguracaoSistema = {
  id: 1,
  oabs_monitoradas: ["197254/RJ", "204812/SP"],
  horario_cron_djen: "06:00",
  ia_modelo: "deepseek-chat",
  ia_system_prompt:
    "Você é assistente jurídico do escritório Magalhães & Gomes. Leia o teor da publicação oficial e retorne: (1) resumo objetivo do despacho; (2) ação/providência sugerida; (3) prazo explícito citado no texto, quando houver; (4) trecho que fundamenta a extração; (5) pendências. Não invente prazos: se o texto não indicar prazo, responda 'Não identificado'. A contagem e a data fatal devem ser sempre conferidas por um advogado responsável.",
  updated_at: "2026-10-15T06:00:00-03:00",
};
