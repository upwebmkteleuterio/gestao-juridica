alter table public.configuracoes_sistema
  add column if not exists marco_zero date,
  add column if not exists marco_zero_indicadores boolean not null default false,
  add column if not exists marco_zero_lista boolean not null default false,
  add column if not exists marco_zero_exportacao boolean not null default false