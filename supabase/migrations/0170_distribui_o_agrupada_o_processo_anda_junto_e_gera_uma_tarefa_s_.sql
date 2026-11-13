create or replace function public.distribuir_lote(p_intimacao_ids uuid[], p_advogado_ids uuid[], p_criterio text) returns jsonb language plpgsql set search_path to '' as $function$
declare
  v_carimbo timestamptz := now();
  v_resultado jsonb;
begin
  if coalesce(array_length(p_advogado_ids, 1), 0) = 0 then
    raise exception 'Nenhum advogado elegível selecionado.';
  end if;

  with elegiveis as (
    select i.id,
           i.numero_processo_normalizado,
           row_number() over (order by i.data_disponibilizacao nulls last, i.id) - 1 as posicao
      from public.intimacoes i
     where i.id = any(p_intimacao_ids)
       and i.status_fluxo = 'triagem'
       and i.advogado_id is null
  ),
  carga as (
    select t.advogado_id, count(*)::integer as qtd
      from public.tarefas_prazos t
     where t.etapa_kanban <> 'concluido'
     group by t.advogado_id
  ),
  participantes as (
    select p.advogado_id,
           p.ordem,
           coalesce(c.qtd, 0) as carga_atual,
           row_number() over (
             order by case when p_criterio = 'compensacao' then coalesce(c.qtd, 0) else 0 end,
                      p.ordem
           ) as posicao,
           count(*) over () as participantes_total
      from unnest(p_advogado_ids) with ordinality as p(advogado_id, ordem)
      left join carga c on c.advogado_id = p.advogado_id
  ),
  distribuicao as (
    select e.id as intimacao_id, e.numero_processo_normalizado, pa.advogado_id
      from elegiveis e
      join participantes pa on pa.posicao = (e.posicao % pa.participantes_total) + 1
  ),
  atualizadas as (
    update public.intimacoes i
       set advogado_id = d.advogado_id,
           status_fluxo = 'fila',
           distribuido_em = v_carimbo
      from distribuicao d
     where i.numero_processo_normalizado = d.numero_processo_normalizado
       and i.status_fluxo = 'triagem'
       and i.arquivado_em is null
    returning i.id
  ),
  novas_tarefas as (
    insert into public.tarefas_prazos (origem, intimacao_id, advogado_id, numero_processo, partes_resumo, tipo_peca, data_fatal, etapa_kanban)
    select 'djen', i.id, d.advogado_id, i.numero_processo,
           coalesce(partes.resumo, ''), i.acao_sugerida_ia, i.data_fatal_calculada, 'fila'
      from distribuicao d
      join public.intimacoes i on i.id = d.intimacao_id
      left join public.intimacoes_djen_raw r on r.id = i.raw_id
      left join lateral (
        select concat_ws(' x ',
                 max(v.valor ->> 'nome') filter (where v.valor ->> 'polo' = 'A'),
                 max(v.valor ->> 'nome') filter (where v.valor ->> 'polo' = 'P')) as resumo
          from jsonb_array_elements(coalesce(r.payload_json -> 'destinatarios', '[]'::jsonb)) as v(valor)
      ) partes on true
     where not exists (
       select 1 from public.tarefas_prazos t
        where t.intimacao_id = i.id
           or upper(regexp_replace(t.numero_processo, '[^0-9A-Za-z]', '', 'g')) = i.numero_processo_normalizado
     )
    returning id
  ),
  resumo as (
    select
      (select count(*) from distribuicao)::integer as total,
      (select coalesce(array_agg(id), '{}'::uuid[]) from atualizadas) as intimacao_ids,
      (select coalesce(array_agg(id), '{}'::uuid[]) from novas_tarefas) as tarefa_ids,
      (select coalesce(jsonb_agg(
                jsonb_build_object(
                  'advogado_id', pa.advogado_id,
                  'quantidade', (select count(*) from distribuicao d where d.advogado_id = pa.advogado_id),
                  'carga_atual', pa.carga_atual
                ) order by pa.ordem), '[]'::jsonb)
         from participantes pa) as atribuicoes
  )
  select jsonb_build_object(
           'total', r.total,
           'participantes', to_jsonb(p_advogado_ids),
           'criterio', p_criterio,
           'atribuicoes', r.atribuicoes,
           'distribuido_em', to_jsonb(v_carimbo),
           'intimacao_ids', to_jsonb(r.intimacao_ids),
           'tarefa_ids', to_jsonb(r.tarefa_ids)
         )
    into v_resultado
    from resumo r;

  if coalesce((v_resultado ->> 'total')::integer, 0) = 0 then
    raise exception 'Nenhuma intimação pendente no lote selecionado.';
  end if;

  return v_resultado;
end;
$function$