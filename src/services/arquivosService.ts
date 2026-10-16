import { supabase } from "@/integrations/supabase/client";
import { mensagemDeErro } from "./erros";

export async function enviarComprovante(tarefaId: string, arquivo: File): Promise<string> {
  const nomeOriginal = arquivo.name;
  const pontoExtensao = nomeOriginal.lastIndexOf(".");
  const extensaoOriginal = pontoExtensao >= 0 ? nomeOriginal.slice(pontoExtensao + 1) : "";
  const extensao = extensaoOriginal.toLowerCase().replace(/[^a-z0-9]/g, "") || "pdf";
  const nomeSemExtensao = pontoExtensao >= 0 ? nomeOriginal.slice(0, pontoExtensao) : nomeOriginal;
  const slug = nomeSemExtensao
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "comprovante";
  const caminho = `${tarefaId}/${Date.now()}-${slug}.${extensao}`;
  const { error } = await supabase.storage
    .from("recibos-protocolo")
    .upload(caminho, arquivo, { contentType: arquivo.type || "application/pdf" });
  if (error) throw new Error(mensagemDeErro(error));
  return caminho;
}

export async function obterUrlComprovante(caminho: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from("recibos-protocolo")
    .createSignedUrl(caminho, 300);
  if (error) throw new Error(mensagemDeErro(error));
  return data.signedUrl;
}
