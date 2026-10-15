import { useMemo } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import {
  Alert,
  AnaliseBadge,
  Badge,
  Button,
  IconButton,
  Skeleton,
  SlidePanel,
} from "@/components/kit";
import { useIntimacaoDjenRaw } from "@/hooks";
import { formatarData, formatarDataHora, truncar } from "@/lib/format";

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

export function PayloadPanel({ payloadId, onClose }: PayloadPanelProps) {
  const query = useIntimacaoDjenRaw(payloadId ?? undefined);
  const payload = query.data ?? null;
  const jsonBruto = useMemo(
    () => (payload ? JSON.stringify(payload.payload_json, null, 2) : ""),
    [payload],
  );
  const json = payload?.payload_json;
  const advogados = Array.isArray(json?.advogados)
    ? json.advogados.filter(
        (item): item is Record<string, unknown> =>
          typeof item === "object" && item !== null && !Array.isArray(item),
      )
    : [];
  const dataDisponibilizacao = texto(json?.data_disponibilizacao);
  const link = urlSegura(json?.link);

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
    <SlidePanel
      open={Boolean(payloadId)}
      onClose={onClose}
      eyebrow="Payload da API · Tela 3.2"
      titulo={payload?.djen_id_original ?? "Carregando payload…"}
      badge={payload ? (
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="navy">{texto(json?.siglaTribunal)}</Badge>
          <Badge variant="neutral" title={payload.djen_hash}>
            {truncar(payload.djen_hash, 16)}
          </Badge>
          <AnaliseBadge status={payload.status_analise_ia} />
        </div>
      ) : null}
      acoes={payload ? (
        <IconButton
          variant="ghost"
          size="icon-sm"
          aria-label="Copiar JSON bruto"
          onClick={copiarJson}
        >
          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
        </IconButton>
      ) : null}
    >
      {query.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-24" />
          <Skeleton className="h-36" />
        </div>
      ) : query.isError || !payload ? (
        <Alert severidade="danger" titulo="Não foi possível carregar o payload." />
      ) : (
        <div className="space-y-6">
          <section>
            <h3 className="mb-3">Metadados técnicos</h3>
            <dl className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
              <div>
                <dt className="label-kit">Meio de comunicação</dt>
                <dd className="mt-1 text-[11px]">{texto(json?.meio)}</dd>
              </div>
              <div>
                <dt className="label-kit">Data de envio</dt>
                <dd className="mt-1 text-[11px]">{formatarDataHora(payload.criado_em)}</dd>
              </div>
              <div>
                <dt className="label-kit">Tipo de comunicação</dt>
                <dd className="mt-1 text-[11px]">{texto(json?.tipoComunicacao)}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="label-kit">Destinatário / advogado nominal</dt>
                <dd className="mt-1 flex flex-wrap gap-1.5">
                  {advogados.length > 0 ? advogados.map((advogado, indice) => {
                    const nome = texto(advogado.nome);
                    const oab = texto(advogado.oab);
                    return (
                      <Badge key={`${nome}-${oab}-${indice}`} variant="navy">
                        {nome} · {oab}
                      </Badge>
                    );
                  }) : <span className="text-[11px]">Não informado pela fonte</span>}
                </dd>
              </div>
              <div>
                <dt className="label-kit">Data de disponibilização</dt>
                <dd className="mt-1 text-[11px]">{formatarData(dataDisponibilizacao === "—" ? null : dataDisponibilizacao)}</dd>
              </div>
              <div>
                <dt className="label-kit">Órgão / vara</dt>
                <dd className="mt-1 text-[11px]">{texto(json?.nomeOrgao)}</dd>
              </div>
              <div>
                <dt className="label-kit">Classe</dt>
                <dd className="mt-1 text-[11px]">{texto(json?.nomeClasse)}</dd>
              </div>
              <div>
                <dt className="label-kit">Nº do processo</dt>
                <dd className="mt-1 text-[11px]">{texto(json?.numero_processo)}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="label-kit">Link oficial</dt>
                <dd className="mt-1 text-[11px]">
                  {link ? <a className="text-info underline break-all" href={link} target="_blank" rel="noreferrer">{link}</a> : "—"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="label-kit">Hash de verificação completo</dt>
                <dd className="mt-1 break-all font-mono text-[10px]">{payload.djen_hash}</dd>
              </div>
            </dl>
          </section>

          <section>
            <h3 className="mb-3">Payload completo</h3>
            <pre className="max-h-72 overflow-auto rounded-sm border border-border bg-secondary/50 p-4 font-mono text-[10px] leading-relaxed text-foreground">{jsonBruto}</pre>
            <div className="mt-3 flex flex-col gap-3">
              <p className="text-[10px] text-muted-foreground">Resposta integral e inalterada da API do CNJ — apenas conferência técnica.</p>
              <Button variant="secondary" onClick={copiarJson}>
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                Copiar JSON bruto
              </Button>
            </div>
          </section>
        </div>
      )}
    </SlidePanel>
  );
}
