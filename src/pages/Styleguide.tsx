import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  Download,
  Filter,
  LayoutDashboard,
  Plus,
  Radar,
  RefreshCw,
  Shuffle,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  AIReviewBadge,
  Alert,
  Avatar,
  Badge,
  Button,
  ConfirmDialog,
  DateRange,
  DeadlineBadge,
  EmptyState,
  ErrorState,
  EtapaBadge,
  FormField,
  IconButton,
  Input,
  KpiCard,
  Modal,
  PageHeading,
  Pagination,
  Panel,
  PanelHeader,
  PessoaTag,
  SearchInput,
  SectionHeading,
  SegmentedControl,
  Select,
  Skeleton,
  SlidePanel,
  StatusBadge,
  Switch,
  SwitchRow,
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableToolbar,
  TableWrap,
  Textarea,
} from "@/components/kit";
import { ThemeToggle } from "@/components/layout";
import { useTheme } from "@/hooks";
import { advogadosMock, intimacoesMock } from "@/mocks";
import { formatarData, formatarOab, truncar } from "@/lib/format";

const PALETA = [
  { nome: "Navy profundo", hex: "#101D30", uso: "Navegação" },
  { nome: "Navy institucional", hex: "#172940", uso: "Ações" },
  { nome: "Dourado da marca", hex: "#C5A15C", uso: "Detalhes" },
  { nome: "Cinza ambiente", hex: "#F5F6F8", uso: "Fundo" },
  { nome: "Branco superfície", hex: "#FFFFFF", uso: "Conteúdo" },
];

const AMOSTRAS = intimacoesMock.slice(0, 5);

