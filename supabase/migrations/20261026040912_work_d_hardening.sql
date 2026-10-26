-- Incremental WORK D. No products, leads, identities or snapshots are deleted.
-- Duplicate elite_leads_status_date can be removed during a separately verified maintenance step.
create policy elite_limits_deny_clients on elite_private.lead_limits for all to anon,authenticated using(false) with check(false);

create or replace function public.elite_catalog(filters jsonb default '{}') returns jsonb
language plpgsql stable security invoker set search_path='' as $$
begin
 if jsonb_typeof(filters) is distinct from 'object' or octet_length(filters::text)>16000 then raise exception 'Filtros inválidos.'; end if;
 if filters ? 'ids' then
 if jsonb_typeof(filters->'ids') is distinct from 'array' then raise exception 'Lista de produtos inválida.'; end if;
 if jsonb_array_length(filters->'ids')>100 then raise exception 'Lista de produtos muito grande.'; end if;
 end if;
 return (
with recursive cats as (
 select c.id from public.categories c where c.is_active and (c.id::text=filters->>'category' or c.slug=filters->>'category')
 union select c.id from public.categories c join cats on c.parent_id=cats.id where c.is_active
), matches as (
 select p.*, c.name category_name
 from public.products p left join public.categories c on c.id=p.category_id and c.is_active
 where p.is_active and p.archived_at is null
 and (coalesce(filters->>'category','')='' or p.category_id in(select id from cats))
 and (coalesce(filters->>'query','')='' or strpos(lower(p.sku||' '||p.name||' '||coalesce(p.brand,'')),lower(left(filters->>'query',160)))>0)
 and (coalesce(filters->>'brand','')='' or p.brand=filters->>'brand')
 and (coalesce(filters->>'availability','')='' or p.availability=filters->>'availability')
 and (coalesce(filters->>'min','')='' or p.price >= (case when filters->>'min' ~ '^[0-9]{1,10}([.][0-9]{1,2})?$' then filters->>'min' end)::numeric)
 and (coalesce(filters->>'max','')='' or p.price <= (case when filters->>'max' ~ '^[0-9]{1,10}([.][0-9]{1,2})?$' then filters->>'max' end)::numeric)
 and (coalesce(filters->>'slug','')='' or p.slug=filters->>'slug')
 and (not filters ? 'ids' or p.id::text in(select jsonb_array_elements_text(filters->'ids')))
), page as (
 select * from matches order by
 (lower(sku)=lower(filters->>'query')) desc nulls last,
 case when filters->>'sort'='nome' then name end asc,
 case when filters->>'sort'='nome-desc' then name end desc,
 case when filters->>'sort'='preco' then price end asc nulls last,
 case when filters->>'sort'='preco-desc' then price end desc nulls last,
 created_at desc,id
 limit 24 offset (greatest(1,least(100000,coalesce((case when filters->>'page' ~ '^[1-9][0-9]{0,4}$' then filters->>'page' end)::int,1)))-1)*24
)
select jsonb_build_object('rows',coalesce((select jsonb_agg(to_jsonb(page)||jsonb_build_object(
 'images',(select coalesce(jsonb_agg(i order by i.is_cover desc,i.position,i.id),'[]') from public.product_images i where i.product_id=page.id),
 'attributes',(select coalesce(jsonb_agg(a order by a.position,a.id),'[]') from public.product_attributes a where a.product_id=page.id)
 )) from page),'[]'),'total',(select count(*) from matches)));
end $$;

