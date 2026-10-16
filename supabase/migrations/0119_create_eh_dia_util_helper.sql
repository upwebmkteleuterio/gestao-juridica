create or replace function public.eh_dia_util(p_data date)
returns boolean
language sql
immutable
set search_path to ''
as $function$
  select p_data is not null
     and extract(isodow from p_data) < 6
     and not (p_data = any (public.feriados_nacionais(extract(year from p_data)::integer)));
$function$;