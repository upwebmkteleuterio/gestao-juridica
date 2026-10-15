import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge, Button, FormField, Input, Panel, PanelHeader } from "@/components/kit";
import { useAtualizarConfiguracoes, useConfiguracoes } from "@/hooks";

export function RoboConfigPanel() {
  const configuracoes = useConfiguracoes();
  const atualizar = useAtualizarConfiguracoes();
  const [horario, setHorario] = useState("06:00");
  const [oabs, setOabs] = useState<string[]>([]);
  const [novaOab, setNovaOab] = useState("");
  const [erroOab, setErroOab] = useState("");

  useEffect(() => {
    if (!configuracoes.data) return;
    setHorario(configuracoes.data.horario_cron_djen || "06:00");
    setOabs(configuracoes.data.oabs_monitoradas);
  }, [configuracoes.data]);

  function adicionarOab() {
    const inscricao = novaOab.trim().toUpperCase();
    if (!/^\d+\/[A-Z]{2}$/.test(inscricao)) {
      setErroOab("Use o formato número/UF, por exemplo 197254/RJ.");
      return;
    }
    if (oabs.includes(inscricao)) {
      setErroOab("Esta OAB já está na lista.");
      return;
    }
    setOabs((atuais) => [...atuais, inscricao]);
    setNovaOab("");
    setErroOab("");
  }

  async function salvar() {
    if (!/^\d{2}:\d{2}$/.test(horario)) {
      toast.error("Informe um horário válido no formato HH:MM.");
      return;
    }
    try {
      await atualizar.mutateAsync({ horario_cron_djen: horario, oabs_monitoradas: oabs });
      toast.success("Configuração do robô salva.");
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível salvar a configuração.");
    }
  }

  return (
    <Panel>
      <PanelHeader titulo="Robô diário" descricao="O robô verifica a hora a cada hora e roda uma vez por dia. Sem OAB monitorada, ele não faz nada." />
      <div className="space-y-5 p-5">
        <FormField label="Horário de execução (São Paulo)" htmlFor="djen-robo-horario">
          <Input id="djen-robo-horario" type="time" value={horario} onChange={(evento) => setHorario(evento.target.value)} />
        </FormField>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <FormField label="Adicionar OAB monitorada" htmlFor="djen-robo-oab" error={erroOab}>
            <Input id="djen-robo-oab" value={novaOab} placeholder="197254/RJ" aria-invalid={Boolean(erroOab) || undefined}
              onChange={(evento) => { setNovaOab(evento.target.value); setErroOab(""); }}
              onKeyDown={(evento) => { if (evento.key === "Enter") { evento.preventDefault(); adicionarOab(); } }} />
          </FormField>
          <Button variant="secondary" onClick={adicionarOab}><Plus className="h-3.5 w-3.5" aria-hidden="true" />Adicionar OAB</Button>
        </div>
        <div className="flex min-h-8 flex-wrap gap-2">
          {oabs.length ? oabs.map((oab) => <Badge key={oab} variant="navy" className="gap-1.5">
            {oab}<button type="button" aria-label={`Remover OAB ${oab}`} onClick={() => setOabs((atuais) => atuais.filter((valor) => valor !== oab))} className="rounded hover:text-danger"><Trash2 className="h-3 w-3" aria-hidden="true" /></button>
          </Badge>) : <p className="text-[11px] text-muted-foreground">Nenhuma OAB monitorada.</p>}
        </div>
        <div className="flex justify-end"><Button variant="primary" onClick={salvar} loading={atualizar.isPending} disabled={configuracoes.isLoading}>Salvar configuração</Button></div>
      </div>
    </Panel>
  );
}
