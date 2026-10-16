create or replace function public.devolver_distribuicao(p_advogado_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_devolvidas uuid[];
  v_tarefas integer;
  v_mantidas integer;
begin
  if public.perfil_do_usuario() is distinct from 'admin' then
    raise exception 'Apenas administradores podem devolver a distribuição.';
  end if;

  if p_advogado_id is null then
    raise exception 'Informe o profissional.';
  end if;

  with alvo as (
    select i.id
      from public.intimacoes i
     where i.advogado_id = p_advogado_id
       and i.status_fluxo = 'fila'
       and not exists (
         select 1 from public.tarefas_prazos t
          where t.intimacao_id = i.id
            and t.etapa_kanban <> 'fila'
       )
  ),
  removidas as (
    delete from public.tarefas_prazos t
     using alvo a
     where t.intimacao_id = a.id
       and t.etapa_kanban = 'fila'
    returning t.id
  ),
  revertidas as (
    update public.intimacoes i
       set advogado_id = null,
           status_fluxo = 'triagem',
           distribuido_em = null
      from alvo a
     where i.id = a.id
    returning i.id
  )
  select coalesce(array_agg(id), '{}'::uuid[]),
         (select count(*)::integer from removidas)
    into v_devolvidas, v_tarefas
    from revertidas;

  select count(*)::integer into v_mantidas
    from public.intimacoes i
   where i.advogado_id = p_advogado_id
     and i.status_fluxo = 'fila'
     and exists (
       select 1 from public.tarefas_prazos t
        where t.intimacao_id = i.id
          and t.etapa_kanban <> 'fila'
     );

  return jsonb_build_object(
    'advogado_id', p_advogado_id,
    'devolvidas', coalesce(array_length(v_devolvidas, 1), 0),
    'tarefas_removidas', coalesce(v_tarefas, 0),
    'mantidas', coalesce(v_mantidas, 0),
    'intimacao_ids', to_jsonb(v_devolvidas),
    'devolvido_em', to_jsonb(now())
  );
end;
$function$;