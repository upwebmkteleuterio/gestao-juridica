create or replace function public.enviar_para_esteira(p_id uuid, p_acao_sugerida text, p_resumo text, p_data_fatal date, p_advogado_id uuid) returns jsonb language plpgsql set search_path to '' as $function$
declare
  v_atual public.intimacoes;
  v_processo text;
  v_carimbo timestamptz := now();
  v_tarefa_id uuid;
begin
  update public.intimacoes
     set acao_sugerida_ia = p_acao_sugerida,
         resumo_ia = p_resumo,
         data_fatal_calculada = p_data_fatal,
         advogado_id = p_advogado_id,
         status_fluxo = 'fila',
         distribuido_em = v_carimbo
   where id = p_id
  returning * into v_atual;

  if v_atual.id is null then
    raise exception 'Intimação não encontrada ou sem permissão de escrita.';
  end if;

  v_processo := v_atual.numero_processo_normalizado;

  update public.intimacoes
     set status_fluxo = 'fila',
         advogado_id = p_advogado_id,
         distribuido_em = v_carimbo
   where numero_processo_normalizado = v_processo
     and id <> p_id
     and status_fluxo = 'triagem'
     and arquivado_em is null;

  select t.id into v_tarefa_id
    from public.tarefas_prazos t
   where t.intimacao_id = p_id
      or upper(regexp_replace(t.numero_processo, '[^0-9A-Za-z]', '', 'g')) = v_processo
   order by t.created_at
   limit 1;

  if v_tarefa_id is not null then
    update public.tarefas_prazos t
       set advogado_id = p_advogado_id,
           tipo_peca = p_acao_sugerida,
           data_fatal = p_data_fatal
     where t.id = v_tarefa_id;
  else
    insert into public.tarefas_prazos (origem, intimacao_id, advogado_id, numero_processo, partes_resumo, tipo_peca, data_fatal, etapa_kanban)
    select 'djen', i.id, p_advogado_id, i.numero_processo,
           coalesce(partes.resumo, ''), p_acao_sugerida, p_data_fatal, 'fila'
      from public.intimacoes i
      left join public.intimacoes_djen_raw r on r.id = i.raw_id
      left join lateral (
        select concat_ws(' x ',
                 max(v.valor ->> 'nome') filter (where v.valor ->> 'polo' = 'A'),
                 max(v.valor ->> 'nome') filter (where v.valor ->> 'polo' = 'P')) as resumo
          from jsonb_array_elements(coalesce(r.payload_json -> 'destinatarios', '[]'::jsonb)) as v(valor)
      ) partes on true
     where i.id = p_id;
  end if;

  return to_jsonb(v_atual);
end;
$function$