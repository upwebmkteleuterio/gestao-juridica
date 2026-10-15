import { PauseCircle, Pencil, Plus } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  ErrorState,
  PageHeading,
  Panel,
  PanelHeader,
  Skeleton,
} from "@/components/kit";
import { AdvogadoModal } from "@/components/equipe";
import { useProdutividadeEquipe } from "@/hooks";
import { formatarOab } from "@/lib/format";

export default function Equipe() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { id } = useParams<{ id: string }>();
  const produtividade = useProdutividadeEquipe();
  const advogados = produtividade.data ?? [];
  const ativos = advogados.reduce(
    (total, advogado) => total + Number(advogado.ativo_distribuicao),
    0,
  );
  const modalAberto =
    pathname === "/equipe/novo" || pathname.startsWith("/equipe/advogado/");

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Advogados & cargas · Tela 4"
        titulo="Painel da Equipe & Gestão de Carga"
        descricao="Acompanhamento da produtividade dos advogados, do status de disponibilidade para a distribuição automática e da capacidade operacional da banca."
        acoes={
          <Button variant="primary" onClick={() => navigate("/equipe/novo")}>
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Cadastrar novo advogado
          </Button>
        }
      />

      <Panel>
        <PanelHeader
          titulo="Equipe da banca"
          descricao={`${advogados.length} profissionais · ${ativos} ativos na distribuição`}
        />
        <div className="p-5">
          {produtividade.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, indice) => (
                <Skeleton key={indice} className="h-56 rounded-md" />
              ))}
            </div>
          ) : produtividade.isError ? (
            <ErrorState
              titulo="Não foi possível carregar a equipe"
              descricao="Verifique a conexão e tente novamente."
              onRetry={() => produtividade.refetch()}
            />
          ) : advogados.length === 0 ? (
            <EmptyState
              titulo="Nenhum advogado cadastrado"
              descricao="Cadastre um profissional para acompanhar a produtividade e configurar a distribuição automática."
              acao={
                <Button variant="primary" onClick={() => navigate("/equipe/novo")}>
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  Cadastrar advogado
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {advogados.map((advogado) => (
                <Panel key={advogado.advogado_id} className="p-4">
                  <div className="space-y-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar nome={advogado.nome_completo} tamanho="lg" />
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-semibold" title={advogado.nome_completo}>
                          {advogado.nome_completo}
                        </h3>
                        <Badge variant="gold" className="mt-1 max-w-full truncate">
                          {advogado.cargo ??
                            (advogado.perfil === "admin"
                              ? "Sócio · Administrador"
                              : "Advogado")}
                        </Badge>
                      </div>
                    </div>

                    <div className="min-w-0 space-y-1 border-t border-border pt-3">
                      <p className="text-[11px] font-medium">{formatarOab(advogado.oab_numero, advogado.oab_uf)}</p>
                      <p className="truncate text-[10px] text-muted-foreground" title={advogado.email_corporativo}>
                        {advogado.email_corporativo}
                      </p>
                    </div>

                    <div className="border-t border-border pt-3">
                      {advogado.ativo_distribuicao ? (
                        <Badge variant="success">
                          <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
                          Ativo na distribuição
                        </Badge>
                      ) : (
                        <Badge variant="neutral">
                          <PauseCircle className="h-3 w-3" aria-hidden="true" />
                          Pausado / férias
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-3 divide-x divide-border border-y border-border py-3">
                      <div className="pr-2">
                        <span className="block text-[9px] leading-tight text-muted-foreground">Prazos em aberto</span>
                        <strong className="mt-1 block text-lg font-semibold leading-tight">{advogado.total_prazos}</strong>
                      </div>
                      <div className="px-2">
                        <span className="block text-[9px] leading-tight text-muted-foreground">Críticos &lt; 48h</span>
                        <strong className={`mt-1 block text-lg font-semibold leading-tight ${advogado.criticos_48h > 0 ? "text-danger" : ""}`}>
                          {advogado.criticos_48h}
                        </strong>
                      </div>
                      <div className="pl-2">
                        <span className="block text-[9px] leading-tight text-muted-foreground">Concluídos</span>
                        <strong className={`mt-1 block text-lg font-semibold leading-tight ${advogado.concluidos_mes > 0 ? "text-success" : ""}`}>
                          {advogado.concluidos_mes}
                        </strong>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Badge variant="navy">
                        {advogado.perfil === "admin" ? "Admin" : "Advogado"}
                      </Badge>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/equipe/advogado/${advogado.advogado_id}`)}
                      >
                        <Pencil className="h-3 w-3" aria-hidden="true" />
                        Editar advogado
                      </Button>
                    </div>
                  </div>
                </Panel>
              ))}
            </div>
          )}
        </div>
      </Panel>

      <AdvogadoModal
        open={modalAberto}
        advogadoId={pathname.startsWith("/equipe/advogado/") ? id ?? null : null}
        onClose={() => navigate("/equipe")}
      />
    </div>
  );
}
