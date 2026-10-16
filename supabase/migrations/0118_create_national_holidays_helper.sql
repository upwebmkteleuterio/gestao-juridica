create or replace function public.feriados_nacionais(p_ano integer)
returns date[]
language sql
immutable
set search_path to ''
as $function$
  select array[
    make_date(p_ano, 1, 1),
    make_date(p_ano, 4, 21),
    make_date(p_ano, 5, 1),
    make_date(p_ano, 9, 7),
    make_date(p_ano, 10, 12),
    make_date(p_ano, 11, 2),
    make_date(p_ano, 11, 15),
    make_date(p_ano, 11, 20),
    make_date(p_ano, 12, 25),
    public.pascoa(p_ano) - 48,
    public.pascoa(p_ano) - 47,
    public.pascoa(p_ano) - 2,
    public.pascoa(p_ano) + 60
  ];
$function$;