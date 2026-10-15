create or replace function public.perfil_do_usuario()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select a.perfil::text from public.advogados a where a.id = auth.uid()
$$