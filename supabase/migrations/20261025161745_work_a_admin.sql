-- Incremental WORK A. Existing tables, data, bucket and policies are preserved.
-- Audit code is private, not an exposed RPC. Actor comes exclusively from auth.uid().
create or replace function elite_private.audit_admin_change() returns trigger
language plpgsql security definer set search_path = pg_catalog as $$
declare before_data jsonb; after_data jsonb; entity uuid;
begin
  if TG_OP <> 'INSERT' then before_data := to_jsonb(old); end if;
  if TG_OP <> 'DELETE' then after_data := to_jsonb(new); end if;
  entity := coalesce(after_data->>'id',before_data->>'id')::uuid;
  insert into public.admin_audit_logs(actor_user_id,entity_type,entity_id,action,changes)
  values(auth.uid(),TG_TABLE_NAME,entity,lower(TG_OP),jsonb_build_object('before',before_data,'after',after_data));
  return coalesce(new,old);
end $$;
revoke all on function elite_private.audit_admin_change() from public, anon, authenticated;
create trigger elite_admin_audit after insert or update or delete on public.products for each row execute function elite_private.audit_admin_change();
create trigger elite_admin_audit after insert or update or delete on public.categories for each row execute function elite_private.audit_admin_change();
create trigger elite_admin_audit after insert or update or delete on public.product_attributes for each row execute function elite_private.audit_admin_change();
create trigger elite_admin_audit after insert or update or delete on public.product_images for each row execute function elite_private.audit_admin_change();
-- Audit table remains read-only to authenticated clients, even administrators.
revoke insert,update,delete,truncate,references,trigger on public.admin_audit_logs from anon,authenticated;

create or replace function elite_private.category_acyclic() returns trigger
language plpgsql set search_path = pg_catalog as $$
begin
  -- Serialize hierarchy edits so two concurrent reparentings cannot create a cycle.
  perform pg_advisory_xact_lock(57832519001);
  if new.parent_id is not null and exists (
    with recursive ancestors as (
      select id,parent_id,array[id] as visited from public.categories where id=new.parent_id
      union all select c.id,c.parent_id,a.visited||c.id from public.categories c join ancestors a on c.id=a.parent_id where not c.id=any(a.visited)
    ) select 1 from ancestors where id=new.id
  ) then raise exception 'A categoria superior criaria um ciclo.' using errcode='23514'; end if;
  return new;
end $$;
revoke all on function elite_private.category_acyclic() from public,anon,authenticated;
create trigger elite_category_acyclic before insert or update of parent_id on public.categories for each row execute function elite_private.category_acyclic();

-- Atomic product + technical attributes, running as the caller under RLS.
create or replace function public.elite_save_product(payload jsonb, attributes jsonb default '[]'::jsonb)
returns jsonb language plpgsql security invoker set search_path = pg_catalog as $$
declare p public.products; product_uuid uuid; attr jsonb; ordinal bigint; amount numeric;
begin
  if auth.uid() is null or coalesce(auth.jwt()->'app_metadata'->>'eliteparts_role','') not in ('owner','admin') then raise insufficient_privilege using message='Acesso administrativo necessário.'; end if;
  if jsonb_typeof(attributes)<>'array' then raise exception 'Especificações inválidas.'; end if;
  if not payload ? 'sku' or payload->>'sku'='' then raise exception 'Informe o código/SKU.'; end if;
  if nullif(payload->>'price','') is not null and (payload->>'price') !~ '^\d{1,10}(\.\d{1,2})?$' then raise exception 'Preço inválido. Use até duas casas decimais.'; end if;
  amount:=nullif(payload->>'price','')::numeric;
  product_uuid:=coalesce(nullif(payload->>'id','')::uuid,gen_random_uuid());
  if nullif(payload->>'id','') is null then
    insert into public.products(id,sku,slug,name,brand,category_id,price,description,availability,position,is_active,specifications)
    values(product_uuid,payload->>'sku',coalesce(nullif(payload->>'slug',''),'produto-'||product_uuid::text),payload->>'name',nullif(payload->>'brand',''),nullif(payload->>'category_id','')::uuid,amount,payload->>'description',payload->>'availability',coalesce((payload->>'position')::integer,0),coalesce((payload->>'is_active')::boolean,false),coalesce(payload->'specifications','{}'::jsonb)) returning * into p;
  else
    update public.products set sku=payload->>'sku',name=payload->>'name',brand=nullif(payload->>'brand',''),category_id=nullif(payload->>'category_id','')::uuid,price=amount,description=payload->>'description',availability=payload->>'availability',position=coalesce((payload->>'position')::integer,0),is_active=coalesce((payload->>'is_active')::boolean,false),specifications=coalesce(payload->'specifications',specifications)
    where id=product_uuid returning * into p;
    if not found then raise exception 'Produto não encontrado ou acesso negado.'; end if;
  end if;
  delete from public.product_attributes where product_id=product_uuid;
  for attr,ordinal in select value, ordinality from jsonb_array_elements(attributes) with ordinality loop
    insert into public.product_attributes(product_id,name,value,unit,position) values(product_uuid,attr->>'name',attr->>'value',nullif(attr->>'unit',''),ordinal-1);
  end loop;
  return to_jsonb(p);