create or replace function public.elite_create_lead(payload jsonb, client_bucket text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v public.leads; item jsonb; p public.products; n text; v_phone text; num text; fp text; hit int;
begin
 if jsonb_typeof(payload) is distinct from 'object' or octet_length(payload::text)>16000 then raise exception 'Solicitação inválida.'; end if;
 n:=regexp_replace(btrim(payload->>'name'),'\s+',' ','g'); v_phone:=payload->>'phone';
 if n is null or length(n) not between 3 and 180 or v_phone is null or v_phone !~ '^\+[1-9][0-9]{7,14}$' or coalesce(payload->>'privacy','')<>'true' then raise exception 'Informe nome, telefone e ciência do aviso de privacidade.'; end if;
 if jsonb_typeof(payload->'items') is distinct from 'array' or jsonb_array_length(payload->'items') not between 1 and 50 then raise exception 'Selecione de 1 a 50 produtos.'; end if;
 if (select count(distinct x->>'id') from jsonb_array_elements(payload->'items')x) <> jsonb_array_length(payload->'items') then raise exception 'Produtos repetidos.'; end if;
 if client_bucket is null or length(client_bucket)<>64 then raise exception 'Origem inválida.'; end if;
 if coalesce(payload->>'key','') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then raise exception 'Chave inválida.'; end if;
 if exists(select 1 from jsonb_array_elements(payload->'items') i where coalesce(i->>'id','') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') then raise exception 'Produto inválido.'; end if;
 perform pg_advisory_xact_lock(hashtextextended(v_phone,1));
 fp:=md5(jsonb_build_object('name',n,'phone',v_phone,'items',payload->'items')::text);
 perform pg_advisory_xact_lock(hashtextextended((payload->>'key')::uuid::text,0));
 select * into v from public.leads where request_key=(payload->>'key')::uuid;
 if found then
   if v.request_fingerprint<>fp then raise exception 'Esta solicitação já foi utilizada com outros dados.'; end if;
 else
   insert into elite_private.lead_limits values(client_bucket,date_trunc('hour',now()),1)
   on conflict(bucket) do update set hits=case when lead_limits.window_start<date_trunc('hour',now()) then 1 else lead_limits.hits+1 end,window_start=date_trunc('hour',now()) returning hits into hit;
   if hit>10 then raise exception 'Limite de solicitações atingido. Tente mais tarde.'; end if;
   -- Also bound submissions per phone, independent of IP.
   if (select count(*) from public.leads where leads.phone=v_phone and created_at>now()-interval '1 hour')>=5 then raise exception 'Limite de solicitações atingido. Tente mais tarde.'; end if;
   select value#>>'{}' into num from public.site_settings where key='whatsapp_number' and is_public;
   if num is null or num !~ '^[1-9][0-9]{7,14}$' then raise exception 'Atendimento comercial aguardando configuração.'; end if;
   insert into public.leads(full_name,phone,source,privacy_notice_version,privacy_acknowledged_at,request_key,request_fingerprint)
   values(n,v_phone,'catalogo','2026-10-25',now(),(payload->>'key')::uuid,fp) returning * into v;
   for item in select * from jsonb_array_elements(payload->'items') loop
     if coalesce(item->>'quantity','') !~ '^[0-9]{1,2}$' or (item->>'quantity')::int not between 1 and 99 then raise exception 'Quantidade inválida.'; end if;
     select * into p from public.products where id=(item->>'id')::uuid and is_active and archived_at is null and availability<>'indisponivel' for share;
     if not found then raise exception 'Um produto foi removido ou está indisponível. Atualize sua lista.'; end if;
     insert into public.lead_items(lead_id,product_id,sku_snapshot,name_snapshot,price_snapshot,quantity) values(v.id,p.id,p.sku,p.name,p.price,(item->>'quantity')::int);
   end loop;
   insert into public.lead_events(lead_id,event_type,note) values(v.id,'solicitacao_registrada','Registro confirmado; envio da mensagem pelo cliente não verificado.');
 end if;
 select value#>>'{}' into num from public.site_settings where key='whatsapp_number' and is_public;
 return jsonb_build_object('id',v.id,'number',num,'name',v.full_name,'items',(select jsonb_agg(jsonb_build_object('name',name_snapshot,'sku',sku_snapshot,'quantity',quantity) order by id) from public.lead_items where lead_id=v.id));
end $$;

-- Global counters are authoritative; changing x-forwarded-for cannot evade them.
create or replace function public.elite_lead_admission(client_bucket text) returns boolean language plpgsql security definer set search_path='' as $$
declare minute_hits int; hour_hits int;
begin
 insert into elite_private.lead_limits values('global:minute',date_trunc('minute',now()),1)
 on conflict(bucket) do update set hits=case when lead_limits.window_start<date_trunc('minute',now()) then 1 else lead_limits.hits+1 end,window_start=date_trunc('minute',now()) returning hits into minute_hits;
 insert into elite_private.lead_limits values('global:hour',date_trunc('hour',now()),1)
 on conflict(bucket) do update set hits=case when lead_limits.window_start<date_trunc('hour',now()) then 1 else lead_limits.hits+1 end,window_start=date_trunc('hour',now()) returning hits into hour_hits;
 delete from elite_private.lead_limits where window_start<now()-interval '2 days';
 return minute_hits<=30 and hour_hits<=120;
end $$;

create function elite_private.crm_status_history() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.status is distinct from old.status then
 if auth.uid() is not null and coalesce(auth.jwt()->'app_metadata'->>'eliteparts_role','') not in ('owner','admin') then raise insufficient_privilege; end if;
 insert into public.lead_events(lead_id,event_type,note) values(new.id,'situacao',old.status||' → '||new.status);
 end if;
 return new;
end $$;
create trigger elite_lead_status_history after update of status on public.leads for each row execute function elite_private.crm_status_history();
create or replace function public.elite_update_lead(lead uuid,situation text,note text default '') returns void language plpgsql security invoker set search_path='' as $$
begin
 if auth.uid() is null or coalesce(auth.jwt()->'app_metadata'->>'eliteparts_role','') not in ('owner','admin') then raise insufficient_privilege; end if;
 if situation is null or situation not in ('novo','em_atendimento','orcamento_enviado','convertido','perdido') or length(coalesce(note,''))>4000 then raise exception 'Situação ou anotação inválida.'; end if;
 perform 1 from public.leads where id=lead for update;
 if not found then raise exception 'Solicitação não encontrada.'; end if;
 update public.leads set status=situation,updated_at=now() where id=lead;
 if length(btrim(note))>0 then insert into public.lead_events(lead_id,event_type,note) values(lead,'anotacao',btrim(note)); end if;
end $$;
notify pgrst,'reload schema';
