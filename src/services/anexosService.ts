import { supabase } from "@/integrations/supabase/client";
import type { Anexo, AnexoVinculo } from "@/types";
import { mensagemDeErro } from "./erros";

function slugArquivo(nome: string): string {
  const ponto = nome.lastIndexOf(".");
  const extensao = ponto >= 0 ? nome.slice(ponto + 1).toLowerCase().replace(/[^a-z0-9]/g, "") : "";
  const base = (ponto >= 0 ? nome.slice(0, ponto) : nome).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "arquivo";
  return extensao ? `${base}.${extensao}` : base;
}

export const anexosService = {
  async listar(vinculo: AnexoVinculo): Promise<Anexo[]> {
    const coluna = "tarefa_id" in vinculo ? "tarefa_id" : "intimacao_id";
    const { data, error } = await supabase.from("anexos").select("*").eq(coluna, vinculo[coluna]).order("criado_em", { ascending: false });
    if (error) throw new Error(mensagemDeErro(error));
    return (data ?? []) as Anexo[];
  },

  async criar(vinculo: AnexoVinculo, arquivo: File, enviadoPor: string | null): Promise<Anexo> {
    const prefixo = "tarefa_id" in vinculo ? `tarefas/${vinculo.tarefa_id}` : `publicacoes/${vinculo.intimacao_id}`;
    const caminho = `${prefixo}/${Date.now()}-${crypto.randomUUID()}-${slugArquivo(arquivo.name)}`;
    const storage = supabase.storage.from("recibos-protocolo");
    const upload = await storage.upload(caminho, arquivo, { contentType: arquivo.type || "application/octet-stream" });
    if (upload.error) throw new Error(mensagemDeErro(upload.error));
    const { data, error } = await supabase.from("anexos").insert({
      ...vinculo,
      caminho,
      nome_arquivo: arquivo.name,
      tipo_arquivo: arquivo.type || null,
      tamanho_bytes: arquivo.size,
      enviado_por: enviadoPor,
    }).select("*").single();
    if (error) {
      await storage.remove([caminho]);
      throw new Error(mensagemDeErro(error));
    }
    return data as Anexo;
  },

  async remover(anexo: Anexo): Promise<void> {
    const { error: erroLinha } = await supabase.from("anexos").delete().eq("id", anexo.id);
    if (erroLinha) throw new Error(mensagemDeErro(erroLinha));
    const { error } = await supabase.storage.from("recibos-protocolo").remove([anexo.caminho]);
    if (error) throw new Error(mensagemDeErro(error));
  },

  async obterUrl(caminho: string): Promise<string> {
    const { data, error } = await supabase.storage.from("recibos-protocolo").createSignedUrl(caminho, 300);
    if (error) throw new Error(mensagemDeErro(error));
    return data.signedUrl;
  },
};
