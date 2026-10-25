-- WORK C: public catalog, transactional server-only lead intake and protected CRM.
alter table public.leads add column request_key uuid unique;
alter table public.leads add column request_fingerprint text;
create index if not exists elite_leads_status_date on public.leads(status,created_at desc);
create index if not exists elite_leads_source_date on public.leads(source,created_at desc);
create index if not exists elite_products_public_date on public.products(created_at desc,id) where is_active and archived_at is null;
create index if not exists elite_products_brand on public.products(brand) where is_active and archived_at is null;
create table elite_private.lead_limits(bucket text primary key, window_start timestamptz not null, hits integer not null);
alter table elite_private.lead_limits enable row level security;
revoke all on elite_private.lead_limits from public,anon,authenticated;

create function public.elite_catalog(filters jsonb default '{}') returns jsonb
language sql stable security invoker set search_path='' as $$
with recursive cats as (
 select c.id from public.categories c where c.is_active and (c.id::text=filters->>'category' or c.slug=filters->>'category')
 union select c.id from public.categories c join cats on c.parent_id=cats.id where c.is_active
), matches as (
 select p.*, c.name category_name,
 (select coalesce(jsonb_agg(i order by i.is_cover desc,i.position,i.id),'[]') from public.product_images i where i.product_id=p.id) images,
 (select coalesce(jsonb_agg(a order by a.position,a.id),'[]') from public.product_attributes a where a.product_id=p.id) attributes
 from public.products p left join public.categories c on c.id=p.category_id and c.is_active
 where p.is_active and p.archived_at is null
 and (coalesce(filters->>'category','')='' or p.category_id in(select id from cats))
 and (coalesce(filters->>'query','')='' or strpos(lower(p.sku||' '||p.name||' '||coalesce(p.brand,'')),lower(left(filters->>'query',160)))>0)
 and (coalesce(filters->>'brand','')='' or p.brand=filters->>'brand')
 and (coalesce(filters->>'availability','')='' or p.availability=filters->>'availability')
 and (coalesce(filters->>'min','')='' or p.price >= (filters->>'min')::numeric)
 and (coalesce(filters->>'max','')='' or p.price <= (filters->>'max')::numeric)
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
 limit 24 offset (greatest(1,least(100000,coalesce((filters->>'page')::int,1)))-1)*24
)
select jsonb_build_object('rows',coalesce((select jsonb_agg(page) from page),'[]'),'total',(select count(*) from matches)) $$;
revoke all on function public.elite_catalog(jsonb) from public;
grant execute on function public.elite_catalog(jsonb) to anon,authenticated;

