create table public.tarefas_prazos (
  id uuid primary key default gen_random_uuid(),
  origem public.origem_tarefa not null,
  intimacao_id uuid references public.intimacoes(id) on delete set null,
  advogado_id uuid not null references public.advogados(id) on delete restrict,
  numero_processo text not null,
  partes_resumo text,
  tipo_peca text,
  data_fatal date,
  etapa_kanban public.etapa_kanban not null default 'fila',
  link_minuta text,
  notas_internas text,
  recibo_protocolo_url text,
  concluido_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
)