end $$;
revoke all on function public.elite_save_product(jsonb,jsonb) from public,anon;
grant execute on function public.elite_save_product(jsonb,jsonb) to authenticated;

create or replace function public.elite_admin_dashboard() returns jsonb language plpgsql security invoker set search_path = pg_catalog as $$
begin
  if auth.uid() is null or coalesce(auth.jwt()->'app_metadata'->>'eliteparts_role','') not in ('owner','admin') then raise insufficient_privilege using message='Acesso administrativo necessário.'; end if;
  return (select jsonb_build_object('total',count(*),'active',count(*) filter(where is_active and archived_at is null),'unavailable',count(*) filter(where availability='indisponivel' and archived_at is null),'without_images',count(*) filter(where not exists(select 1 from public.product_images i where i.product_id=p.id)),'categories',(select count(*) from public.categories)) from public.products p);
end $$;
revoke all on function public.elite_admin_dashboard() from public,anon;
grant execute on function public.elite_admin_dashboard() to authenticated;

-- Server pagination, deterministic tie-breaker and parameterized filters. No dynamic SQL.
create or replace function public.elite_admin_products(filters jsonb default '{}'::jsonb) returns jsonb
language plpgsql security invoker set search_path=pg_catalog as $$
declare size_limit integer:=least(100,greatest(25,coalesce((filters->>'size')::int,25))); page_index integer:=greatest(1,coalesce((filters->>'page')::int,1)); result jsonb;
begin
  if auth.uid() is null or coalesce(auth.jwt()->'app_metadata'->>'eliteparts_role','') not in ('owner','admin') then raise insufficient_privilege using message='Acesso administrativo necessário.'; end if;
  with filtered as (
    select p.*,c.name category_name,(select thumb_path from public.product_images i where i.product_id=p.id order by is_cover desc,position,id limit 1) thumbnail
    from public.products p left join public.categories c on c.id=p.category_id
    where (coalesce(filters->>'query','')='' or p.sku=filters->>'query' or to_tsvector('simple',coalesce(p.name,'')||' '||coalesce(p.brand,'')||' '||p.sku) @@ websearch_to_tsquery('simple',filters->>'query'))
    and (coalesce(filters->>'category','')='' or p.category_id::text=filters->>'category')
    and (coalesce(filters->>'availability','')='' or p.availability=filters->>'availability')
    and (coalesce(filters->>'publication','')='' or p.is_active=(filters->>'publication'='published'))
    and (coalesce(filters->>'archived','')='' or (filters->>'archived'='yes')=(p.archived_at is not null))
    and (coalesce(filters->>'images','')='' or (filters->>'images'='yes')=exists(select 1 from public.product_images i where i.product_id=p.id))
  ), paged as (
    select * from filtered order by
      case when filters->>'sort'='name' then name end asc,
      case when filters->>'sort'='name_desc' then name end desc,
      case when filters->>'sort'='sku' then sku end asc,
      case when filters->>'sort'='price' then price end asc nulls last,
      case when filters->>'sort'='price_desc' then price end desc nulls last,
      case when coalesce(filters->>'sort','recent')='recent' then updated_at end desc,
      id asc limit size_limit offset (page_index-1)*size_limit
  ) select jsonb_build_object('rows',coalesce((select jsonb_agg(to_jsonb(paged) || jsonb_build_object('price',price::text)) from paged),'[]'::jsonb),'total',(select count(*) from filtered)) into result;
  return result;
end $$;
revoke all on function public.elite_admin_products(jsonb) from public,anon;
grant execute on function public.elite_admin_products(jsonb) to authenticated;

-- Cover/order updates are transactional and serialize per product.
create or replace function public.elite_order_images(product_uuid uuid, ordered_ids uuid[], cover_id uuid)
returns void language plpgsql security invoker set search_path=pg_catalog as $$
begin
  if auth.uid() is null or coalesce(auth.jwt()->'app_metadata'->>'eliteparts_role','') not in ('owner','admin') then raise insufficient_privilege using message='Acesso administrativo necessário.'; end if;
  perform 1 from public.products where id=product_uuid for update;
  if not found then raise exception 'Produto não encontrado.'; end if;
  if cardinality(ordered_ids)<>(select count(*) from public.product_images where product_id=product_uuid)
     or (select count(distinct x) from unnest(ordered_ids) x)<>cardinality(ordered_ids)
     or exists(select 1 from unnest(ordered_ids) x where not exists(select 1 from public.product_images i where i.id=x and i.product_id=product_uuid))
     or (cardinality(ordered_ids)>0 and (cover_id is null or not cover_id=any(ordered_ids))) then raise exception 'As imagens foram alteradas. Atualize a galeria.'; end if;
  update public.product_images set is_cover=false where product_id=product_uuid and is_cover;
  update public.product_images i set position=a.n-1,is_cover=(i.id=cover_id) from unnest(ordered_ids) with ordinality a(id,n) where i.id=a.id and i.product_id=product_uuid;
end $$;
revoke all on function public.elite_order_images(uuid,uuid[],uuid) from public,anon;
grant execute on function public.elite_order_images(uuid,uuid[],uuid) to authenticated;
create index if not exists products_admin_updated_idx on public.products(updated_at desc,id);
create index if not exists products_admin_name_idx on public.products(name,id);
notify pgrst,'reload schema';