/** Playground do UI Kit: validação visual de todos os componentes extraídos. */
export default function Styleguide() {
  const { tema } = useTheme();
  const [painelAberto, setPainelAberto] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [confirmAberto, setConfirmAberto] = useState(false);
  const [selecionadas, setSelecionadas] = useState<string[]>([]);
  const [pagina, setPagina] = useState(1);
  const [escopo, setEscopo] = useState<"meus" | "geral">("geral");
  const [busca, setBusca] = useState("");
  const [tribunal, setTribunal] = useState("");
  const [de, setDe] = useState("2026-10-15");
  const [ate, setAte] = useState("2026-10-15");
  const [capturaAtiva, setCapturaAtiva] = useState(true);

  const todasMarcadas =
    AMOSTRAS.length > 0 && AMOSTRAS.every((item) => selecionadas.includes(item.id));

  function alternarLinha(id: string) {
    setSelecionadas((atual) =>
      atual.includes(id) ? atual.filter((item) => item !== id) : [...atual, id],
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-[1240px] px-5 py-8 sm:px-8 sm:py-12">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/painel"
            className="inline-flex items-center gap-2 text-[11px] font-semibold text-info hover:underline"
          >
            <ArrowRight className="h-3.5 w-3.5 rotate-180" aria-hidden="true" />
            Voltar para o sistema
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant="neutral">UI Kit 1.0 · playground temporário</Badge>
            <Badge variant="gold">Tema atual: {tema === "dark" ? "escuro" : "claro"}</Badge>
            <ThemeToggle />
          </div>
        </div>

        <PageHeading
          eyebrow="Design system / validação"
          titulo="Playground do UI Kit"
          descricao="Todos os componentes reutilizáveis extraídos do kit anexo, renderizados lado a lado para conferência visual de fidelidade."
        />

        {/* 01 — Fundamentos */}
        <section className="mt-12">
          <SectionHeading
            indice="01"
            titulo="Fundamentos da marca"
            descricao="Tokens centralizados em tailwind.config.ts e globals.css."
            acoes={<span className="label-kit">Tokens / identidade</span>}
          />
          <Panel className="p-6">
            <p className="label-kit mb-4">Paleta principal</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {PALETA.map((cor) => (
                <div key={cor.hex}>
                  <div
                    className="mb-2 h-16 rounded-sm border border-border/60"
                    style={{ background: cor.hex }}
                  />
                  <strong className="block text-[11px] font-semibold">
                    {cor.nome}
                  </strong>
                  <code className="block text-[10px] text-muted-foreground">
                    {cor.hex} · {cor.uso}
                  </code>
                </div>
              ))}
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Alert severidade="success" titulo="Conclusão" />
              <Alert severidade="warning" titulo="Atenção e conferência" />
              <Alert severidade="danger" titulo="Prazo crítico e falha" />
              <Alert severidade="info" titulo="Informação e redação" />
            </div>
          </Panel>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <Panel className="p-6">
              <p className="label-kit mb-5">Tipografia / Segoe UI</p>
              <div className="space-y-4">
                <div>
                  <p className="text-[30px] font-semibold leading-tight tracking-tight">
                    Pauta com clareza.
                  </p>
                  <span className="text-[10px] text-muted-foreground">
                    Display / 30–44
                  </span>
                </div>
                <div>
                  <h2>Gestão de publicações</h2>
                  <span className="text-[10px] text-muted-foreground">
                    Título / 22–24
                  </span>
                </div>
                <div>
                  <p className="text-[13px]">
                    Cada processo, no seu devido lugar.
                  </p>
                  <span className="text-[10px] text-muted-foreground">
                    Corpo / 13–14
                  </span>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">
                    Atualizado em 15 out. 2026 · 09:42
                  </p>
                  <span className="text-[10px] text-muted-foreground">
                    Auxiliar / 11–12
                  </span>
                </div>
              </div>
            </Panel>

            <Panel className="p-6">
              <p className="label-kit mb-4">Espaçamento, raios e sombras</p>
              <div className="flex items-end gap-3">
                {[4, 8, 12, 16, 24, 32, 48].map((valor) => (
                  <div
                    key={valor}
                    className="min-w-[26px] rounded-t-sm border-t-2 border-gold-500 bg-navy-100 text-center text-[9px] dark:bg-navy-800"
                    style={{ height: 16 + valor }}
                  >
                    {valor}
                  </div>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-sm border border-border px-3 py-1 text-[10px]">
                  Raio 6 px (sm)
                </span>
                <span className="rounded-md border border-border px-3 py-1 text-[10px]">
                  Raio 10 px (md)
                </span>
                <span className="rounded-lg border border-border px-3 py-1 text-[10px]">
                  Raio 16 px (lg)
                </span>
                <span className="rounded-md border border-border px-3 py-1 text-[10px] shadow-panel">
                  Sombra panel
                </span>
              </div>
            </Panel>
          </div>
        </section>

        {/* 02 — Ações */}
        <section className="mt-14">
          <SectionHeading
            indice="02"
            titulo="Ações & estados"
            descricao="Hierarquia consistente para decisões rápidas e seguras."
          />
          <div className="grid gap-5 lg:grid-cols-2">
            <Panel className="p-6">
              <p className="label-kit mb-4">Botões</p>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary">
                  <Shuffle className="h-3.5 w-3.5" aria-hidden="true" />
                  Distribuir pauta
                </Button>
                <Button variant="secondary">
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  Exportar fila
                </Button>
                <Button variant="gold">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  Analisar com IA
                </Button>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button variant="ghost">
                  Ver publicação
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
                <Button variant="danger">
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Remover vínculo
                </Button>
                <Button variant="primary" loading>
                  Processando…
                </Button>
                <Button variant="primary" disabled>
                  Desabilitado
                </Button>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button size="sm">Pequeno</Button>
                <Button size="md">Médio</Button>
                <Button size="lg" variant="primary">
                  Grande
                </Button>
                <IconButton variant="secondary" aria-label="Filtrar">
                  <Filter className="h-4 w-4" />
                </IconButton>
                <IconButton variant="secondary" size="icon-sm" aria-label="Alertas">
                  <Bell className="h-3.5 w-3.5" />
                </IconButton>
              </div>
              <p className="mt-4 font-mono text-[10px] text-muted-foreground">
                Button · primary / secondary / gold / ghost / danger / disabled /
                loading · IconButton
              </p>
            </Panel>

            <Panel className="p-6">
              <p className="label-kit mb-4">Status, prazos e prioridades</p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="danger">Prazo hoje</Badge>
                <Badge variant="warning">Vence em 2 dias</Badge>
                <Badge variant="info">Em redação</Badge>
                <Badge variant="success">Protocolado</Badge>
                <Badge variant="navy">Institucional</Badge>
                <Badge variant="neutral">Sem responsável</Badge>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <StatusBadge status="triagem" />
                <StatusBadge status="fila" />
                <StatusBadge status="dispensado" />
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <EtapaBadge etapa="fila" />
                <EtapaBadge etapa="redacao" />
                <EtapaBadge etapa="revisao" />
                <EtapaBadge etapa="pronto_protocolo" />
                <EtapaBadge etapa="concluido" />
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <DeadlineBadge dataFatal="2026-10-16" />
                <DeadlineBadge dataFatal="2026-10-20" />
                <DeadlineBadge dataFatal="2026-12-01" />
                <DeadlineBadge dataFatal={null} />
                <AIReviewBadge conferido={false} />
                <AIReviewBadge conferido />
              </div>
              <p className="mt-4 font-mono text-[10px] text-muted-foreground">
                Badge · StatusBadge · EtapaBadge · DeadlineBadge · AIReviewBadge
              </p>
            </Panel>
          </div>
        </section>

        {/* 03 — Inputs */}
        <section className="mt-14">
          <SectionHeading
            indice="03"
            titulo="Inputs, busca & filtros"
            descricao="O contexto certo antes de começar a operação."
          />
          <Panel className="p-6">
            <div className="grid gap-4 md:grid-cols-4">
              <FormField
                label="Buscar publicação"
                htmlFor="sg-busca"
                className="md:col-span-2"
              >
                <SearchInput
                  id="sg-busca"
                  value={busca}
                  onChange={(evento) => setBusca(evento.target.value)}
                  placeholder="Processo, parte ou palavra-chave"
                />
              </FormField>
              <FormField label="Tribunal" htmlFor="sg-tribunal">
                <Select
                  id="sg-tribunal"
                  value={tribunal}
                  onChange={(evento) => setTribunal(evento.target.value)}
                >
                  <option value="">Todos os tribunais</option>
                  <option value="TJSP">TJSP</option>
                  <option value="TJRJ">TJRJ</option>
                  <option value="TRT-2">TRT-2</option>
                </Select>
              </FormField>
              <FormField
                label="OAB monitorada"
                htmlFor="sg-oab"
                hint="UF confirmada no cadastro da equipe."
              >
                <Input id="sg-oab" defaultValue="197254" inputMode="numeric" />
              </FormField>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-4">
              <DateRange
                de={de}
                ate={ate}
                onDeChange={setDe}
                onAteChange={setAte}
                idDe="sg-de"
                idAte="sg-ate"
                className="md:col-span-2"
              />
              <FormField
                label="Campo com erro"
                htmlFor="sg-erro"
                error="Informe o responsável para continuar."
                required
              >
                <Input
                  id="sg-erro"
                  placeholder="Selecione um responsável"
                  aria-invalid="true"
                />
              </FormField>
              <FormField
                label="Observações"
                htmlFor="sg-obs"
                hint="Apontamentos da tese."
              >
                <Textarea
                  id="sg-obs"
                  rows={2}
                  placeholder="Ex.: revisar tese de juros abusivos."
                />
              </FormField>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Badge variant="neutral">OAB monitorada · 197254</Badge>
                <span className="text-[10px] text-muted-foreground">
                  Filtra apenas as publicações fictícias deste kit.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setBusca("");
                    setTribunal("");
                    setDe("");
                    setAte("");
                  }}
                >
                  Limpar
                </Button>
                <Button variant="primary" onClick={() => toast.success("Filtros aplicados.")}>
                  <Filter className="h-3.5 w-3.5" aria-hidden="true" />
                  Aplicar filtros
                </Button>
              </div>
            </div>

            <div className="mt-5 border-t border-border pt-5">
              <p className="label-kit mb-3">Alternadores</p>
              <SwitchRow
                id="sg-switch-1"
                titulo="Captura automática"
                descricao="Preferência local. Sem execução agendada."
              />
              <SwitchRow
                id="sg-switch-2"
                titulo="Alertas de prazo"
                descricao="Destacar os cards com prazo crítico."
              />
              <div className="flex items-center gap-3 pt-3">
                <Switch
                  id="sg-switch-3"
                  checked={capturaAtiva}
                  onChange={(evento) => setCapturaAtiva(evento.target.checked)}
                />
                <label htmlFor="sg-switch-3" className="text-[11px]">
                  Switch isolado ({capturaAtiva ? "ligado" : "desligado"})
                </label>
                <Switch id="sg-switch-4" disabled defaultChecked />
                <label htmlFor="sg-switch-4" className="text-[11px]">
                  Desabilitado
                </label>
              </div>
            </div>
            <p className="mt-4 font-mono text-[10px] text-muted-foreground">
              FormField · Input · Textarea · Select · SearchInput · DateRange ·
              Switch · SwitchRow
            </p>
          </Panel>
        </section>

        {/* 04 — Painel */}
        <section className="mt-14">
          <SectionHeading
            indice="04"
            titulo="Painel, cards & tabela"
            descricao="Volume, urgência e responsabilidade em uma única leitura."
            acoes={
              <SegmentedControl
                valor={escopo}
                onChange={(valor) => setEscopo(valor as "geral" | "meus")}
                ariaLabel="Visão do playground"
                opcoes={[
                  { valor: "geral", rotulo: "Visão do sócio" },
                  { valor: "meus", rotulo: "Minha pauta" },
                ]}
              />
            }
          />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              titulo="Publicações capturadas"
              valor="48"
              contexto="Hoje · base ilustrativa"
              icone={<Radar className="h-4 w-4" aria-hidden="true" />}
            />
            <KpiCard
              titulo="Aguardando distribuição"
              valor="23"
              contexto="Prontas para compor a pauta"
              icone={<Shuffle className="h-4 w-4" aria-hidden="true" />}
            />
            <KpiCard
              titulo="Prazos críticos"
              valor="04"
              contexto="Na pauta já atribuída"
              tom="urgent"
            />
            <KpiCard
              titulo="Protocolados na semana"
              valor="17"
              contexto="Etapa concluída pela equipe"
              tom="success"
            />
            <KpiCard
              titulo="Carregando…"
              valor=""
              contexto="Placeholder de skeleton"
              carregando
            />
          </div>

          <Panel className="mt-5 overflow-hidden">
            <TableToolbar
              titulo="Caixa de entrada"
              descricao="Amostra de 5 publicações fictícias."
              acoes={
                <>
                  <Badge variant="neutral">
                    {selecionadas.length} selecionadas
                  </Badge>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => toast.success("Exportação CSV simulada.")}
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    Exportar CSV
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setModalAberto(true)}
                  >
                    <Shuffle className="h-3.5 w-3.5" aria-hidden="true" />
                    Distribuir
                  </Button>
                </>
              }
            />
            <TableWrap>
              <Table>
                <TableHead>
                  <TableRow className="hover:bg-transparent">
                    <TableHeaderCell className="w-10">
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 accent-[hsl(var(--primary))]"
                        aria-label="Selecionar todas"
                        checked={todasMarcadas}
                        onChange={(evento) =>
                          setSelecionadas(
                            evento.target.checked
                              ? AMOSTRAS.map((item) => item.id)
                              : [],
                          )
                        }
                      />
                    </TableHeaderCell>
                    <TableHeaderCell>Processo / parte</TableHeaderCell>
                    <TableHeaderCell>Tribunal</TableHeaderCell>
                    <TableHeaderCell>Ação identificada pela IA</TableHeaderCell>
                    <TableHeaderCell>Prazo fatal sugerido</TableHeaderCell>
                    <TableHeaderCell>Responsável</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {AMOSTRAS.map((item) => {
                    const advogado = advogadosMock.find(
                      (pessoa) => pessoa.id === item.advogado_id,
                    );
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            className="h-3.5 w-3.5 accent-[hsl(var(--primary))]"
                            aria-label={`Selecionar ${item.numero_processo}`}
                            checked={selecionadas.includes(item.id)}
                            onChange={() => alternarLinha(item.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <strong className="block text-[11px] font-semibold">
                            {item.numero_processo}
                          </strong>
                          <small className="block text-[10px] text-muted-foreground">
                            {truncar(item.orgao_julgador, 28)}
                          </small>
                        </TableCell>
                        <TableCell>
                          <Badge variant="neutral">{item.tribunal_sigla}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[220px] whitespace-normal">
                          {item.acao_sugerida_ia}
                        </TableCell>
                        <TableCell>
                          <DeadlineBadge
                            dataFatal={item.data_fatal_calculada}
                            rotulo={`${formatarData(item.data_fatal_calculada)}`}
                          />
                        </TableCell>
                        <TableCell>
                          {advogado ? (
                            <PessoaTag nome={advogado.nome_completo} />
                          ) : (
                            <span className="text-muted-foreground">
                              Não atribuído
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={item.status_fluxo} />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            variant="secondary"
                            size="icon-sm"
                            aria-label={`Abrir ${item.numero_processo}`}
                            onClick={() => setPainelAberto(true)}
                          >
                            <ArrowRight className="h-3.5 w-3.5" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableWrap>
            <TableFooter>
              <span>5 publicações nesta amostra</span>
              <Pagination
                pagina={pagina}
                totalPaginas={3}
                onAnterior={() => setPagina((valor) => Math.max(1, valor - 1))}
                onProxima={() => setPagina((valor) => Math.min(3, valor + 1))}
              />
            </TableFooter>
          </Panel>
        </section>

        {/* 05 — Cards e painel lateral */}
        <section className="mt-14">
          <SectionHeading
            indice="05"
            titulo="Cards, painéis e sobreposições"
            descricao="Detalhes sem perder o contexto da operação."
          />
          <div className="grid gap-5 lg:grid-cols-3">
            {advogadosMock.slice(0, 3).map((advogado) => (
              <Panel key={advogado.id} className="p-5">
                <div className="flex items-start gap-3">
                  <Avatar nome={advogado.nome_completo} tamanho="lg" />
                  <div className="min-w-0 flex-1">
                    <strong className="block truncate text-[12px] font-semibold">
                      {advogado.nome_completo}
                    </strong>
                    <span className="block text-[10px] text-muted-foreground">
                      {advogado.cargo}
                    </span>
                    <Badge
                      variant={
                        advogado.ativo_distribuicao ? "success" : "neutral"
                      }
                      className="mt-2"
                    >
                      {advogado.ativo_distribuicao
                        ? "Ativo na distribuição"
                        : "Pausado / férias"}
                    </Badge>
                  </div>
                </div>
                <div className="mt-4 border-t border-border pt-4 text-[10px] text-muted-foreground">
                  <p>{formatarOab(advogado.oab_numero, advogado.oab_uf)}</p>
                  <p className="truncate">{advogado.email_corporativo}</p>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-sm bg-secondary/60 py-2">
                    <strong className="block text-[15px]">07</strong>
                    <span className="text-[9px] text-muted-foreground">
                      Em aberto
                    </span>
                  </div>
                  <div className="rounded-sm bg-danger-bg py-2 text-danger">
                    <strong className="block text-[15px]">02</strong>
                    <span className="text-[9px]">Críticos</span>
                  </div>
                  <div className="rounded-sm bg-success-bg py-2 text-success">
                    <strong className="block text-[15px]">11</strong>
                    <span className="text-[9px]">No mês</span>
                  </div>
                </div>
                <Button variant="secondary" className="mt-4 w-full">
                  Editar advogado
                </Button>
              </Panel>
            ))}
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <Panel>
              <PanelHeader
                titulo="Painel com cabeçalho"
                descricao="PanelHeader · título, descrição e ações."
                icone={<LayoutDashboard className="h-4 w-4" aria-hidden="true" />}
                acoes={<Badge variant="gold">Somente gestor</Badge>}
              />
              <div className="space-y-3 p-5">
                <Alert severidade="info" titulo="Consulta em andamento">
                  Buscando o período selecionado. O progresso considera as
                  páginas recebidas.
                </Alert>
                <Alert severidade="danger" titulo="Fonte temporariamente indisponível">
                  Preservar a fila existente e registrar a falha.
                </Alert>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button variant="primary" onClick={() => setPainelAberto(true)}>
                    Abrir painel lateral
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                  <Button variant="secondary" onClick={() => setModalAberto(true)}>
                    Abrir modal
                  </Button>
                  <Button variant="danger" onClick={() => setConfirmAberto(true)}>
                    Confirmar ação
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      toast("Distribuição concluída na simulação.")
                    }
                  >
                    Disparar toast
                  </Button>
                </div>
              </div>
            </Panel>

            <Panel className="p-5">
              <p className="label-kit mb-3">Estados de sistema</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-sm border border-border">
                  <EmptyState
                    titulo="Sua fila está em dia"
                    descricao="Nenhuma publicação para o período."
                    acao={
                      <Button variant="secondary" size="sm">
                        Limpar filtros
                      </Button>
                    }
                  />
                </div>
                <div className="rounded-sm border border-border">
                  <ErrorState
                    titulo="Não foi possível sincronizar"
                    descricao="A última fila foi preservada."
                    onRetry={() => toast.error("Nova tentativa simulada.")}
                  />
                </div>
              </div>
              <div className="mt-4 space-y-2 rounded-sm border border-border p-4">
                <p className="label-kit">Carregamento</p>
                <div className="flex items-center gap-3">
                  <span className="h-8 w-8 shrink-0 rounded-full bg-secondary" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="w-2/3" />
                    <Skeleton className="w-1/3" />
                  </div>
                </div>
                <Skeleton />
                <Skeleton className="w-4/5" />
              </div>
            </Panel>
          </div>
        </section>

        {/* 06 — Perfis */}
        <section className="mt-14 pb-16">
          <SectionHeading
            indice="06"
            titulo="Perfis de acesso"
            descricao="Contrato de permissões por perfil."
          />
          <Panel className="overflow-hidden">
            <TableWrap>
              <Table>
                <TableHead>
                  <TableRow className="hover:bg-transparent">
                    <TableHeaderCell>Perfil</TableHeaderCell>
                    <TableHeaderCell>Publicações</TableHeaderCell>
                    <TableHeaderCell>Distribuição</TableHeaderCell>
                    <TableHeaderCell>Produção</TableHeaderCell>
                    <TableHeaderCell>Administração</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <span className="inline-flex items-center gap-2">
                        <Users className="h-3.5 w-3.5" aria-hidden="true" />
                        Sócio / gestor
                      </span>
                    </TableCell>
                    <TableCell>Fila completa</TableCell>
                    <TableCell>Distribui e reatribui</TableCell>
                    <TableCell>Toda a equipe</TableCell>
                    <TableCell>Equipe e integrações</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <span className="inline-flex items-center gap-2">
                        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                        Advogado
                      </span>
                    </TableCell>
                    <TableCell>Itens atribuídos</TableCell>
                    <TableCell>Sem acesso</TableCell>
                    <TableCell>Somente a própria pauta</TableCell>
                    <TableCell>Preferências pessoais</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableWrap>
          </Panel>
        </section>
      </div>

      {/* Sobreposições */}
      <SlidePanel
        open={painelAberto}
        onClose={() => setPainelAberto(false)}
        eyebrow="Detalhe da publicação"
        titulo="Análise da intimação"
        badge={<Badge variant="gold">Exemplo fictício</Badge>}
        footer={
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => setPainelAberto(false)}>
              Salvar conferência
            </Button>
            <Button variant="secondary" onClick={() => setPainelAberto(false)}>
              Fechar
            </Button>
          </div>
        }
      >
        <h3>1002345-12.2026.8.26.0100</h3>
        <p className="mt-1 text-[12px] text-muted-foreground">
          TJSP · 3ª Vara Cível · disponibilização 15/10/2026
        </p>
        <div className="my-5 border-t border-border" />
        <h3>Teor original</h3>
        <blockquote className="my-4 border-l-2 border-border pl-4 font-serif text-[13px] leading-relaxed text-muted-foreground">
          “Intime-se a parte ré para apresentar contestação no prazo de 15
          (quinze) dias úteis, observadas as disposições aplicáveis ao feito.”
        </blockquote>
        <div className="my-5 border-t border-border" />
        <div className="space-y-4">
          <FormField label="Ação sugerida pela IA" htmlFor="sg-panel-acao">
            <Input id="sg-panel-acao" defaultValue="Apresentar contestação" />
          </FormField>
          <FormField
            label="Prazo fatal conferido"
            htmlFor="sg-panel-prazo"
            hint="A conferência humana é obrigatória neste projeto."
          >
            <Input id="sg-panel-prazo" type="date" defaultValue="2026-11-06" />
          </FormField>
          <FormField label="Responsável" htmlFor="sg-panel-resp">
            <Select id="sg-panel-resp" defaultValue="adv-mariana-costa">
              <option value="">Não atribuído</option>
              {advogadosMock.map((advogado) => (
                <option key={advogado.id} value={advogado.id}>
                  {advogado.nome_completo}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
        <div className="mt-5">
          <Alert severidade="warning" titulo="Prazo aguardando conferência">
            O prazo extraído pela IA permanece pendente até a validação.
          </Alert>
        </div>
      </SlidePanel>

      <Modal
        open={modalAberto}
        onClose={() => setModalAberto(false)}
        titulo="Distribuição automática de intimações"
        descricao="Divisão igualitária do lote entre os advogados elegíveis."
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalAberto(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setModalAberto(false);
                toast.success("23 publicações distribuídas na simulação.");
              }}
            >
              Confirmar distribuição
            </Button>
          </>
        }
      >
        <div className="space-y-2">
          {advogadosMock.slice(1, 6).map((advogado, indice) => (
            <div
              key={advogado.id}
              className="flex items-center justify-between gap-3 rounded-sm border border-border px-3 py-2.5"
            >
              <PessoaTag nome={advogado.nome_completo} />
              <Badge variant="neutral">{indice < 3 ? 5 : 4} novas tarefas</Badge>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Alert severidade="info" titulo="Simulação local">
            Nenhuma atribuição será enviada a um sistema externo.
          </Alert>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmAberto}
        onClose={() => setConfirmAberto(false)}
        onConfirm={() => {
          setConfirmAberto(false);
          toast.success("Ação confirmada na simulação.");
        }}
        titulo="Remover vínculo da OAB?"
        descricao="Exemplo de confirmação de ação destrutiva. Nenhum vínculo real será alterado."
        textoConfirmar="Confirmar exemplo"
        variante="danger"
      />

      <div className="fixed bottom-5 right-5 hidden items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-[10px] text-muted-foreground shadow-panel sm:flex">
        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        Rota temporária <code className="font-mono">/styleguide</code>
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
      </div>
    </div>
  );
}
