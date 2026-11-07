create trigger tarefas_prazos_titulo_padrao
before insert on public.tarefas_prazos
for each row execute function public.preencher_tipo_peca_manual()