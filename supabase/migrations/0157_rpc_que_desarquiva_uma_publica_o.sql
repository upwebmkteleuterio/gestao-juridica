create or replace function public.desarquivar_intimacao(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_linha public.intimacoes;
begin
  if public.perfil_do_usuario() is distinct from 'admin' then
    raise exception 'Apenas administradores podem desarquivar publicações.';
  end if;

  if p_id is null then
    raise exception 'Informe a publicação.';
  end if;

  update public.intimacoes i
     set arquivado_em = null
   where i.id = p_id
  returning * into v_linha;

  if v_linha.id is null then
    raise exception 'Publicação não encontrada.';
  end if;

  return to_jsonb(v_linha);
end;
$function$