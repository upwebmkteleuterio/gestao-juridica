create or replace function public.reordenar_kanban(p_etapa public.etapa_kanban, p_ids uuid[])
returns integer
language plpgsql
set search_path to ''
as $function$
declare
  v_id uuid;
  v_indice integer := 0;
begin
  if p_ids is null or array_length(p_ids, 1) is null then
    return 0;
  end if;

  if p_etapa is null then
    raise exception 'Informe a etapa de destino.';
  end if;

  foreach v_id in array p_ids loop
    update public.tarefas_prazos
       set etapa_kanban = p_etapa,
           ordem_kanban = v_indice
     where id = v_id;
    v_indice := v_indice + 1;
  end loop;

  return v_indice;
end;
$function$;