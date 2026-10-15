import { ArrowRight, ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Alert, Button, FormField, Input, Panel } from "@/components/kit";
import { useSessao, useUsuarioAtual } from "@/hooks";
import { supabase } from "@/integrations/supabase/client";

function mensagemErroLogin(mensagem: string) {
  const texto = mensagem.toLowerCase();
  if (texto.includes("email not confirmed")) return "Confirme seu e-mail corporativo antes de entrar.";
  if (texto.includes("too many requests") || texto.includes("rate limit")) return "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.";
  if (texto.includes("invalid login credentials")) return "E-mail ou senha inválidos.";
  return "Não foi possível entrar. Confira seus dados e tente novamente.";
}

export default function Login() {
  const { sessao, motivoSaida } = useSessao();
  const usuario = useUsuarioAtual();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string>();
  const [mensagem, setMensagem] = useState<string>();
  const [carregando, setCarregando] = useState(false);
  const [enviandoRecuperacao, setEnviandoRecuperacao] = useState(false);
  const navigate = useNavigate();
  const local = useLocation();
  const destino = (local.state as { de?: string } | null)?.de ?? "/painel";

  // Só sai da tela de login quando a sessão tem perfil válido; sem isso o
  // app entraria em laço com o ProtectedRoute.
  if (sessao && usuario) return <Navigate to={destino} replace />;

  async function acessar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(undefined);
    setMensagem(undefined);
    setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setCarregando(false);
    if (error) {
      setErro(mensagemErroLogin(error.message));
      return;
    }
    navigate(destino, { replace: true });
  }

  async function recuperarSenha() {
    setErro(undefined);
    setMensagem(undefined);
    if (!email.trim()) {
      setErro("Informe seu e-mail corporativo para receber o link de redefinição.");
      return;
    }
    setEnviandoRecuperacao(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: new URL("/redefinir-senha", window.location.origin).href,
    });
    setEnviandoRecuperacao(false);
    if (error) setErro("Não foi possível enviar o link. Confira o e-mail e tente novamente.");
    else setMensagem("Se o e-mail estiver cadastrado, você receberá as instruções para redefinir sua senha.");
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-navy-950 p-12 lg:flex">
        <img src="/assets/auth-pattern.png" alt="" aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.16]" />
        <img src="/assets/logo-magalhaes-gomes.png" alt="Magalhães & Gomes Advogados" className="relative h-[92px] w-[164px] object-contain object-left" />
        <div className="relative max-w-lg">
          <p className="eyebrow text-gold-500">Operações jurídicas</p>
          <h1 className="mt-4 text-white">Clareza para decidir.<br />Controle para avançar.</h1>
          <p className="mt-5 text-[13px] leading-relaxed text-white/60">Acompanhe publicações, prazos e a operação jurídica do escritório em um único ambiente.</p>
          <img src="/assets/login-illustration.png" alt="" aria-hidden="true" className="mt-8 w-full max-w-sm rounded-lg border border-white/10 object-cover" />
        </div>
        <p className="relative text-[10px] text-white/35">Magalhães & Gomes Advogados</p>
      </section>

      <section className="flex items-center justify-center bg-background px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <img src="/assets/logo-magalhaes-gomes.png" alt="Magalhães & Gomes Advogados" className="mb-8 h-16 w-28 rounded bg-navy-950 object-contain p-1.5 lg:hidden" />
          <p className="eyebrow text-gold-600 dark:text-gold-400">Acesso restrito</p>
          <h2 className="mt-2 text-2xl">Entrar no sistema</h2>
          <p className="mt-2 text-[12px] text-muted-foreground">Acesse com seu e-mail corporativo e sua senha.</p>

          {motivoSaida === "expirada" ? (
            <Alert className="mt-5" severidade="warning" titulo="Sua sessão expirou.">Entre novamente para continuar usando o sistema.</Alert>
          ) : null}
          {sessao && !usuario ? (
            <Alert className="mt-5" severidade="warning" titulo="Sua conta ainda não tem perfil configurado.">Peça ao administrador para liberar o seu acesso.</Alert>
          ) : null}
          {erro ? <Alert className="mt-5" severidade="danger" titulo={erro} /> : null}
          {mensagem ? <Alert className="mt-5" severidade="success" titulo={mensagem} /> : null}

          <Panel className="mt-6 p-5">
            <form className="space-y-4" onSubmit={acessar}>
              <FormField label="E-mail corporativo" htmlFor="login-email" required>
                <Input id="login-email" type="email" value={email} onChange={(evento) => setEmail(evento.target.value)} placeholder="nome@magalhaesgomes.adv.br" autoComplete="username" required />
              </FormField>
              <FormField label="Senha" htmlFor="login-senha" required>
                <Input id="login-senha" type="password" value={senha} onChange={(evento) => setSenha(evento.target.value)} placeholder="••••••••" autoComplete="current-password" required />
              </FormField>
              <Button type="submit" variant="primary" size="lg" className="w-full" loading={carregando}>
                Entrar no sistema <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
              <div className="flex justify-end">
                <button type="button" onClick={() => void recuperarSenha()} disabled={enviandoRecuperacao} className="text-[11px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline disabled:opacity-50">
                  {enviandoRecuperacao ? "Enviando link…" : "Esqueci minha senha"}
                </button>
              </div>
            </form>
          </Panel>
          <p className="mt-5 flex items-center gap-2 text-[10px] text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />Acesso exclusivo à equipe do escritório.</p>
        </div>
      </section>
    </div>
  );
}
