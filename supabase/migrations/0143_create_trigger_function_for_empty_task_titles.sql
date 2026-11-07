create or replace function public.preencher_tipo_peca_manual()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_observacao text;
begin
  if new.tipo_peca is not null and btrim(new.tipo_peca) <> '' then
    return new;
  end if;
  if new.intimacao_id is not null then
    select i.observacoes into v_observacao
      from public.intimacoes i
     where i.id = new.intimacao_id;
  end if;
  new.tipo_peca := coalesce(
    nullif(btrim(coalesce(v_observacao, '')), ''),
    'Verificar andamento do processo'
  );
  return new;
end;
$$