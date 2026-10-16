import { useMemo, useState } from "react";
import { Filter, Zap } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  AnaliseBadge,
  Badge,
  Button,
  DateRange,
  EmptyState,
  ErrorState,
  FormField,
  KpiCard,
  PageHeading,
  Pagination,
  Panel,
  PanelHeader,
  Select,
  Skeleton,
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
import { CapturaModal, PayloadPanel, PrazoConfigPanel, RoboConfigPanel } from "@/components/djen";
import {
  useAuditoriaDjen,
  useCapturasDjen,
  useConfiguracoes,
  useIndicadoresIngestaoDjen,
} from "@/hooks";
import { formatarData, formatarDataHora, truncar } from "@/lib/format";

const TAMANHO_PAGINA = 8;

export default function DjenMonitor() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { id } = useParams<{ id: string }>();
  const [oab, setOab] = useState("");
  const [disponibilizacaoDe, setDisponibilizacaoDe] = useState("");
  const [disponibilizacaoAte, setDisponibilizacaoAte] = useState("");
  const [pagina, setPagina] = useState(1);

  const configuracoes = useConfiguracoes();
  const indicadores = useIndicadoresIngestaoDjen();
  const capturas = useCapturasDjen();
  const consulta = useMemo(
    () => ({
      ...(oab ? { oab } : {}),
      ...(disponibilizacaoDe ? { disponibilizacaoDe } : {}),
      ...(disponibilizacaoAte ? { disponibilizacaoAte } : {}),
      pagina,
      tamanhoPagina: TAMANHO_PAGINA,
    }),
    [oab, disponibilizacaoDe, disponibilizacaoAte, pagina],
  );
  const consultaQuery = useAuditoriaDjen(consulta);
  const resultado = consultaQuery.data;
  const registros = resultado?.dados ?? [];
  const total = resultado?.total ?? 0;
  const totalPaginas = resultado?.totalPaginas ?? 1;
  const mesReferencia = indicadores.data?.mesReferencia ?? "";
  const [ano, mes] = mesReferencia.split("-");
  const filtrosAtivos = Boolean(oab || disponibilizacaoDe || disponibilizacaoAte);

  function limparFiltros() {
    setOab("");
    setDisponibilizacaoDe("");
    setDisponibilizacaoAte("");
    setPagina(1);
  }

  function alterarOab(valor: string) {
    setOab(valor);
    setPagina(1);
  }

  function alterarDataDe(valor: string) {
    setDisponibilizacaoDe(valor);
    setPagina(1);
  }

  function alterarDataAte(valor: string) {
    setDisponibilizacaoAte(valor);
    setPagina(1);
  }

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Consulta & captura DJEN · Tela 3"
        titulo="Log e Monitoramento da Ingestão DJEN"
        descricao="Auditoria das requisições disparadas à API pública do CNJ (/api/v1/comunicacao) e das publicações ingeridas no log bruto."
        acoes={
          <Button variant="primary" onClick={() => navigate("/djen/nova-consulta")}>
            <Zap className="h-3.5 w-3.5" aria-hidden="true" />
            Disparar consulta forçada
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          titulo="Taxa de sucesso da ingestão"
          valor={`${indicadores.data?.taxaSucesso ?? 0}%`}
          contexto="Requisições sem falha de análise"
          carregando={indicadores.isLoading}
        />
        <KpiCard
          titulo="Comunicações ingeridas no mês"
          valor={indicadores.data?.totalMes ?? 0}
          contexto={`Referência ${mes && ano ? `${mes}/${ano}` : "—"}`}
          carregando={indicadores.isLoading}
        />
        <KpiCard
          titulo="Consumo de rate limit"
          valor={indicadores.data?.rateLimitRestante ?? 0}
          contexto={`de ${indicadores.data?.rateLimitLimite ?? 0} requisições (x-ratelimit-remaining)`}
          carregando={indicadores.isLoading}
        />
      </div>

      <Panel>
        <PanelHeader titulo="Barra de ferramentas de auditoria" />
        <div className="grid gap-4 p-5 lg:grid-cols-[1fr_2fr_auto] lg:items-end">
          <FormField label="OAB pesquisada" htmlFor="djen-filtro-oab">
            <Select
              id="djen-filtro-oab"
              value={oab}
              onChange={(evento) => alterarOab(evento.target.value)}
            >
              <option value="">Todas as OABs monitoradas</option>
              {(configuracoes.data?.oabs_monitoradas ?? []).map((inscricao) => (
                <option key={inscricao} value={inscricao}>{inscricao}</option>
              ))}
            </Select>
          </FormField>
          <DateRange
            de={disponibilizacaoDe}
            ate={disponibilizacaoAte}
            onDeChange={alterarDataDe}
            onAteChange={alterarDataAte}
            idDe="djen-data-de"
            idAte="djen-data-ate"
            rotuloDe="Comunicação de"
            rotuloAte="Até"
          />
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <Button variant="secondary" onClick={() => navigate("/djen/nova-consulta")}>
              Disparar consulta forçada
            </Button>
            <Button variant="ghost" onClick={limparFiltros}>
              <Filter className="h-3.5 w-3.5" aria-hidden="true" />
              Limpar filtros
            </Button>
          </div>
        </div>
        <p className="px-5 pb-4 text-[10px] text-muted-foreground">
          Última captura: {indicadores.data?.ultimaCapturaEm ? formatarDataHora(indicadores.data.ultimaCapturaEm) : "sem capturas registradas"}
        </p>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel>
          <PanelHeader titulo="Execuções de captura" descricao="Histórico recente das consultas manuais e do robô." />
          {capturas.isLoading ? <div className="space-y-3 p-5">{Array.from({ length: 3 }, (_, indice) => <Skeleton key={indice} className="h-16" />)}</div>
            : capturas.isError ? <ErrorState titulo="Não foi possível carregar as execuções" descricao="Verifique a conexão e tente novamente." onRetry={() => capturas.refetch()} />
              : !capturas.data?.length ? <EmptyState titulo="Nenhuma execução registrada" descricao="Dispare a primeira consulta para começar a acompanhar as capturas." />
                : <div className="divide-y divide-border">
                  {capturas.data.map((captura) => {
                    const variante = captura.status === "falha" ? "danger" : captura.status === "parcial" ? "warning" : captura.status === "concluido" ? "success" : "neutral";
                    return <div key={captura.id} className="space-y-2 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <strong className="text-xs">{captura.oab_numero && captura.oab_uf ? `${captura.oab_numero}/${captura.oab_uf}` : captura.tribunal_sigla ?? "Consulta geral"}</strong>
                        <div className="flex flex-wrap gap-1.5"><Badge variant={variante}>{captura.status}</Badge>{captura.parcial ? <Badge variant="warning">parcial</Badge> : null}</div>
                      </div>
                      <p className="text-[10px] text-muted-foreground">Período: {captura.disponibilizacao_de ? formatarData(captura.disponibilizacao_de) : "—"} a {captura.disponibilizacao_ate ? formatarData(captura.disponibilizacao_ate) : "—"} · {captura.paginas_concluidas} páginas</p>
                      <p className="text-[10px] text-muted-foreground">{captura.itens_recebidos} recebidas · {captura.itens_novos} novas · {captura.itens_duplicados} duplicadas</p>
                      {captura.mensagem ? <p className="text-[10px] text-warning">{captura.mensagem}</p> : null}
                    </div>;
                  })}
                </div>}
        </Panel>
        <RoboConfigPanel />
      </div>

      <PrazoConfigPanel />

      <Panel>
        <TableToolbar
          titulo="Registros brutos da API do CNJ"
          descricao={`${total} ${total === 1 ? "registro" : "registros"} no recorte · página ${pagina} de ${totalPaginas}`}
        />
        {consultaQuery.isFetching && !consultaQuery.isLoading ? (
          <div className="px-5 pb-3">
            <Alert severidade="info" titulo="Atualizando a auditoria">
              Buscando o recorte solicitado.
            </Alert>
          </div>
        ) : null}
        <TableWrap>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>ID no DJEN</TableHeaderCell>
                <TableHeaderCell>Tribunal</TableHeaderCell>
                <TableHeaderCell>Órgão / vara</TableHeaderCell>
                <TableHeaderCell>Nº do processo</TableHeaderCell>
                <TableHeaderCell>Disponibilização</TableHeaderCell>
                <TableHeaderCell>Hash de unicidade</TableHeaderCell>
                <TableHeaderCell>Status IA</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {consultaQuery.isLoading ? Array.from({ length: 6 }, (_, linha) => (
                <TableRow key={`loading-${linha}`}>
                  {Array.from({ length: 7 }, (_, celula) => (
                    <TableCell key={celula}><Skeleton className="h-3 w-20" /></TableCell>
                  ))}
                </TableRow>
              )) : consultaQuery.isError ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-0">
                    <ErrorState
                      titulo="Não foi possível carregar o log de ingestão"
                      descricao="Verifique a conexão e tente novamente."
                      onRetry={() => consultaQuery.refetch()}
                    />
                  </TableCell>
                </TableRow>
              ) : registros.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-0">
                    <EmptyState
                      titulo="Nenhum registro no log de ingestão"
                      descricao="Não há publicações para os filtros selecionados."
                      acao={filtrosAtivos ? (
                        <Button variant="secondary" onClick={limparFiltros}>Limpar filtros</Button>
                      ) : (
                        <Button variant="primary" onClick={() => navigate("/djen/nova-consulta")}>
                          <Zap className="h-3.5 w-3.5" aria-hidden="true" />
                          Disparar consulta forçada
                        </Button>
                      )}
                    />
                  </TableCell>
                </TableRow>
              ) : registros.map((item) => (
                <TableRow
                  key={item.id}
                  className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  role="link"
                  tabIndex={0}
                  onClick={() => navigate(`/djen/payload/${item.id}`)}
                  onKeyDown={(evento) => {
                    if (evento.key === "Enter" || evento.key === " ") {
                      evento.preventDefault();
                      navigate(`/djen/payload/${item.id}`);
                    }
                  }}
                >
                  <TableCell className="font-medium">{item.djen_id_original}</TableCell>
                  <TableCell>{item.tribunal_sigla}</TableCell>
                  <TableCell>{item.orgao_julgador}</TableCell>
                  <TableCell>{item.numero_processo}</TableCell>
                  <TableCell>{formatarData(item.data_disponibilizacao)}</TableCell>
                  <TableCell>
                    <code className="font-mono text-[10px]" title={item.djen_hash}>
                      {truncar(item.djen_hash, 16)}
                    </code>
                  </TableCell>
                  <TableCell><AnaliseBadge status={item.status_analise_ia} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableWrap>
        <TableFooter>
          <span>{total} {total === 1 ? "registro" : "registros"} no recorte</span>
          <Pagination
            pagina={pagina}
            totalPaginas={totalPaginas}
            onAnterior={() => setPagina((atual) => Math.max(1, atual - 1))}
            onProxima={() => setPagina((atual) => Math.min(totalPaginas, atual + 1))}
          />
        </TableFooter>
      </Panel>

      <PayloadPanel payloadId={pathname.startsWith("/djen/payload/") ? id ?? null : null} onClose={() => navigate("/djen")} />
      <CapturaModal open={pathname === "/djen/nova-consulta"} onClose={() => navigate("/djen")} />
    </div>
  );
}
