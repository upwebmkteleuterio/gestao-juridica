create trigger intimacoes_data_referencia
  before insert or update of data_disponibilizacao, created_at on public.intimacoes
  for each row execute function public.definir_data_referencia_intimacao()