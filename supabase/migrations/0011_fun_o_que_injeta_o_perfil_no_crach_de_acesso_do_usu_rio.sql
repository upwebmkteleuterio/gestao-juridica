create or replace function public.sincronizar_perfil_no_token()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update auth.users
     set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('perfil', new.perfil::text)
   where id = new.id;
  return new;
end;
$$