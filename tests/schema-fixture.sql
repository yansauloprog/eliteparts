-- Isolated test fixture reconstructed from inspected schema. NEVER apply to the hosted project.
create role anon; create role authenticated; create role service_role bypassrls;
create schema auth; create schema elite_private;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claims',true)::jsonb->>'sub','')::uuid $$;
create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
grant usage on schema public,auth to anon,authenticated;
grant execute on all functions in schema auth to anon,authenticated;
create table public.admin_audit_logs (
"id" uuid default gen_random_uuid() not null,
"actor_user_id" uuid,
"entity_type" text not null,
"entity_id" uuid,
"action" text not null,
"changes" jsonb default '{}'::jsonb not null,
"created_at" timestamp with time zone default now() not null);
create table public.categories (
"id" uuid default gen_random_uuid() not null,
"parent_id" uuid,
"name" text not null,
"slug" text not null,
"position" integer default 0 not null,
"is_active" boolean default true not null,
"created_at" timestamp with time zone default now() not null,
"updated_at" timestamp with time zone default now() not null);
create table public.lead_events (
"id" uuid default gen_random_uuid() not null,
"lead_id" uuid not null,
"event_type" text not null,
"note" text,
"actor_user_id" uuid,
"created_at" timestamp with time zone default now() not null);
create table public.lead_items (
"id" uuid default gen_random_uuid() not null,
"lead_id" uuid not null,
"product_id" uuid,
"sku_snapshot" text not null,
"name_snapshot" text not null,
"price_snapshot" numeric,
"quantity" integer not null,
"created_at" timestamp with time zone default now() not null);
create table public.leads (
"id" uuid default gen_random_uuid() not null,
"full_name" text not null,
"phone" text not null,
"status" text default 'novo'::text not null,
"source" text default 'catalogo'::text not null,
"privacy_notice_version" text not null,
"privacy_acknowledged_at" timestamp with time zone not null,
"whatsapp_opened_at" timestamp with time zone,
"admin_notes" text,
"created_at" timestamp with time zone default now() not null,
"updated_at" timestamp with time zone default now() not null);
create table public.media_import_jobs (
"id" uuid default gen_random_uuid() not null,
"source_name" text,
"status" text default 'pendente'::text not null,
"total_files" integer default 0 not null,
"linked_files" integer default 0 not null,
"pending_files" integer default 0 not null,
"failed_files" integer default 0 not null,
"report" jsonb default '{}'::jsonb not null,
"created_by" uuid,
"created_at" timestamp with time zone default now() not null,
"finished_at" timestamp with time zone);
create table public.product_attributes (
"id" uuid default gen_random_uuid() not null,
"product_id" uuid not null,
"name" text not null,
"value" text not null,
"unit" text,
"position" integer default 0 not null);
create table public.product_images (
"id" uuid default gen_random_uuid() not null,
"product_id" uuid not null,
"original_filename" text,
"full_path" text not null,
"thumb_path" text not null,
"checksum_sha256" text,
"position" integer default 0 not null,
"is_cover" boolean default false not null,
"created_at" timestamp with time zone default now() not null);
create table public.products (
"id" uuid default gen_random_uuid() not null,
"sku" text not null,
"slug" text not null,
"category_id" uuid,
"name" text not null,
"brand" text,
"description" text,
"price" numeric,
"availability" text default 'sob_consulta'::text not null,
"specifications" jsonb default '{}'::jsonb not null,
"position" integer default 0 not null,
"is_active" boolean default false not null,
"archived_at" timestamp with time zone,
"created_at" timestamp with time zone default now() not null,
"updated_at" timestamp with time zone default now() not null);
create table public.site_settings (
"key" text not null,
"value" jsonb default 'null'::jsonb not null,
"is_public" boolean default false not null,
"updated_at" timestamp with time zone default now() not null);
alter table public.lead_events add constraint "lead_events_pkey" PRIMARY KEY (id);
alter table public.categories add constraint "categories_name_check" CHECK (((char_length(btrim(name)) >= 1) AND (char_length(btrim(name)) <= 160)));
alter table public.categories add constraint "categories_slug_check" CHECK (((char_length(btrim(slug)) >= 1) AND (char_length(btrim(slug)) <= 200)));
alter table public.categories add constraint "categories_not_own_parent" CHECK ((parent_id IS DISTINCT FROM id));
alter table public.categories add constraint "categories_pkey" PRIMARY KEY (id);
alter table public.categories add constraint "categories_slug_key" UNIQUE (slug);
alter table public.products add constraint "products_sku_check" CHECK ((((char_length(btrim(sku)) >= 1) AND (char_length(btrim(sku)) <= 120)) AND (sku = btrim(sku))));
alter table public.products add constraint "products_slug_check" CHECK (((char_length(btrim(slug)) >= 1) AND (char_length(btrim(slug)) <= 220)));
alter table public.lead_items add constraint "lead_items_price_snapshot_check" CHECK (((price_snapshot IS NULL) OR (price_snapshot >= (0)::numeric)));
alter table public.products add constraint "products_name_check" CHECK (((char_length(btrim(name)) >= 1) AND (char_length(btrim(name)) <= 240)));
alter table public.products add constraint "products_price_check" CHECK (((price IS NULL) OR (price >= (0)::numeric)));
alter table public.products add constraint "products_availability_check" CHECK ((availability = ANY (ARRAY['disponivel'::text, 'sob_consulta'::text, 'indisponivel'::text])));
alter table public.products add constraint "products_specifications_check" CHECK ((jsonb_typeof(specifications) = 'object'::text));
alter table public.products add constraint "products_pkey" PRIMARY KEY (id);
alter table public.products add constraint "products_sku_key" UNIQUE (sku);
alter table public.products add constraint "products_slug_key" UNIQUE (slug);
alter table public.product_attributes add constraint "product_attributes_name_check" CHECK (((char_length(btrim(name)) >= 1) AND (char_length(btrim(name)) <= 120)));
alter table public.lead_items add constraint "lead_items_quantity_check" CHECK (((quantity >= 1) AND (quantity <= 10000)));
alter table public.lead_items add constraint "lead_items_pkey" PRIMARY KEY (id);
alter table public.product_attributes add constraint "product_attributes_value_check" CHECK (((char_length(btrim(value)) >= 1) AND (char_length(btrim(value)) <= 1500)));
alter table public.product_attributes add constraint "product_attributes_pkey" PRIMARY KEY (id);
alter table public.product_attributes add constraint "product_attributes_product_id_name_key" UNIQUE (product_id, name);
alter table public.product_images add constraint "product_images_pkey" PRIMARY KEY (id);
alter table public.product_images add constraint "product_images_full_path_key" UNIQUE (full_path);
alter table public.product_images add constraint "product_images_thumb_path_key" UNIQUE (thumb_path);
alter table public.leads add constraint "leads_full_name_check" CHECK (((char_length(btrim(full_name)) >= 3) AND (char_length(btrim(full_name)) <= 180)));
alter table public.leads add constraint "leads_phone_check" CHECK (((char_length(btrim(phone)) >= 8) AND (char_length(btrim(phone)) <= 30)));
alter table public.leads add constraint "leads_status_check" CHECK ((status = ANY (ARRAY['novo'::text, 'em_atendimento'::text, 'orcamento_enviado'::text, 'convertido'::text, 'perdido'::text])));
alter table public.leads add constraint "leads_pkey" PRIMARY KEY (id);
alter table public.media_import_jobs add constraint "media_import_jobs_status_check" CHECK ((status = ANY (ARRAY['pendente'::text, 'processando'::text, 'revisao'::text, 'concluido'::text, 'falhou'::text, 'cancelado'::text])));
alter table public.media_import_jobs add constraint "media_import_jobs_total_files_check" CHECK ((total_files >= 0));
alter table public.media_import_jobs add constraint "media_import_jobs_linked_files_check" CHECK ((linked_files >= 0));
alter table public.media_import_jobs add constraint "media_import_jobs_pending_files_check" CHECK ((pending_files >= 0));
alter table public.media_import_jobs add constraint "media_import_jobs_failed_files_check" CHECK ((failed_files >= 0));
alter table public.media_import_jobs add constraint "media_import_jobs_pkey" PRIMARY KEY (id);
alter table public.admin_audit_logs add constraint "admin_audit_logs_pkey" PRIMARY KEY (id);
alter table public.site_settings add constraint "site_settings_key_check" CHECK (((char_length(btrim(key)) >= 1) AND (char_length(btrim(key)) <= 140)));
alter table public.site_settings add constraint "site_settings_pkey" PRIMARY KEY (key);
alter table public.lead_items add constraint "lead_items_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;
alter table public.lead_events add constraint "lead_events_lead_id_fkey" FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;
alter table public.lead_events add constraint "lead_events_actor_user_id_fkey" FOREIGN KEY (actor_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table public.categories add constraint "categories_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL;
alter table public.products add constraint "products_category_id_fkey" FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;
alter table public.product_attributes add constraint "product_attributes_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
alter table public.product_images add constraint "product_images_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
alter table public.lead_items add constraint "lead_items_lead_id_fkey" FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;
alter table public.media_import_jobs add constraint "media_import_jobs_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table public.admin_audit_logs add constraint "admin_audit_logs_actor_user_id_fkey" FOREIGN KEY (actor_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX categories_parent_position_idx ON public.categories USING btree (parent_id, "position");
CREATE INDEX products_category_active_idx ON public.products USING btree (category_id, is_active, "position");
CREATE INDEX products_active_price_idx ON public.products USING btree (is_active, price);
CREATE INDEX products_lower_sku_idx ON public.products USING btree (lower(sku));
CREATE INDEX products_fts_simple_idx ON public.products USING gin (to_tsvector('simple'::regconfig, ((((COALESCE(name, ''::text) || ' '::text) || COALESCE(brand, ''::text)) || ' '::text) || sku)));
CREATE INDEX product_attributes_product_idx ON public.product_attributes USING btree (product_id);
CREATE UNIQUE INDEX product_images_one_cover_per_product ON public.product_images USING btree (product_id) WHERE is_cover;
CREATE INDEX product_images_product_position_idx ON public.product_images USING btree (product_id, "position");
CREATE INDEX leads_created_idx ON public.leads USING btree (created_at DESC);
CREATE INDEX leads_status_created_idx ON public.leads USING btree (status, created_at DESC);
CREATE INDEX leads_phone_idx ON public.leads USING btree (phone);
CREATE INDEX lead_items_lead_idx ON public.lead_items USING btree (lead_id);
CREATE INDEX lead_items_product_idx ON public.lead_items USING btree (product_id);
CREATE INDEX media_import_jobs_status_created_idx ON public.media_import_jobs USING btree (status, created_at DESC);
CREATE INDEX media_import_creator_idx ON public.media_import_jobs USING btree (created_by);
CREATE INDEX admin_audit_logs_created_idx ON public.admin_audit_logs USING btree (created_at DESC);
CREATE INDEX admin_audit_actor_idx ON public.admin_audit_logs USING btree (actor_user_id);
CREATE INDEX lead_events_lead_created_idx ON public.lead_events USING btree (lead_id, created_at DESC);
CREATE INDEX lead_events_actor_idx ON public.lead_events USING btree (actor_user_id);
alter table public.admin_audit_logs enable row level security;
alter table public.categories enable row level security;
alter table public.lead_events enable row level security;
alter table public.lead_items enable row level security;
alter table public.leads enable row level security;
alter table public.media_import_jobs enable row level security;
alter table public.product_attributes enable row level security;
alter table public.product_images enable row level security;
alter table public.products enable row level security;
alter table public.site_settings enable row level security;
create policy "elite_categories_read" on public.categories for SELECT to public using ((is_active OR (((( SELECT auth.jwt() AS jwt) -> 'app_metadata'::text) ->> 'eliteparts_role'::text) = ANY (ARRAY['owner'::text, 'admin'::text]))));
create policy "elite_categories_insert" on public.categories for INSERT to authenticated with check ((((( SELECT auth.jwt() AS jwt) -> 'app_metadata'::text) ->> 'eliteparts_role'::text) = ANY (ARRAY['owner'::text, 'admin'::text])));
create policy "elite_categories_update" on public.categories for UPDATE to authenticated using ((((( SELECT auth.jwt() AS jwt) -> 'app_metadata'::text) ->> 'eliteparts_role'::text) = ANY (ARRAY['owner'::text, 'admin'::text]))) with check ((((( SELECT auth.jwt() AS jwt) -> 'app_metadata'::text) ->> 'eliteparts_role'::text) = ANY (ARRAY['owner'::text, 'admin'::text])));
create policy "elite_categories_delete" on public.categories for DELETE to authenticated using ((((( SELECT auth.jwt() AS jwt) -> 'app_metadata'::text) ->> 'eliteparts_role'::text) = ANY (ARRAY['owner'::text, 'admin'::text])));
create policy "elite_products_read" on public.products for SELECT to public using (((is_active AND (archived_at IS NULL)) OR (((( SELECT auth.jwt() AS jwt) -> 'app_metadata'::text) ->> 'eliteparts_role'::text) = ANY (ARRAY['owner'::text, 'admin'::text]))));
create policy "elite_products_insert" on public.products for INSERT to authenticated with check ((((( SELECT auth.jwt() AS jwt) -> 'app_metadata'::text) ->> 'eliteparts_role'::text) = ANY (ARRAY['owner'::text, 'admin'::text])));
create policy "elite_products_update" on public.products for UPDATE to authenticated using ((((( SELECT auth.jwt() AS jwt) -> 'app_metadata'::text) ->> 'eliteparts_role'::text) = ANY (ARRAY['owner'::text, 'admin'::text]))) with check ((((( SELECT auth.jwt() AS jwt) -> 'app_metadata'::text) ->> 'eliteparts_role'::text) = ANY (ARRAY['owner'::text, 'admin'::text])));
create policy "elite_products_delete" on public.products for DELETE to authenticated using ((((( SELECT auth.jwt() AS jwt) -> 'app_metadata'::text) ->> 'eliteparts_role'::text) = ANY (ARRAY['owner'::text, 'admin'::text])));
create policy "elite_product_attributes_read" on public.product_attributes for SELECT to public using (((EXISTS ( SELECT 1
   FROM products p
  WHERE ((p.id = product_attributes.product_id) AND p.is_active AND (p.archived_at IS NULL)))) OR (((( SELECT auth.jwt() AS jwt) -> 'app_metadata'::text) ->> 'eliteparts_role'::text) = ANY (ARRAY['owner'::text, 'admin'::text]))));
create policy "elite_product_attributes_insert" on public.product_attributes for INSERT to authenticated with check ((((( SELECT auth.jwt() AS jwt) -> 'app_metadata'::text) ->> 'eliteparts_role'::text) = ANY (ARRAY['owner'::text, 'admin'::text])));
create policy "elite_product_attributes_update" on public.product_attributes for UPDATE to authenticated using ((((( SELECT auth.jwt() AS jwt) -> 'app_metadata'::text) ->> 'eliteparts_role'::text) = ANY (ARRAY['owner'::text, 'admin'::text]))) with check ((((( SELECT auth.jwt() AS jwt) -> 'app_metadata'::text) ->> 'eliteparts_role'::text) = ANY (ARRAY['owner'::text, 'admin'::text])));
create policy "elite_product_attributes_delete" on public.product_attributes for DELETE to authenticated using ((((( SELECT auth.jwt() AS jwt) -> 'app_metadata'::text) ->> 'eliteparts_role'::text) = ANY (ARRAY['owner'::text, 'admin'::text])));
create policy "elite_product_images_read" on public.product_images for SELECT to public using (((EXISTS ( SELECT 1
   FROM products p
  WHERE ((p.id = product_images.product_id) AND p.is_active AND (p.archived_at IS NULL)))) OR (((( SELECT auth.jwt() AS jwt) -> 'app_metadata'::text) ->> 'eliteparts_role'::text) = ANY (ARRAY['owner'::text, 'admin'::text]))));
create policy "elite_product_images_insert" on public.product_images for INSERT to authenticated with check ((((( SELECT auth.jwt() AS jwt) -> 'app_metadata'::text) ->> 'eliteparts_role'::text) = ANY (ARRAY['owner'::text, 'admin'::text])));
create policy "elite_product_images_update" on public.product_images for UPDATE to authenticated using ((((( SELECT auth.jwt() AS jwt) -> 'app_metadata'::text) ->> 'eliteparts_role'::text) = ANY (ARRAY['owner'::text, 'admin'::text]))) with check ((((( SELECT auth.jwt() AS jwt) -> 'app_metadata'::text) ->> 'eliteparts_role'::text) = ANY (ARRAY['owner'::text, 'admin'::text])));
create policy "elite_product_images_delete" on public.product_images for DELETE to authenticated using ((((( SELECT auth.jwt() AS jwt) -> 'app_metadata'::text) ->> 'eliteparts_role'::text) = ANY (ARRAY['owner'::text, 'admin'::text])));
create policy "elite_lead_events_admin_read" on public.lead_events for SELECT to authenticated using ((((( SELECT auth.jwt() AS jwt) -> 'app_metadata'::text) ->> 'eliteparts_role'::text) = ANY (ARRAY['owner'::text, 'admin'::text])));
create policy "elite_site_settings_read" on public.site_settings for SELECT to public using ((is_public OR (((( SELECT auth.jwt() AS jwt) -> 'app_metadata'::text) ->> 'eliteparts_role'::text) = ANY (ARRAY['owner'::text, 'admin'::text]))));
create policy "elite_site_settings_insert" on public.site_settings for INSERT to authenticated with check ((((( SELECT auth.jwt() AS jwt) -> 'app_metadata'::text) ->> 'eliteparts_role'::text) = ANY (ARRAY['owner'::text, 'admin'::text])));
create policy "elite_site_settings_update" on public.site_settings for UPDATE to authenticated using ((((( SELECT auth.jwt() AS jwt) -> 'app_metadata'::text) ->> 'eliteparts_role'::text) = ANY (ARRAY['owner'::text, 'admin'::text]))) with check ((((( SELECT auth.jwt() AS jwt) -> 'app_metadata'::text) ->> 'eliteparts_role'::text) = ANY (ARRAY['owner'::text, 'admin'::text])));
create policy "elite_site_settings_delete" on public.site_settings for DELETE to authenticated using ((((( SELECT auth.jwt() AS jwt) -> 'app_metadata'::text) ->> 'eliteparts_role'::text) = ANY (ARRAY['owner'::text, 'admin'::text])));
create policy "elite_leads_admin" on public.leads for ALL to authenticated using ((((( SELECT auth.jwt() AS jwt) -> 'app_metadata'::text) ->> 'eliteparts_role'::text) = ANY (ARRAY['owner'::text, 'admin'::text]))) with check ((((( SELECT auth.jwt() AS jwt) -> 'app_metadata'::text) ->> 'eliteparts_role'::text) = ANY (ARRAY['owner'::text, 'admin'::text])));
create policy "elite_lead_items_admin_read" on public.lead_items for SELECT to authenticated using ((((( SELECT auth.jwt() AS jwt) -> 'app_metadata'::text) ->> 'eliteparts_role'::text) = ANY (ARRAY['owner'::text, 'admin'::text])));
create policy "elite_lead_events_admin_insert" on public.lead_events for INSERT to authenticated with check ((((( SELECT auth.jwt() AS jwt) -> 'app_metadata'::text) ->> 'eliteparts_role'::text) = ANY (ARRAY['owner'::text, 'admin'::text])));
create policy "elite_media_import_admin" on public.media_import_jobs for ALL to authenticated using ((((( SELECT auth.jwt() AS jwt) -> 'app_metadata'::text) ->> 'eliteparts_role'::text) = ANY (ARRAY['owner'::text, 'admin'::text]))) with check ((((( SELECT auth.jwt() AS jwt) -> 'app_metadata'::text) ->> 'eliteparts_role'::text) = ANY (ARRAY['owner'::text, 'admin'::text])));
create policy "elite_audit_logs_admin_read" on public.admin_audit_logs for SELECT to authenticated using ((((( SELECT auth.jwt() AS jwt) -> 'app_metadata'::text) ->> 'eliteparts_role'::text) = ANY (ARRAY['owner'::text, 'admin'::text])));
grant select on public.products,public.categories,public.product_images,public.product_attributes,public.site_settings to anon;
grant select,insert,update,delete on public.products,public.categories,public.product_images,public.product_attributes,public.site_settings,public.leads,public.media_import_jobs to authenticated;
grant select on public.lead_items,public.lead_events,public.admin_audit_logs to authenticated;

