create or replace function public.calcular_prazo_djen(p_disponibilizacao date, p_dias integer)
returns date
language sql
immutable
set search_path to ''
as $function$
  select public.somar_dias_uteis(public.proximo_dia_util(p_disponibilizacao), p_dias);
$function$;