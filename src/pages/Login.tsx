import { ArrowRight, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  Avatar,
  Badge,
  Button,
  FormField,
  Input,
  Panel,
  Skeleton,
} from "@/components/kit";
import { useAdvogados } from "@/hooks";
import { formatarOab } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store";

/** Tela de login simulada com escolha de perfil (admin / advogado). */
export default function Login() {
  const usuario = useAuthStore((estado) => estado.usuario);
  const entrar = useAuthStore((estado) => estado.entrar);
  const { data: advogados, isLoading } = useAdvogados();

  const [selecionadoId, setSelecionadoId] = useState("");
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState<string | undefined>();

  const navigate = useNavigate();
  const local = useLocation();
  const destino = (local.state as { de?: string } | null)?.de ?? "/painel";

  const selecionado = advogados?.find((item) => item.id === selecionadoId);

  useEffect(() => {
    if (selecionado) setEmail(selecionado.email_corporativo);
  }, [selecionado]);

  if (usuario) return <Navigate to={destino} replace />;

  function acessar() {
    if (!selecionado) {
      setErro("Selecione um perfil para continuar.");
      return;
    }
    setErro(undefined);
    entrar(selecionado);
    navigate(destino, { replace: true });
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-navy-950 p-12 lg:flex">
        <img
          src="/assets/auth-pattern.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.16]"
        />
        <img
          src="/assets/logo-magalhaes-gomes.png"
          alt="Magalhães & Gomes Advogados"
          className="relative h-[92px] w-[164px] object-contain object-left"
        />
        <div className="relative max-w-lg">
          <p className="eyebrow text-gold-500">
            Design system / legal operations
          </p>
          <h1 className="mt-4 text-white">
            Clareza para decidir.
            <br />
            Controle para avançar.
          </h1>
          <p className="mt-5 text-[13px] leading-relaxed text-white/60">
            Captura oficial do DJEN, leitura assistida por IA e distribuição
            equilibrada da pauta em um único ambiente.
          </p>
          <img
            src="/assets/login-illustration.png"
            alt=""
            aria-hidden="true"
            className="mt-8 w-full max-w-sm rounded-lg border border-white/10 object-cover"
          />
        </div>
        <p className="relative text-[10px] text-white/35">
          Protótipo · dados fictícios · nenhuma integração real
        </p>
      </section>

      <section className="flex items-center justify-center bg-background px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <img
            src="/assets/logo-magalhaes-gomes.png"
            alt="Magalhães & Gomes Advogados"
            className="mb-8 h-16 w-28 rounded bg-navy-950 object-contain p-1.5 lg:hidden"
          />

          <p className="eyebrow text-gold-600 dark:text-gold-400">
            Acesso restrito
          </p>
          <h2 className="mt-2 text-2xl">Entrar no sistema</h2>
          <p className="mt-2 text-[12px] text-muted-foreground">
            Selecione um perfil de demonstração para iniciar a sessão.
          </p>

          <Panel className="mt-6 p-5">
            <p className="label-kit mb-3">Perfil de acesso</p>
            <div className="space-y-2">
              {isLoading
                ? Array.from({ length: 3 }).map((_, indice) => (
                    <Skeleton key={indice} className="h-14" />
                  ))
                : advogados?.map((advogado) => {
                    const ativo = advogado.id === selecionadoId;
                    return (
                      <button
                        key={advogado.id}
                        type="button"
                        aria-pressed={ativo}
                        onClick={() => {
                          setSelecionadoId(advogado.id);
                          setErro(undefined);
                        }}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-sm border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          ativo
                            ? "border-primary bg-secondary"
                            : "border-border hover:bg-secondary/60",
                        )}
                      >
                        <Avatar
                          nome={advogado.nome_completo}
                          tom={advogado.perfil === "admin" ? "gold" : "navy"}
                        />
                        <span className="min-w-0 flex-1">
                          <strong className="block truncate text-[12px] font-semibold">
                            {advogado.nome_completo}
                          </strong>
                          <small className="block truncate text-[10px] text-muted-foreground">
                            {formatarOab(advogado.oab_numero, advogado.oab_uf)}
                          </small>
                        </span>
                        <Badge
                          variant={advogado.perfil === "admin" ? "gold" : "navy"}
                        >
                          {advogado.perfil === "admin" ? "Admin" : "Advogado"}
                        </Badge>
                      </button>
                    );
                  })}
            </div>
          </Panel>

          <div className="mt-5 space-y-4">
            <FormField
              label="E-mail corporativo"
              htmlFor="login-email"
              hint={
                selecionado
                  ? `Sessão simulada como ${selecionado.nome_completo}.`
                  : "Selecione um perfil para preencher automaticamente."
              }
            >
              <Input
                id="login-email"
                type="email"
                value={email}
                onChange={(evento) => setEmail(evento.target.value)}
                placeholder="nome@magalhaesgomes.adv.br"
                autoComplete="username"
              />
            </FormField>

            <FormField
              label="Senha"
              htmlFor="login-senha"
              error={erro}
              required
            >
              <Input
                id="login-senha"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                onKeyDown={(evento) => {
                  if (evento.key === "Enter") acessar();
                }}
              />
            </FormField>

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={acessar}
            >
              Entrar no sistema
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>

            <p className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Ambiente de demonstração — nenhuma credencial real é validada.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
