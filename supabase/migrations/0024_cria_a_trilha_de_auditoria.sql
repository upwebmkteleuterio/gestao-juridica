create table public.eventos_auditoria (
  id uuid primary key default gen_random_uuid(),
  ator_id uuid references public.advogados(id) on delete set null,
  entidade text not null,
  entidade_id text not null,
  acao text not null,
  antes text,
  depois text,
  criado_em timestamptz not null default now()
)