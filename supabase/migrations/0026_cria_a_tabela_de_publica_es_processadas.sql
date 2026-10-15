create table public.intimacoes (
  id uuid primary key default gen_random_uuid(),
  raw_id uuid not null unique references public.intimacoes_djen_raw(id) on delete cascade,
  numero_processo text not null,
  tribunal_sigla text,
  orgao_julgador text,
  data_disponibilizacao date not null,
  tipo_documento text,
  acao_sugerida_ia text,
  resumo_ia text,
  prazo_extraido_texto text,
  data_fatal_calculada date,
  advogado_id uuid references public.advogados(id) on delete restrict,
  status_fluxo public.status_fluxo_intimacao not null default 'triagem',
  distribuido_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
)