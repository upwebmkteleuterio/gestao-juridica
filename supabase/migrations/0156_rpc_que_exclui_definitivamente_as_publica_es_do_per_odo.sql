create or replace function public.excluir_intimacoes_periodo(p_inicio date, p_fim date)
returns integer
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_total integer;
begin
  if public.perfil_do_usuario() is distinct from 'admin' then
    raise exception 'Apenas administradores podem excluir publicações.';
  end if;

  with alvo as (
    delete from public.intimacoes i
     where (p_inicio is null or i.data_referencia >= p_inicio)
       and (p_fim is null or i.data_referencia <= p_fim)
    returning 1
  )
  select count(*)::integer into v_total from alvo;

  return coalesce(v_total, 0);
end;
$function$