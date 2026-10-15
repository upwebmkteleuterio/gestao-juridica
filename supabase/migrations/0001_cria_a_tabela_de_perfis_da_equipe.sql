create table public.advogados (
  id uuid primary key references auth.users(id) on delete cascade,
  nome_completo text not null,
  email_corporativo text not null,
  oab_numero text,
  oab_uf char(2),
  perfil public.perfil_usuario not null default 'advogado',
  ativo_distribuicao boolean not null default true,
  created_at timestamptz not null default now(),
  constraint advogados_email_unico unique (email_corporativo),
  constraint advogados_oab_unico unique (oab_uf, oab_numero)
)