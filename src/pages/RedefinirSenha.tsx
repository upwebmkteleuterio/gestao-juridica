import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, FormField, Input, Panel } from "@/components/kit";
import { supabase } from "@/integrations/supabase/client";
import { houveRecuperacaoDeSenha } from "@/lib/sessao";

export default function RedefinirSenha() {
  const navigate = useNavigate();
  const [recuperacaoValida, setRecuperacaoValida] = useState(false);
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState<string>();
  const [sucesso, setSucesso] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const tipoRecovery = new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery";
    let ativo = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((evento, sessao) => {
      if (evento === "PASSWORD_RECOVERY" && sessao) setRecuperacaoValida(true);
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (ativo && (tipoRecovery || houveRecuperacaoDeSenha()) && data.session) setRecuperacaoValida(true);
    });
    return () => { ativo = false; subscription.unsubscribe(); };
  }, []);

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(undefined);
    if (!recuperacaoValida) {
      setErro("Este link de redefinição não é válido. Solicite um novo link na tela de acesso.");
      return;
    }
    if (senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (senha !== confirmacao) {
      setErro("A confirmação da senha não corresponde.");
      return;
    }
    setSalvando(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setSalvando(false);
    if (error) {
      setErro("Não foi possível atualizar sua senha. Solicite um novo link e tente novamente.");
      return;
    }
    setSucesso(true);
    window.setTimeout(() => navigate("/painel", { replace: true }), 1800);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-10">
      <Panel className="w-full max-w-md p-6">
        <p className="eyebrow text-gold-600 dark:text-gold-400">Acesso restrito</p>
        <h1 className="mt-2 text-2xl">Redefinir senha</h1>
        <p className="mt-2 text-[12px] text-muted-foreground">Informe e confirme sua nova senha.</p>
        {erro ? <Alert className="mt-5" severidade="danger" titulo={erro} /> : null}
        {sucesso ? <Alert className="mt-5" severidade="success" titulo="Senha atualizada com sucesso.">Você será direcionado ao sistema.</Alert> : null}
        {!recuperacaoValida && !sucesso ? <Alert className="mt-5" severidade="warning" titulo="Link de recuperação não validado.">Solicite um novo link na tela de acesso para definir uma senha.</Alert> : null}
        {recuperacaoValida && !sucesso ? (
          <form className="mt-5 space-y-4" onSubmit={salvar}>
            <FormField label="Nova senha" htmlFor="nova-senha" required>
              <Input id="nova-senha" type="password" autoComplete="new-password" value={senha} onChange={(evento) => setSenha(evento.target.value)} required />
            </FormField>
            <FormField label="Confirme a nova senha" htmlFor="confirmar-senha" required>
              <Input id="confirmar-senha" type="password" autoComplete="new-password" value={confirmacao} onChange={(evento) => setConfirmacao(evento.target.value)} required />
            </FormField>
            <Button type="submit" variant="primary" className="w-full" loading={salvando}>Salvar nova senha</Button>
          </form>
        ) : null}
      </Panel>
    </main>
  );
}
