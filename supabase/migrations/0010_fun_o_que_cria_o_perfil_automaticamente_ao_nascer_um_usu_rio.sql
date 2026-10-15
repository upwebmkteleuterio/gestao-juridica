create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.advogados (id, nome_completo, email_corporativo, perfil)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'nome_completo', ''), split_part(coalesce(new.email, 'sem-email'), '@', 1)),
    coalesce(new.email, ''),
    'advogado'
  )
  on conflict (id) do nothing;
  return new;
end;
$$