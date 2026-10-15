create table public.configuracoes_sistema (
  id integer primary key,
  oabs_monitoradas jsonb not null default '[]'::jsonb,
  horario_cron_djen text not null default '06:00',
  ia_modelo text not null default 'deepseek-flash',
  ia_system_prompt text not null default '',
  updated_at timestamptz not null default now(),
  constraint configuracoes_sistema_singleton check (id = 1)
)