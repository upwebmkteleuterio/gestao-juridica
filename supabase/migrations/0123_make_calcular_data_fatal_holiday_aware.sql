create or replace function public.calcular_data_fatal(p_data_base date, p_dias integer)
returns date
language sql
immutable
set search_path to ''
as $function$
  select public.somar_dias_uteis(p_data_base, p_dias);
$function$;