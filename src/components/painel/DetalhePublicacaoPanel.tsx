import {
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Send,
  Sparkles,
  Undo2,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Alert,
  Badge,
  Button,
  FormField,
  IconButton,
  Input,
  Select,
  Skeleton,
  SlidePanel,
  StatusBadge,
  Textarea,
} from "@/components/kit";
import {
  useAdvogados,
  useDispensarIntimacao,
  useEnviarParaEsteira,
  useIntimacao,
  useIntimacaoDjenRaw,
  useReativarIntimacao,
  useRegistrarEvento,
} from "@/hooks";
import { contarDiasUteis } from "@/lib/datas";
import { formatarData } from "@/lib/format";
import { useAuthStore } from "@/store";

export interface DetalhePublicacaoPanelProps {
  intimacaoId: string | null;
  onClose: () => void;
}

function texto(valor: unknown): string {
  return typeof valor === "string" && valor.trim() ? valor : "—";
}

/**
 * Tela 1.2 — Detalhamento da Publicação & Análise IA (SlidePanel).
 * A barra de ações do rodapé muda conforme o `status_fluxo` da intimação.
 */
export function DetalhePublicacaoPanel({
  intimacaoId,
  onClose,
}: DetalhePublicacaoPanelProps) {
  const aberto = Boolean(intimacaoId);
  const usuario = useAuthStore((estado) => estado.usuario);

  const intimacaoQuery = useIntimacao(intimacaoId ?? undefined);
  const intimacao = intimacaoQuery.data ?? null;
  const rawQuery = useIntimacaoDjenRaw(intimacao?.raw_id);
  const payload = rawQuery.data?.payload_json;

  const { data: advogados } = useAdvogados();
  const enviar = useEnviarParaEsteira();
  const dispensar = useDispensarIntimacao();
  const reativar = useReativarIntimacao();
  const registrarEvento = useRegistrarEvento();

  /* Rascunho editável do parecer da IA */
  const [acao, setAcao] = useState("");
  const [resumo, setResumo] = useState("");
  const [fatal, setFatal] = useState("");
  const [advogadoId, setAdvogadoId] = useState("");
  const [erroAdvogado, setErroAdvogado] = useState<string>();
  const [teorExpandido, setTeorExpandido] = useState(false);

  useEffect(() => {
    if (!intimacao) return;
    setAcao(intimacao.acao_sugerida_ia);
    setResumo(intimacao.resumo_ia);
    setFatal(intimacao.data_fatal_calculada ?? "");
    setAdvogadoId(intimacao.advogado_id ?? "");
    setErroAdvogado(undefined);
    setTeorExpandido(false);
  }, [intimacao]);

  const status = intimacao?.status_fluxo;
  const diasUteis = contarDiasUteis(
    intimacao?.data_disponibilizacao,
    fatal || intimacao?.data_fatal_calculada,
  );
  const prazoDivergente = Boolean(
    intimacao && fatal !== (intimacao.data_fatal_calculada ?? ""),
  );
  const partes = useMemo(() => {
    const destinatarios = payload?.destinatarios;
    if (!Array.isArray(destinatarios)) {
      return { ativo: "—", passivo: "—" };
    }
    const buscar = (polo: string) =>
      (destinatarios.find(
        (item) => (item as { polo?: string })?.polo === polo,
      ) as { nome?: string })?.nome ?? "—";
    return { ativo: buscar("A"), passivo: buscar("P") };
  }, [payload]);

  const citados = useMemo(() => {
    const lista = payload?.advogados;
    if (!Array.isArray(lista)) return [] as { nome: string; oab: string }[];
    return lista as { nome: string; oab: string }[];
  }, [payload]);

  function copiar(valor: string, mensagem: string) {
    navigator.clipboard
      ?.writeText(valor)
      .then(() => toast.success(mensagem))
      .catch(() => toast.error("Não foi possível copiar."));
  }

  function auditar(acaoNome: string, antes: string | null, depois: string | null) {
    if (!intimacao) return;
    registrarEvento.mutate({
      ator_id: usuario?.id ?? null,
      entidade: "intimacao",
      entidade_id: intimacao.id,
      acao: acaoNome,
      antes,
      depois,
    });
  }

  /* ---------------- Ações (lógica condicional por status) ---------------- */

  async function salvarEEnviar() {
    if (!intimacao) return;
    if (!advogadoId) {
      setErroAdvogado("Selecione o advogado responsável para continuar.");
      return;
    }
    setErroAdvogado(undefined);

    try {
      await enviar.mutateAsync({
        id: intimacao.id,
        acao_sugerida_ia: acao.trim() || intimacao.acao_sugerida_ia,
        resumo_ia: resumo.trim() || intimacao.resumo_ia,
        data_fatal_calculada: fatal || null,
        advogado_id: advogadoId,
      });

      if (prazoDivergente) {
        auditar(
          "prazo_divergente",
          intimacao.data_fatal_calculada,
          fatal || null,
        );
      }
      auditar(
        "enviado_para_esteira",
        intimacao.status_fluxo,
        "fila",
      );

      toast.success("Alterações salvas e intimação enviada para a esteira.");
      onClose();
    } catch (erro) {
      toast.error(
        erro instanceof Error ? erro.message : "Falha ao salvar alterações.",
      );
    }
  }

  async function dispensarIntimacao() {
    if (!intimacao) return;
    try {
      await dispensar.mutateAsync(intimacao.id);
      auditar("intimacao_dispensada", intimacao.status_fluxo, "dispensado");
      toast.success("Intimação dispensada como ciência, sem gerar prazo.");
      onClose();
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Falha ao dispensar.");
    }
  }

  async function reativarIntimacao() {
    if (!intimacao) return;
    try {
      await reativar.mutateAsync(intimacao.id);
      auditar("intimacao_reativada", "dispensado", "triagem");
      toast.success("Intimação devolvida para a triagem.");
      onClose();
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Falha ao reativar.");
    }
  }

  const ocupado =
    enviar.isPending || dispensar.isPending || reativar.isPending;

  /* ---------------- Rodapé condicional ---------------- */
  const rodape = (() => {
    if (status === "triagem") {
      return (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="primary"
            loading={enviar.isPending}
            disabled={ocupado}
            onClick={salvarEEnviar}
          >
            <Send className="h-3.5 w-3.5" aria-hidden="true" />
            Salvar alterações e enviar para esteira
          </Button>
          <Button
            variant="danger"
            disabled={ocupado}
            onClick={dispensarIntimacao}
          >
            <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
            Dispensar intimação
          </Button>
        </div>
      );
    }
    if (status === "fila") {
      return (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="primary"
            loading={enviar.isPending}
            disabled={ocupado}
            onClick={salvarEEnviar}
          >
            <Send className="h-3.5 w-3.5" aria-hidden="true" />
            Salvar alterações
          </Button>
          <Button variant="secondary" onClick={onClose} disabled={ocupado}>
            Fechar
          </Button>
        </div>
      );
    }
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          loading={reativar.isPending}
          disabled={ocupado}
          onClick={reativarIntimacao}
        >
          <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
          Reativar na triagem
        </Button>
        <Button variant="ghost" onClick={onClose} disabled={ocupado}>
          Fechar
        </Button>
      </div>
    );
  })();

  return (
    <SlidePanel
      open={aberto}
      onClose={onClose}
      eyebrow="Detalhe da publicação · Tela 1.2"
      titulo={intimacao?.numero_processo ?? "Carregando publicação…"}
      badge={
        intimacao ? (
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="neutral">{intimacao.tribunal_sigla}</Badge>
            <StatusBadge status={intimacao.status_fluxo} />
            <Badge variant={prazoDivergente ? "warning" : "gold"}>
              {prazoDivergente
                ? "Prazo ajustado manualmente"
                : "Prazo sugerido pela IA"}
            </Badge>
          </div>
        ) : null
      }
      acoes={
        intimacao ? (
          <IconButton
            variant="ghost"
            size="icon-sm"
            aria-label="Copiar número do processo"
            onClick={() =>
              copiar(
                intimacao.numero_processo.replace(/\D/g, ""),
                "Número do processo copiado sem formatação.",
              )
            }
          >
            <Copy className="h-3.5 w-3.5" />
          </IconButton>
        ) : null
      }
      footer={intimacao ? rodape : null}
    >
      {intimacaoQuery.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : intimacaoQuery.isError || !intimacao ? (
        <Alert severidade="danger" titulo="Não foi possível carregar a publicação">
          A publicação pode ter sido removida. Feche o painel e tente novamente.
        </Alert>
      ) : (
        <div className="space-y-6">
          {status === "triagem" ? (
            <Alert severidade="warning" titulo="Aguardando conferência humana">
              O prazo extraído pela IA permanece pendente até a validação. A
              contagem e a data fatal não são confirmadas pela máquina.
            </Alert>
          ) : null}

          {/* Parecer da IA — campos editáveis */}
          <section>
            <p className="eyebrow mb-3 flex items-center gap-2 text-gold-600 dark:text-gold-400">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Parecer da IA · DeepSeek
            </p>
            <div className="space-y-4">
              <FormField
                label="Ação jurídica sugerida"
                htmlFor="painel-acao"
                hint="Editável. A sugestão da máquina pode ser ajustada."
              >
                <Input
                  id="painel-acao"
                  value={acao}
                  onChange={(evento) => setAcao(evento.target.value)}
                />
              </FormField>

              <FormField
                label="Prazo fatal calculado"
                htmlFor="painel-fatal"
                hint={
                  diasUteis !== null
                    ? `${diasUteis} dias úteis após a disponibilização (aproximado, sem feriados).`
                    : "A fonte não indicou prazo — informe manualmente se houver."
                }
              >
                <Input
                  id="painel-fatal"
                  type="date"
                  value={fatal}
                  onChange={(evento) => setFatal(evento.target.value)}
                />
              </FormField>

              <FormField
                label="Resumo do despacho"
                htmlFor="painel-resumo"
                hint="Explicação mastigada; não substitui o teor original."
              >
                <Textarea
                  id="painel-resumo"
                  rows={4}
                  value={resumo}
                  onChange={(evento) => setResumo(evento.target.value)}
                />
              </FormField>
            </div>
          </section>

          <div className="border-t border-border" />

          {/* Metadados estruturados do DJEN — somente leitura */}
          <section>
            <p className="label-kit mb-3">Metadados do DJEN</p>
            <dl className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
              {[
                { rotulo: "Órgão julgador", valor: intimacao.tribunal_sigla },
                { rotulo: "Vara / órgão", valor: intimacao.orgao_julgador },
                {
                  rotulo: "Meio de comunicação",
                  valor: texto(payload?.meio),
                },
                {
                  rotulo: "Disponibilização",
                  valor: formatarData(intimacao.data_disponibilizacao),
                },
                { rotulo: "Polo ativo", valor: partes.ativo },
                { rotulo: "Polo passivo", valor: partes.passivo },
              ].map((item) => (
                <div key={item.rotulo}>
                  <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {item.rotulo}
                  </dt>
                  <dd className="mt-0.5 text-[11px] font-medium">
                    {item.valor}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-4">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Advogados citados
              </p>
              {rawQuery.isLoading ? (
                <Skeleton className="mt-2 h-3 w-40" />
              ) : citados.length > 0 ? (
                <ul className="mt-1 flex flex-wrap gap-2">
                  {citados.map((advogado) => (
                    <li key={`${advogado.nome}-${advogado.oab}`}>
                      <Badge variant="navy">
                        {advogado.nome} · {advogado.oab}
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Não informado pela fonte.
                </p>
              )}
            </div>

            {typeof payload?.link === "string" ? (
              <a
                href={payload.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-semibold text-info hover:underline"
              >
                Abrir inteiro teor oficial
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            ) : null}
          </section>

          <div className="border-t border-border" />

          {/* Teor integral bruto — bloco expansível */}
          <section>
            <div className="flex items-center justify-between gap-3">
              <p className="label-kit">Teor integral bruto</p>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    copiar(
                      typeof payload?.texto === "string" ? payload.texto : "",
                      "Inteiro teor copiado.",
                    )
                  }
                  disabled={typeof payload?.texto !== "string"}
                >
                  <Copy className="h-3 w-3" aria-hidden="true" />
                  Copiar inteiro teor
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={teorExpandido ? "Recolher teor" : "Expandir teor"}
                  onClick={() => setTeorExpandido((valor) => !valor)}
                >
                  {teorExpandido ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
            {rawQuery.isLoading ? (
              <Skeleton className="mt-3 h-20" />
            ) : teorExpandido ? (
              <blockquote className="mt-3 border-l-2 border-border pl-4 font-serif text-[13px] leading-relaxed text-muted-foreground">
                {texto(payload?.texto)}
              </blockquote>
            ) : (
              <p className="mt-3 line-clamp-3 text-[12px] leading-relaxed text-muted-foreground">
                {texto(payload?.texto)}
              </p>
            )}
          </section>

          <div className="border-t border-border" />

          {/* Atribuição */}
          <section>
            <p className="label-kit mb-3">Atribuição e encaminhamento</p>
            <FormField
              label="Advogado responsável"
              htmlFor="painel-responsavel"
              error={erroAdvogado}
              hint={
                status === "triagem"
                  ? "Obrigatório para enviar a intimação à esteira."
                  : undefined
              }
            >
              <Select
                id="painel-responsavel"
                value={advogadoId}
                onChange={(evento) => {
                  setAdvogadoId(evento.target.value);
                  setErroAdvogado(undefined);
                }}
                aria-invalid={Boolean(erroAdvogado) || undefined}
              >
                <option value="">Não atribuído</option>
                {advogados?.map((advogado) => (
                  <option key={advogado.id} value={advogado.id}>
                    {advogado.nome_completo} · {advogado.oab_uf}
                  </option>
                ))}
              </Select>
            </FormField>

            {prazoDivergente ? (
              <Alert
                severidade="warning"
                titulo="Divergência registrada na auditoria"
                className="mt-4"
              >
                A data foi alterada de{" "}
                {formatarData(intimacao.data_fatal_calculada)} para{" "}
                {fatal ? formatarData(fatal) : "não identificada"}.
              </Alert>
            ) : null}
          </section>
        </div>
      )}
    </SlidePanel>
  );
}
