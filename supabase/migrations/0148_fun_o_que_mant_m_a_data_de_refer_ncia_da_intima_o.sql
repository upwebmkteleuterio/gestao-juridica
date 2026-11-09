create or replace function public.definir_data_referencia_intimacao()
returns trigger
language plpgsql
set search_path to ''
as $function$
begin
  new.data_referencia := coalesce(
    new.data_disponibilizacao,
    (coalesce(new.created_at, now()) at time zone 'America/Sao_Paulo')::date
  );
  return new;
end;
$function$