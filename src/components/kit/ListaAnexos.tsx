import { useRef } from "react";
import { ExternalLink, Paperclip, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useCriarAnexo, useAnexos, useRemoverAnexo, useUrlAnexo, useUsuarioAtual } from "@/hooks";
import type { AnexoVinculo } from "@/types";
import { Button } from "./Button";
import { Skeleton } from "./Skeleton";
import { formatarDataHora } from "@/lib/format";

const ACEITOS = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp", "image/gif"]);
const EXTENSOES = /\.(pdf|png|jpe?g|webp|gif)$/i;

function tamanho(bytes: number | null): string {
  if (bytes === null) return "—";
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ListaAnexos({ vinculo, rotulo = "Anexos" }: { vinculo: AnexoVinculo; rotulo?: string }) {
  const arquivoInput = useRef<HTMLInputElement>(null);
  const usuario = useUsuarioAtual();
  const anexos = useAnexos(vinculo);
  const criar = useCriarAnexo(vinculo);
  const remover = useRemoverAnexo(vinculo);
  const url = useUrlAnexo();

  async function selecionarArquivos(arquivos: File[]) {
    for (const arquivo of arquivos) {
      if (!ACEITOS.has(arquivo.type) && !EXTENSOES.test(arquivo.name)) {
        toast.error(`${arquivo.name}: anexe um PDF ou uma imagem (PNG, JPG, WEBP ou GIF).`);
        continue;
      }
      if (arquivo.size > 10 * 1024 * 1024) {
        toast.error(`${arquivo.name}: o arquivo deve ter no máximo 10 MB.`);
        continue;
      }
      try {
        await criar.mutateAsync({ arquivo, enviadoPor: usuario?.id ?? null });
      } catch (erro) {
        toast.error(erro instanceof Error ? erro.message : `Não foi possível enviar ${arquivo.name}.`);
      }
    }
  }

  async function abrir(caminho: string) {
    try {
      const signedUrl = await url.mutateAsync(caminho);
      window.open(signedUrl, "_blank", "noopener,noreferrer");
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível abrir o anexo.");
    }
  }

  async function excluir(id: string) {
    const anexo = anexos.data?.find((item) => item.id === id);
    if (!anexo) return;
    try {
      await remover.mutateAsync(anexo);
      toast.success("Anexo removido.");
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível remover o anexo.");
    }
  }

  return (
    <div className="space-y-3">
      <input
        ref={arquivoInput}
        type="file"
        multiple
        accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,application/pdf,image/png,image/jpeg,image/webp,image/gif"
        className="sr-only"
        aria-label={`Selecionar ${rotulo.toLowerCase()}`}
        onChange={(evento) => {
          /* A lista de arquivos do input é viva: precisa ser copiada antes de
             limpar o campo, senão os arquivos escolhidos se perdem. */
          const arquivos = Array.from(evento.target.files ?? []);
          evento.target.value = "";
          void selecionarArquivos(arquivos);
        }}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] text-muted-foreground">PDF e imagens · até 10 MB por arquivo</p>
        <Button type="button" variant="secondary" size="sm" loading={criar.isPending} onClick={() => arquivoInput.current?.click()}>
          <Paperclip className="h-3.5 w-3.5" aria-hidden="true" />Anexar arquivos
        </Button>
      </div>
      {anexos.isLoading ? <Skeleton className="h-14" /> : anexos.isError ? <p className="text-[10px] text-danger">Não foi possível carregar os anexos.</p> : null}
      {!anexos.isLoading && !anexos.isError && (anexos.data?.length ?? 0) === 0 ? <p className="text-[10px] text-muted-foreground">Nenhum arquivo anexado.</p> : null}
      <ul className="space-y-2">
        {(anexos.data ?? []).map((anexo) => (
          <li key={anexo.id} className="flex flex-wrap items-center justify-between gap-2 rounded-sm border border-border p-2 text-[10px]">
            <div className="min-w-0">
              <strong className="block truncate">{anexo.nome_arquivo}</strong>
              <span className="text-muted-foreground">{formatarDataHora(anexo.criado_em)} · {tamanho(anexo.tamanho_bytes)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="sm" onClick={() => void abrir(anexo.caminho)}><ExternalLink className="h-3 w-3" aria-hidden="true" />Abrir</Button>
              <Button type="button" variant="ghost" size="sm" aria-label={`Remover ${anexo.nome_arquivo}`} disabled={remover.isPending} onClick={() => void excluir(anexo.id)}><Trash2 className="h-3 w-3" aria-hidden="true" />Remover</Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
