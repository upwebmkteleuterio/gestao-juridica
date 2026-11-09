create or replace function public.resumo_acoes_periodo(p_inicio date, p_fim date)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  v_encerrar integer;
  v_arquivar integer;
  v_excluir integer;
begin
  if public.perfil_do_usuario() is distinct from 'admin' then
    raise exception 'Apenas administradores podem consultar o resumo das ações.';
  end if;

  select count(*)::integer into v_encerrar
    from public.intimacoes i
   where i.status_fluxo = 'triagem'
     and i.advogado_id is null
     and (p_inicio is null or i.data_referencia >= p_inicio)
     and (p_fim is null or i.data_referencia <= p_fim);

  select count(*)::integer into v_arquivar
    from public.intimacoes i
   where i.arquivado_em is null
     and (p_inicio is null or i.data_referencia >= p_inicio)
     and (p_fim is null or i.data_referencia <= p_fim);

  select count(*)::integer into v_excluir
    from public.intimacoes i
   where (p_inicio is null or i.data_referencia >= p_inicio)
     and (p_fim is null or i.data_referencia <= p_fim);

  return jsonb_build_object(
    'encerrar', coalesce(v_encerrar, 0),
    'arquivar', coalesce(v_arquivar, 0),
    'excluir', coalesce(v_excluir, 0)
  );
end;
$function$