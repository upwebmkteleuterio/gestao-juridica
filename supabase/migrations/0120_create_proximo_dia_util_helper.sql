create or replace function public.proximo_dia_util(p_data date)
returns date
language plpgsql
immutable
set search_path to ''
as $function$
declare
  v_cursor date;
begin
  if p_data is null then return null; end if;
  v_cursor := p_data;
  loop
    v_cursor := v_cursor + 1;
    exit when public.eh_dia_util(v_cursor);
  end loop;
  return v_cursor;
end;
$function$;