create or replace function public.somar_dias_uteis(p_data date, p_dias integer)
returns date
language plpgsql
immutable
set search_path to ''
as $function$
declare
  v_ano integer;
  v_feriados date[];
  v_cursor date;
  v_restantes integer;
begin
  if p_data is null or p_dias is null or p_dias < 1 then return null; end if;

  v_ano := extract(year from p_data)::integer;
  v_feriados := public.feriados_nacionais(v_ano - 1)
             || public.feriados_nacionais(v_ano)
             || public.feriados_nacionais(v_ano + 1);

  v_cursor := p_data;
  v_restantes := p_dias;
  while v_restantes > 0 loop
    v_cursor := v_cursor + 1;
    if extract(isodow from v_cursor) < 6 and not (v_cursor = any (v_feriados)) then
      v_restantes := v_restantes - 1;
    end if;
  end loop;
  return v_cursor;
end;
$function$;