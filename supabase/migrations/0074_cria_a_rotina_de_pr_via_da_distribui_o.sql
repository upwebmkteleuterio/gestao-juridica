create or replace function public.calcular_previa_distribuicao(
  p_intimacao_ids uuid[],
  p_advogado_ids uuid[],
  p_criterio text
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_resultado jsonb;
begin
  if coalesce(array_length(p_advogado_ids, 1), 0) = 0 then
    raise exception 'Selecione ao menos um advogado elegível.';
  end if;

  with elegiveis as (
    select count(*)::integer as total
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
  )
  select jsonb_build_object(
           'total', (select total from elegiveis),
           'participantes', to_jsonb(p_advogado_ids),
           'criterio', p_criterio,
           'atribuicoes', coalesce(
             jsonb_agg(
               jsonb_build_object(
                 'advogado_id', pa.advogado_id,
                 'quantidade', case
                                 when pa.posicao <= (select total from elegiveis)
                                 then (((select total from elegiveis) - pa.posicao) / pa.participantes_total) + 1
                                 else 0
                               end,
                 'carga_atual', pa.carga_atual
               ) order by pa.ordem
             ), '[]'::jsonb)
         )
    into v_resultado
    from participantes pa;

  return v_resultado;
end;
$$