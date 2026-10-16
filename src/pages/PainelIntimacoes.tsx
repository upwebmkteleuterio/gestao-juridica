import {
  CalendarClock,
  ChevronRight,
  Download,
  Filter,
  Inbox,
  Shuffle,
  UserRoundCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  Alert,
  Badge,
  BulkSelectionBar,
  Button,
  CapacityMeter,
  Checkbox,
  DateRange,
  DeadlineBadge,
  EmptyState,
  ErrorState,
  FormField,
  KpiCard,
  PageHeading,
  Pagination,
  Panel,
  PanelHeader,
  PessoaTag,
  SearchInput,
  SegmentedControl,
  Select,
  Skeleton,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableToolbar,
  TableWrap,
} from "@/components/kit";
import { DetalhePublicacaoPanel, DistribuicaoModal } from "@/components/painel";
import {
  useAdvogados,
  useCapacidadeOperacional,
  useConsultaIntimacoes,
  useExportarIntimacoes,
  useIndicadoresIntimacoes,
  useIntimacoesPendentes,
  useTribunaisIntimacoes,
  useValorDebounced,
} from "@/hooks";
import { contarDiasUteis } from "@/lib/datas";
import { baixarArquivo, gerarCsv } from "@/lib/exportar";
import { formatarData, truncar } from "@/lib/format";
import { useUsuarioAtual } from "@/hooks";
import { useUiStore } from "@/store";
import type { ConsultaIntimacoes, ID } from "@/types";

const TAMANHO_PAGINA = 8;
const COLUNAS = 9;

/**
 * Tela 1 — Painel de Intimações.
 * Filtros, busca e paginação são resolvidos no serviço (nunca na tela).
 */