-- Only Edge Function service_role may execute: never expose this privileged RPC to visitors.
create function public.elite_create_lead(payload jsonb, client_bucket text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v public.leads; item jsonb; p public.products; n text; v_phone text; num text; fp text; hit int;
begin
 if jsonb_typeof(payload)<>'object' or octet_length(payload::text)>16000 then raise exception 'Solicitação inválida.'; end if;
 n:=regexp_replace(btrim(payload->>'name'),'\s+',' ','g'); v_phone:=payload->>'phone';
 if n is null or length(n) not between 3 and 180 or v_phone is null or v_phone !~ '^\+[1-9][0-9]{7,14}$' or coalesce(payload->>'privacy','')<>'true' then raise exception 'Informe nome, telefone e ciência do aviso de privacidade.'; end if;
 if jsonb_typeof(payload->'items') is distinct from 'array' or jsonb_array_length(payload->'items') not between 1 and 50 then raise exception 'Selecione de 1 a 50 produtos.'; end if;
 if (select count(distinct x->>'id') from jsonb_array_elements(payload->'items')x) <> jsonb_array_length(payload->'items') then raise exception 'Produtos repetidos.'; end if;
 if client_bucket is null or length(client_bucket)<>64 then raise exception 'Origem inválida.'; end if;
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
revoke all on function public.elite_create_lead(jsonb,text) from public,anon,authenticated;
grant execute on function public.elite_create_lead(jsonb,text) to service_role;

create function elite_private.crm_actor() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then
   if current_setting('role') not in ('postgres','none','service_role') and coalesce(auth.jwt()->>'role','')<>'service_role' then raise insufficient_privilege; end if;
   new.actor_user_id:=null;
   return new;
 end if;
 if coalesce(auth.jwt()->'app_metadata'->>'eliteparts_role','') not in ('owner','admin') or new.event_type='solicitacao_registrada' then raise insufficient_privilege; end if;
 new.actor_user_id:=auth.uid();
 if length(coalesce(new.note,''))>4000 then raise exception 'Anotação muito longa.'; end if;
 return new;
end $$;
create trigger elite_crm_actor before insert on public.lead_events for each row execute function elite_private.crm_actor();
grant insert on public.lead_events to authenticated;
create function public.elite_update_lead(lead uuid, situation text, note text default '') returns void
language plpgsql security invoker set search_path='' as $$
declare old_status text;
begin
 if auth.uid() is null or coalesce(auth.jwt()->'app_metadata'->>'eliteparts_role','') not in ('owner','admin') then raise insufficient_privilege; end if;
 select status into old_status from public.leads where id=lead for update;
 if not found then raise exception 'Solicitação não encontrada.'; end if;
 update public.leads set status=situation,updated_at=now() where id=lead;
 if old_status<>situation then insert into public.lead_events(lead_id,event_type,note) values(lead,'situacao',old_status||' → '||situation); end if;
 if length(btrim(note))>0 then insert into public.lead_events(lead_id,event_type,note) values(lead,'anotacao',btrim(note)); end if;
end $$;
revoke all on function public.elite_update_lead(uuid,text,text) from public,anon;
grant execute on function public.elite_update_lead(uuid,text,text) to authenticated;
create function public.elite_crm_dashboard() returns jsonb language plpgsql stable security invoker set search_path='' as $$
begin
 if auth.uid() is null or coalesce(auth.jwt()->'app_metadata'->>'eliteparts_role','') not in ('owner','admin') then raise insufficient_privilege; end if;
 return jsonb_build_object('total',(select count(*) from public.leads),'statuses',(select coalesce(jsonb_object_agg(status,n),'{}') from (select status,count(*) n from public.leads group by status)s),'recent',(select coalesce(jsonb_agg(r),'[]') from (select id,full_name,status,created_at from public.leads order by created_at desc limit 5)r));
end $$;
revoke all on function public.elite_crm_dashboard() from public,anon;
grant execute on function public.elite_crm_dashboard() to authenticated;

create function public.elite_list_leads(filters jsonb default '{}') returns jsonb language plpgsql stable security invoker set search_path='' as $$
begin
 if auth.uid() is null or coalesce(auth.jwt()->'app_metadata'->>'eliteparts_role','') not in ('owner','admin') then raise insufficient_privilege; end if;
 return (with matches as (
 select l.*,(select coalesce(jsonb_agg(jsonb_build_object('id',i.id)),'[]') from public.lead_items i where i.lead_id=l.id) lead_items
 from public.leads l where
 (coalesce(filters->>'query','')='' or strpos(lower(l.full_name||' '||l.phone||' '||l.id::text),lower(left(filters->>'query',180)))>0)
 and (coalesce(filters->>'status','')='' or l.status=filters->>'status')
 and (coalesce(filters->>'source','')='' or l.source=filters->>'source')
 and (coalesce(filters->>'from','')='' or l.created_at>=(filters->>'from')::date)
 and (coalesce(filters->>'to','')='' or l.created_at<(filters->>'to')::date+interval '1 day')
 ), page as (select * from matches order by created_at desc,id limit 25 offset (greatest(1,coalesce((filters->>'page')::int,1))-1)*25)
 select jsonb_build_object('rows',coalesce((select jsonb_agg(page) from page),'[]'),'total',(select count(*) from matches)));
end $$;
revoke all on function public.elite_list_leads(jsonb) from public,anon;
grant execute on function public.elite_list_leads(jsonb) to authenticated;

-- Admission counter commits separately, including failed/invalid intake attempts.
create function public.elite_lead_admission(client_bucket text) returns boolean language plpgsql security definer set search_path='' as $$
declare h int;
begin
 if client_bucket is null or length(client_bucket)<>64 then return false; end if;
 insert into elite_private.lead_limits values ('admit:'||client_bucket,date_trunc('hour',now()),1)
 on conflict(bucket) do update set hits=case when lead_limits.window_start<date_trunc('hour',now()) then 1 else lead_limits.hits+1 end,window_start=date_trunc('hour',now()) returning hits into h;
 delete from elite_private.lead_limits where window_start<now()-interval '2 days';
 return h<=30;
end $$;
revoke all on function public.elite_lead_admission(text) from public,anon,authenticated;
grant execute on function public.elite_lead_admission(text) to service_role;
notify pgrst,'reload schema';
