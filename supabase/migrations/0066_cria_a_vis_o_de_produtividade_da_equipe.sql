create or replace view public.view_produtividade_equipe with (security_invoker = true) as
select
  a.id as advogado_id,
  a.nome_completo,
  a.email_corporativo,
  a.oab_numero,
  a.oab_uf,
  a.perfil,
  a.ativo_distribuicao,
  count(t.id) filter (where t.etapa_kanban <> 'concluido') as total_prazos,
  count(t.id) filter (where t.etapa_kanban = 'concluido' and t.concluido_em >= date_trunc('month', now())) as concluidos_mes,
  count(t.id) filter (where t.etapa_kanban <> 'concluido' and t.data_fatal is not null and t.data_fatal <= current_date + 2) as criticos_48h
from public.advogados a
left join public.tarefas_prazos t on t.advogado_id = a.id
group by a.id, a.nome_completo, a.email_corporativo, a.oab_numero, a.oab_uf, a.perfil, a.ativo_distribuicao