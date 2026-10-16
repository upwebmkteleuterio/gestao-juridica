create or replace function public.pascoa(p_ano integer)
returns date
language plpgsql
immutable
set search_path to ''
as $function$
declare
  a integer; b integer; c integer; d integer; e integer; f integer;
  g integer; h integer; i integer; k integer; l integer; m integer;
  v_mes integer; v_dia integer;
begin
  a := p_ano % 19;
  b := p_ano / 100;
  c := p_ano % 100;
  d := b / 4;
  e := b % 4;
  f := (b + 8) / 25;
  g := (b - f + 1) / 3;
  h := (19 * a + b - d - g + 15) % 30;
  i := c / 4;
  k := c % 4;
  l := (32 + 2 * e + 2 * i - h - k) % 7;
  m := (a + 11 * h + 22 * l) / 451;
  v_mes := (h + l - 7 * m + 114) / 31;
  v_dia := ((h + l - 7 * m + 114) % 31) + 1;
  return make_date(p_ano, v_mes, v_dia);
end;
$function$;