export default function PainelIntimacoes() {
  const usuario = useUsuarioAtual();
  const filtros = useUiStore((estado) => estado.filtrosPainel);
  const setFiltros = useUiStore((estado) => estado.setFiltrosPainel);
  const limparFiltros = useUiStore((estado) => estado.limparFiltrosPainel);
  const preferenciasIniciadas = useUiStore(
    (estado) => estado.preferenciasIniciadas,
  );
  const marcarPreferenciasIniciadas = useUiStore(
    (estado) => estado.marcarPreferenciasIniciadas,
  );

  const [pagina, setPagina] = useState(1);
  const [selecionadas, setSelecionadas] = useState<ID[]>([]);

  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { id: publicacaoId } = useParams<{ id: string }>();

  const buscaDebounced = useValorDebounced(filtros.busca, 350);
  const rotaDistribuicao = pathname === "/painel/distribuicao";

  /* Preferência inicial: advogado começa em "Minha pauta". */
  useEffect(() => {
    if (preferenciasIniciadas || !usuario) return;
    setFiltros({ apenasMinhaPauta: usuario.perfil === "advogado" });
    marcarPreferenciasIniciadas();
  }, [preferenciasIniciadas, usuario, setFiltros, marcarPreferenciasIniciadas]);

  /* Toda alteração de recorte volta para a primeira página. */
  useEffect(() => {
    setPagina(1);
    setSelecionadas([]);
  }, [
    buscaDebounced,
    filtros.tribunal,
    filtros.disponibilizacaoDe,
    filtros.disponibilizacaoAte,
    filtros.apenasMinhaPauta,
  ]);

  const recorte: Omit<ConsultaIntimacoes, "pagina" | "tamanhoPagina"> =
    useMemo(
      () => ({
        busca: buscaDebounced,
        tribunal: filtros.tribunal,
        disponibilizacaoDe: filtros.disponibilizacaoDe,
        disponibilizacaoAte: filtros.disponibilizacaoAte,
        advogadoId: filtros.apenasMinhaPauta ? (usuario?.id ?? null) : null,
        ordenacao: { campo: "data_disponibilizacao", direcao: "desc" },
      }),
      [buscaDebounced, filtros, usuario?.id],
    );

  const consulta = useMemo<ConsultaIntimacoes>(
    () => ({ ...recorte, pagina, tamanhoPagina: TAMANHO_PAGINA }),
    [recorte, pagina],
  );

  const lista = useConsultaIntimacoes(consulta);
  const indicadores = useIndicadoresIntimacoes();
  const tribunais = useTribunaisIntimacoes();
  const capacidade = useCapacidadeOperacional();
  const { data: advogados } = useAdvogados();
  const exportar = useExportarIntimacoes();

  const pendentes = useIntimacoesPendentes(recorte, rotaDistribuicao);

  const itens = lista.data?.dados ?? [];
  const total = lista.data?.total ?? 0;
  const totalPaginas = lista.data?.totalPaginas ?? 1;
  const ehAdmin = usuario?.perfil === "admin";

  const nomePorId = useMemo(
    () => new Map((advogados ?? []).map((item) => [item.id, item.nome_completo])),
    [advogados],
  );

  const todasVisiveisSelecionadas =
    itens.length > 0 && itens.every((item) => selecionadas.includes(item.id));
  const algumaSelecionada = itens.some((item) => selecionadas.includes(item.id));

  const loteIds: ID[] =
    selecionadas.length > 0
      ? selecionadas
      : (pendentes.data ?? []).map((item) => item.id);

  function alternarLinha(id: ID) {
    setSelecionadas((atual) =>
      atual.includes(id) ? atual.filter((item) => item !== id) : [...atual, id],
    );
  }

  function abrirDetalhe(id: ID) {
    navigate(`/painel/publicacao/${id}`);
  }

  async function executarExportacao() {
    try {
      const dados = await exportar.mutateAsync(recorte);
      if (dados.length === 0) {
        toast.error("Nenhuma publicação no recorte para exportar.");
        return;
      }
      const conteudo = gerarCsv(
        [
          "Processo",
          "Tribunal",
          "Órgão / Vara",
          "Disponibilização",
          "Ação sugerida (IA)",
          "Prazo fatal sugerido",
          "Dias úteis",
          "Responsável",
          "Status",
        ],
        dados.map((item) => [
          item.numero_processo,
          item.tribunal_sigla,
          item.orgao_julgador,
          formatarData(item.data_disponibilizacao),
          item.acao_sugerida_ia,
          item.data_fatal_calculada
            ? formatarData(item.data_fatal_calculada)
            : "Não identificado",
          String(
            contarDiasUteis(
              item.data_disponibilizacao,
              item.data_fatal_calculada,
            ) ?? "",
          ),
          item.advogado_id
            ? (nomePorId.get(item.advogado_id) ?? "Atribuído")
            : "Não atribuído",
          item.status_fluxo,
        ]),
      );
      baixarArquivo("MG-painel-intimacoes.csv", conteudo);
      toast.success(
        `${dados.length} publicações exportadas em CSV (compatível com Excel).`,
      );
    } catch {
      toast.error("Não foi possível exportar o recorte.");
    }
  }

  const recorteAtivo =
    Boolean(buscaDebounced) ||
    Boolean(filtros.tribunal) ||
    Boolean(filtros.disponibilizacaoDe) ||
    Boolean(filtros.disponibilizacaoAte);

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Painel do gestor · Tela 1"
        titulo="Painel de Intimações"
        descricao="Ponto de triagem diária das comunicações processuais ingeridas automaticamente do DJEN. Centraliza novas publicações e permite auditar a classificação gerada pela IA."
        acoes={
          <>
            {ehAdmin ? (
              <Button
                variant="primary"
                onClick={() => navigate("/painel/distribuicao")}
              >
                <Shuffle className="h-3.5 w-3.5" aria-hidden="true" />
                Distribuir em lote
              </Button>
            ) : null}
            <Button
              variant="secondary"
              loading={exportar.isPending}
              onClick={executarExportacao}
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              Exportar planilha
            </Button>
          </>
        }
      />

      {/* Bloco de 4 métricas */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          titulo="Novas intimações hoje"
          valor={indicadores.data?.novasHoje ?? 0}
          contexto={
            indicadores.data
              ? `Captura de ${formatarData(indicadores.data.dataReferencia)}`
              : "Consolidado do dia"
          }
          icone={<Inbox className="h-4 w-4" aria-hidden="true" />}
          carregando={indicadores.isLoading}
        />
        <KpiCard
          titulo="Prazos críticos da semana"
          valor={indicadores.data?.criticosSemana ?? 0}
          contexto="Fatais nos próximos 7 dias"
          tom="urgent"
          selo={<Badge variant="danger">urgência</Badge>}
          carregando={indicadores.isLoading}
        />
        <KpiCard
          titulo="Pendentes de atribuição"
          valor={indicadores.data?.pendentesAtribuicao ?? 0}
          contexto="Em triagem e sem responsável"
          selo={<Badge variant="warning">a distribuir</Badge>}
          icone={<UserRoundCheck className="h-4 w-4" aria-hidden="true" />}
          carregando={indicadores.isLoading}
        />
        <KpiCard
          titulo="Capacidade operacional"
          contexto="Tarefas ativas por advogado"
          icone={<CalendarClock className="h-4 w-4" aria-hidden="true" />}
          carregando={capacidade.isLoading}
          conteudo={
            <CapacityMeter
              compacto
              itens={(capacidade.data ?? []).slice(0, 4)}
              vazio="Nenhuma tarefa ativa na esteira."
            />
          }
        />
      </div>

      {/* Filtros rápidos */}
      <Panel>
        <PanelHeader
          titulo="Filtros rápidos"
          descricao="Busca, tribunal e período são aplicados sobre as publicações capturadas."
          acoes={
            <SegmentedControl
              valor={filtros.apenasMinhaPauta ? "minha" : "todas"}
              onChange={(valor) =>
                setFiltros({ apenasMinhaPauta: valor === "minha" })
              }
              ariaLabel="Visão da listagem"
              opcoes={[
                { valor: "todas", rotulo: "Todas as intimações" },
                { valor: "minha", rotulo: "Minha pauta" },
              ]}
            />
          }
        />
        <div className="grid gap-4 p-5 lg:grid-cols-4">
          <FormField
            label="Busca instantânea"
            htmlFor="filtro-busca"
            className="lg:col-span-2"
          >
            <SearchInput
              id="filtro-busca"
              value={filtros.busca}
              onChange={(evento) => setFiltros({ busca: evento.target.value })}
              placeholder="Processo, parte ou termo"
            />
          </FormField>
          <FormField label="Tribunal / órgão" htmlFor="filtro-tribunal">
            <Select
              id="filtro-tribunal"
              value={filtros.tribunal}
              onChange={(evento) => setFiltros({ tribunal: evento.target.value })}
            >
              <option value="">Todos os tribunais</option>
              {(tribunais.data ?? []).map((sigla) => (
                <option key={sigla} value={sigla}>
                  {sigla}
                </option>
              ))}
            </Select>
          </FormField>
          <DateRange
            de={filtros.disponibilizacaoDe}
            ate={filtros.disponibilizacaoAte}
            onDeChange={(valor) => setFiltros({ disponibilizacaoDe: valor })}
            onAteChange={(valor) => setFiltros({ disponibilizacaoAte: valor })}
            idDe="filtro-de"
            idAte="filtro-ate"
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3">
          <span className="text-[10px] text-muted-foreground">
            {recorteAtivo
              ? "Recorte ativo aplicado na consulta."
              : "Nenhum filtro aplicado — exibindo o recorte completo."}
          </span>
          <Button variant="ghost" onClick={limparFiltros}>
            <Filter className="h-3.5 w-3.5" aria-hidden="true" />
            Limpar filtros
          </Button>
        </div>
      </Panel>

      {/* Data grid */}
      <Panel className="overflow-hidden">
        <TableToolbar
          titulo="Caixa de entrada de intimações"
          descricao={
            lista.isLoading
              ? "Consultando publicações…"
              : `${total} publicações no recorte · página ${lista.data?.pagina ?? 1} de ${totalPaginas}`
          }
          acoes={
            <Badge variant="neutral">
              {selecionadas.length} selecionadas
            </Badge>
          }
        />

        {selecionadas.length > 0 ? (
          <div className="px-5 pb-3">
            <BulkSelectionBar
              selecionados={selecionadas.length}
              onLimpar={() => setSelecionadas([])}
            >
              {ehAdmin ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate("/painel/distribuicao")}
                >
                  <Shuffle className="h-3.5 w-3.5" aria-hidden="true" />
                  Distribuir selecionadas
                </Button>
              ) : null}
            </BulkSelectionBar>
          </div>
        ) : null}

        <TableWrap>
          <Table aria-label="Intimações capturadas do DJEN">
            <TableHead>
              <TableRow className="hover:bg-transparent">
                <TableHeaderCell className="w-10">
                  <Checkbox
                    aria-label="Selecionar publicações visíveis"
                    checked={todasVisiveisSelecionadas}
                    indeterminate={algumaSelecionada && !todasVisiveisSelecionadas}
                    onChange={(evento) =>
                      setSelecionadas(
                        evento.target.checked
                          ? itens.map((item) => item.id)
                          : [],
                      )
                    }
                    disabled={itens.length === 0}
                  />
                </TableHeaderCell>
                <TableHeaderCell>Nº do processo</TableHeaderCell>
                <TableHeaderCell>Órgão / vara</TableHeaderCell>
                <TableHeaderCell>Disponibilização</TableHeaderCell>
                <TableHeaderCell>Ação identificada pela IA</TableHeaderCell>
                <TableHeaderCell>Prazo fatal sugerido</TableHeaderCell>
                <TableHeaderCell>Responsável</TableHeaderCell>
                <TableHeaderCell>Status do fluxo</TableHeaderCell>
                <TableHeaderCell className="w-12" />
              </TableRow>
            </TableHead>
            <TableBody>
              {lista.isLoading ? (
                Array.from({ length: 6 }).map((_, indice) => (
                  <TableRow key={`skeleton-${indice}`} className="hover:bg-transparent">
                    {Array.from({ length: COLUNAS }).map((__, coluna) => (
                      <TableCell key={`celula-${coluna}`}>
                        <Skeleton className={coluna === 0 ? "w-4" : "w-24"} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : lista.isError ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={COLUNAS} className="p-0">
                    <ErrorState
                      titulo="Não foi possível carregar as intimações"
                      descricao="A consulta falhou ou excedeu o tempo de resposta. Os filtros foram preservados."
                      onRetry={() => lista.refetch()}
                    />
                  </TableCell>
                </TableRow>
              ) : itens.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={COLUNAS} className="p-0">
                    <EmptyState
                      titulo="Nenhuma intimação encontrada"
                      descricao={
                        recorteAtivo
                          ? "Nenhum registro corresponde ao recorte atual. Ajuste os filtros ou amplie o período."
                          : "Ainda não há publicações capturadas para este perfil."
                      }
                      acao={
                        <Button variant="secondary" onClick={limparFiltros}>
                          Limpar filtros
                        </Button>
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                itens.map((item) => {
                  const responsavel = item.advogado_id
                    ? nomePorId.get(item.advogado_id)
                    : undefined;
                  const dias = contarDiasUteis(
                    item.data_disponibilizacao,
                    item.data_fatal_calculada,
                  );
                  return (
                    <TableRow
                      key={item.id}
                      className={`cursor-pointer ${
                        selecionadas.includes(item.id) ? "bg-secondary/50" : ""
                      }`}
                      onClick={() => abrirDetalhe(item.id)}
                    >
                      <TableCell onClick={(evento) => evento.stopPropagation()}>
                        <Checkbox
                          aria-label={`Selecionar ${item.numero_processo}`}
                          checked={selecionadas.includes(item.id)}
                          onChange={() => alternarLinha(item.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-2">
                          <strong className="text-[11px] font-semibold">
                            {item.numero_processo}
                          </strong>
                          <Badge variant="neutral">{item.tribunal_sigla}</Badge>
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[220px] whitespace-normal text-[11px]">
                        {truncar(item.orgao_julgador, 25)}
                      </TableCell>
                      <TableCell className="text-[11px]">
                        {formatarData(item.data_disponibilizacao)}
                      </TableCell>
                      <TableCell className="max-w-[200px] whitespace-normal text-[11px]">
                        {item.acao_sugerida_ia}
                      </TableCell>
                      <TableCell>
                        <DeadlineBadge
                          dataFatal={item.data_fatal_calculada}
                          rotulo={
                            item.data_fatal_calculada
                              ? `${formatarData(item.data_fatal_calculada)}${
                                  dias !== null ? ` · ${dias}d úteis` : ""
                                }`
                              : "Não identificado"
                          }
                        />
                      </TableCell>
                      <TableCell>
                        {responsavel ? (
                          <PessoaTag nome={responsavel} />
                        ) : (
                          <Badge variant="neutral">Não atribuído</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={item.status_fluxo} />
                      </TableCell>
                      <TableCell onClick={(evento) => evento.stopPropagation()}>
                        <Button
                          variant="secondary"
                          size="icon-sm"
                          aria-label={`Abrir detalhes de ${item.numero_processo}`}
                          onClick={() => abrirDetalhe(item.id)}
                        >
                          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableWrap>

        <TableFooter>
          <span>
            {lista.isLoading
              ? "Carregando…"
              : `${total} publicações · exibindo ${itens.length} nesta página`}
          </span>
          <Pagination
            pagina={lista.data?.pagina ?? pagina}
            totalPaginas={totalPaginas}
            onAnterior={() => setPagina((valor) => Math.max(1, valor - 1))}
            onProxima={() =>
              setPagina((valor) => Math.min(totalPaginas, valor + 1))
            }
          />
        </TableFooter>
      </Panel>

      {lista.isFetching && !lista.isLoading ? (
        <Alert severidade="info" titulo="Atualizando o recorte">
          Consultando as publicações com os filtros e a página atuais…
        </Alert>
      ) : null}

      {/* Tela 1.1 — Distribuição automática */}
      <DistribuicaoModal
        open={rotaDistribuicao}
        onClose={() => navigate("/painel")}
        intimacaoIds={loteIds}
        origem={selecionadas.length > 0 ? "selecao" : "filtro"}
        carregandoLote={pendentes.isLoading && selecionadas.length === 0}
        onConfirmado={() => {
          setSelecionadas([]);
          setPagina(1);
        }}
      />

      {/* Tela 1.2 — Detalhamento & análise IA */}
      <DetalhePublicacaoPanel
        intimacaoId={publicacaoId ?? null}
        onClose={() => navigate("/painel")}
      />
    </div>
  );
}
