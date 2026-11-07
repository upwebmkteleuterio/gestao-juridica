import { useMemo } from "react";
import { Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Alert, AnaliseBadge, Badge, Button, IconButton, Skeleton, SlidePanel } from "@/components/kit";
import { useIntimacaoDjenRaw } from "@/hooks";
import { formatarData, formatarDataHora, formatarNumeroProcesso, truncar } from "@/lib/format";

export interface PayloadPanelProps {
  payloadId: string | null;
  onClose: () => void;
}

function texto(valor: unknown): string {
  return typeof valor === "string" && valor.trim() ? valor : "—";
}

function urlSegura(valor: unknown): string | null {
  if (typeof valor !== "string" || !valor.trim()) return null;
  try {
    const url = new URL(valor);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

function listaDeRegistros(valor: unknown): Record<string, unknown>[] {
  return Array.isArray(valor) ? valor.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null && !Array.isArray(item)) : [];
}

function nomeOab(item: Record<string, unknown>) {
  const nome = texto(item.nome);
  const numero = texto(item.numeroOab ?? item.numero_oab ?? item.oab);
  const uf = texto(item.ufOab ?? item.uf_oab);
  const oab = numero === "—" ? "" : `${numero}${uf === "—" ? "" : `/${uf}`}`;
  return oab ? `${nome} · OAB ${oab}` : nome;
}

export function PayloadPanel({ payloadId, onClose }: PayloadPanelProps) {
  const query = useIntimacaoDjenRaw(payloadId ?? undefined);
  const payload = query.data ?? null;
  const jsonBruto = useMemo(() => (payload ? JSON.stringify(payload.payload_json, null, 2) : ""), [payload]);
  const json = payload?.payload_json;
  const destinatarios = listaDeRegistros(json?.destinatarios);
  const advogados = listaDeRegistros(json?.destinatarioadvogados);
  const dataDisponibilizacao = texto(json?.data_disponibilizacao ?? json?.datadisponibilizacao);
  const link = urlSegura(json?.link);
  const hashCertidao = typeof json?.hash === "string" && json.hash.trim() ? json.hash : "";

  async function copiarJson() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard indisponível");
      await navigator.clipboard.writeText(jsonBruto);
      toast.success("JSON bruto copiado.");
    } catch {
      toast.error("Não foi possível copiar.");
    }
  }

  return (
    <SlidePanel open={Boolean(payloadId)} onClose={onClose} eyebrow="Payload da API · Tela 3.2"
      titulo={payload?.djen_id_original ?? "Carregando payload…"}
      badge={payload ? <div className="flex flex-wrap items-center gap-2">
        <Badge variant="navy">{texto(json?.siglaTribunal)}</Badge>
        <Badge variant="neutral" title={payload.djen_hash}>{truncar(payload.djen_hash, 16)}</Badge>
        <AnaliseBadge status={payload.status_analise_ia} />
      </div> : null}
      acoes={payload ? <IconButton variant="ghost" size="icon-sm" aria-label="Copiar JSON bruto" onClick={copiarJson}>
        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
      </IconButton> : null}>
      {query.isLoading ? <div className="space-y-4"><Skeleton className="h-4 w-40" /><Skeleton className="h-24" /><Skeleton className="h-36" /></div>
        : query.isError || !payload ? <Alert severidade="danger" titulo="Não foi possível carregar o payload." />
          : <div className="space-y-6">
            <section>
              <h3 className="mb-3">Dados da comunicação</h3>
              <dl className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
                <div><dt className="label-kit">Tipo de comunicação</dt><dd className="mt-1 text-[11px]">{texto(json?.tipoComunicacao)}</dd></div>
                <div><dt className="label-kit">Classe</dt><dd className="mt-1 text-[11px]">{texto(json?.nomeClasse)}</dd></div>
                <div><dt className="label-kit">Órgão</dt><dd className="mt-1 text-[11px]">{texto(json?.nomeOrgao)}</dd></div>
                <div><dt className="label-kit">Meio</dt><dd className="mt-1 text-[11px]">{texto(json?.meio)}</dd></div>
                <div><dt className="label-kit">Data de disponibilização</dt><dd className="mt-1 text-[11px]">{formatarData(dataDisponibilizacao === "—" ? null : dataDisponibilizacao)}</dd></div>
                <div><dt className="label-kit">Nº do processo</dt><dd className="mt-1 text-[11px]">{formatarNumeroProcesso(texto(json?.numero_processo ?? json?.numeroprocessocommascara))}</dd></div>
                <div><dt className="label-kit">Data de captura</dt><dd className="mt-1 text-[11px]">{formatarDataHora(payload.criado_em)}</dd></div>
                <div className="sm:col-span-2"><dt className="label-kit">Link oficial</dt><dd className="mt-1 break-all text-[11px]">{link ? <a className="text-info underline" href={link} target="_blank" rel="noreferrer">{link}</a> : "—"}</dd></div>
                <div className="sm:col-span-2"><dt className="label-kit">Destinatários</dt><dd className="mt-1 flex flex-wrap gap-1.5">
                  {destinatarios.length ? destinatarios.map((item, indice) => <Badge key={`${texto(item.nome)}-${indice}`} variant="neutral">{texto(item.nome)}</Badge>) : <span className="text-[11px]">Não informado pela fonte</span>}
                </dd></div>
                <div className="sm:col-span-2"><dt className="label-kit">Advogados destinatários</dt><dd className="mt-1 flex flex-wrap gap-1.5">
                  {advogados.length ? advogados.map((item, indice) => <Badge key={`${texto(item.nome)}-${indice}`} variant="navy">{nomeOab(item)}</Badge>) : <span className="text-[11px]">Não informado pela fonte</span>}
                </dd></div>
                <div className="sm:col-span-2"><dt className="label-kit">Hash de verificação</dt><dd className="mt-1 break-all font-mono text-[10px]">{payload.djen_hash}</dd></div>
              </dl>
            </section>
            <section>
              <h3 className="mb-3">Payload completo</h3>
              <pre className="max-h-72 overflow-auto rounded-sm border border-border bg-secondary/50 p-4 font-mono text-[10px] leading-relaxed text-foreground">{jsonBruto}</pre>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <p className="text-[10px] text-muted-foreground">Resposta integral e inalterada da API do CNJ — conferência técnica.</p>
                <Button variant="secondary" onClick={copiarJson}><Copy className="h-3.5 w-3.5" aria-hidden="true" />Copiar JSON bruto</Button>
                <Button variant="primary" disabled={!hashCertidao} onClick={() => {
                  if (hashCertidao) window.open(`https://comunicaapi.pje.jus.br/api/v1/comunicacao/${encodeURIComponent(hashCertidao)}/certidao`, "_blank", "noopener,noreferrer");
                }}><ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />Abrir certidão</Button>
              </div>
            </section>
          </div>}
    </SlidePanel>
  );
}
