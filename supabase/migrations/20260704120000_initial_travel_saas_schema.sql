-- Travel SaaS initial Supabase schema
-- Compatible with Supabase PostgreSQL.

begin;

create extension if not exists pgcrypto;
create extension if not exists postgis;

do $$
begin
  create type public.usuario_rol as enum ('admin', 'cobranza', 'operador');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.proveedor_tipo as enum ('yate', 'van', 'guia_externo', 'hotel');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.orden_estatus as enum (
    'cotizado',
    'confirmado',
    'pagado',
    'en_espera',
    'en_progreso',
    'finalizado',
    'cancelado'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  email text not null unique,
  telefono text,
  rol public.usuario_rol not null default 'operador',
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  constraint usuarios_email_formato_chk check (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$')
);

create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  nombre_completo text not null,
  telefono text not null,
  email text,
  created_at timestamptz not null default now(),
  constraint clientes_telefono_whatsapp_chk check (telefono ~ '^\+[1-9][0-9]{7,14}$'),
  constraint clientes_email_formato_chk check (email is null or email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$')
);

create table if not exists public.proveedores_unidades (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  tipo public.proveedor_tipo not null,
  contacto text,
  created_at timestamptz not null default now()
);

create table if not exists public.contratos_tarifas (
  id uuid primary key default gen_random_uuid(),
  proveedor_id uuid not null references public.proveedores_unidades(id) on delete cascade,
  nombre_convenio text not null,
  costo_neto numeric(12, 2) not null,
  vigencia_inicio date not null,
  vigencia_fin date not null,
  documento_url text,
  created_at timestamptz not null default now(),
  constraint contratos_tarifas_costo_neto_chk check (costo_neto >= 0),
  constraint contratos_tarifas_vigencia_chk check (vigencia_fin >= vigencia_inicio)
);

create table if not exists public.experiencias_catalogo (
  id uuid primary key default gen_random_uuid(),
  nombre_tour text not null,
  descripcion text,
  ubicacion_maps_url text not null,
  duracion_estimada interval not null,
  created_at timestamptz not null default now(),
  constraint experiencias_catalogo_maps_url_chk check (ubicacion_maps_url ~* '^https?://'),
  constraint experiencias_catalogo_duracion_chk check (duracion_estimada > interval '0 minutes')
);

create table if not exists public.ordenes_servicio (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete restrict,
  experiencia_id uuid references public.experiencias_catalogo(id) on delete set null,
  operador_id uuid references public.usuarios(id) on delete set null,
  unidad_id uuid references public.proveedores_unidades(id) on delete set null,
  estatus public.orden_estatus not null default 'cotizado',

  fecha_servicio date not null,
  hora_servicio time not null,
  servicio_inicio_at timestamptz not null,

  checkin_time timestamptz,
  checkin_gps geography(point, 4326),
  checkin_usuario_id uuid references public.usuarios(id) on delete set null,

  checkout_time timestamptz,
  checkout_gps geography(point, 4326),
  checkout_usuario_id uuid references public.usuarios(id) on delete set null,
  evidencia_foto_url text,

  es_servicio_aeropuerto boolean not null default false,
  numero_vuelo text,
  vuelo_origen text,
  vuelo_destino text,
  vuelo_fecha date,
  aerolinea text,
  terminal text,
  hora_estimada_vuelo timestamptz,
  estatus_vuelo text,
  serpapi_last_sync_at timestamptz,

  whatsapp_1hr_enviado boolean not null default false,
  whatsapp_1hr_enviado_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint ordenes_servicio_checkin_requerido_chk check (
    estatus not in ('en_progreso', 'finalizado')
    or (checkin_time is not null and checkin_gps is not null and checkin_usuario_id is not null)
  ),
  constraint ordenes_servicio_checkout_requerido_chk check (
    estatus <> 'finalizado'
    or (
      checkout_time is not null
      and checkout_gps is not null
      and checkout_usuario_id is not null
      and evidencia_foto_url is not null
      and length(trim(evidencia_foto_url)) > 0
    )
  ),
  constraint ordenes_servicio_checkout_despues_checkin_chk check (
    checkout_time is null
    or checkin_time is null
    or checkout_time >= checkin_time
  ),
  constraint ordenes_servicio_aeropuerto_campos_chk check (
    es_servicio_aeropuerto = false
    or (
      numero_vuelo is not null
      and vuelo_origen is not null
      and vuelo_destino is not null
      and vuelo_fecha is not null
    )
  ),
  constraint ordenes_servicio_whatsapp_timestamp_chk check (
    whatsapp_1hr_enviado = false
    or whatsapp_1hr_enviado_at is not null
  )
);

create table if not exists public.control_cobranza (
  id uuid primary key default gen_random_uuid(),
  orden_servicio_id uuid not null unique references public.ordenes_servicio(id) on delete cascade,
  total_servicio numeric(12, 2) not null,
  monto_anticipo numeric(12, 2) not null default 0,
  saldo_pendiente numeric(12, 2) generated always as (total_servicio - monto_anticipo) stored,
  fecha_limite_pago date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint control_cobranza_total_chk check (total_servicio >= 0),
  constraint control_cobranza_anticipo_chk check (monto_anticipo >= 0 and monto_anticipo <= total_servicio)
);

create index if not exists idx_usuarios_rol_activo on public.usuarios (rol, activo);
create index if not exists idx_clientes_nombre on public.clientes using gin (to_tsvector('spanish', nombre_completo));
create index if not exists idx_contratos_tarifas_proveedor on public.contratos_tarifas (proveedor_id);
create index if not exists idx_contratos_tarifas_vigencia on public.contratos_tarifas (vigencia_inicio, vigencia_fin);
create index if not exists idx_ordenes_servicio_fecha_hora on public.ordenes_servicio (fecha_servicio, hora_servicio);
create index if not exists idx_ordenes_servicio_inicio_at on public.ordenes_servicio (servicio_inicio_at);
create index if not exists idx_ordenes_servicio_estatus on public.ordenes_servicio (estatus);
create index if not exists idx_ordenes_servicio_operador_fecha on public.ordenes_servicio (operador_id, fecha_servicio);
create index if not exists idx_ordenes_servicio_whatsapp_1hr on public.ordenes_servicio (servicio_inicio_at)
  where whatsapp_1hr_enviado = false and estatus in ('confirmado', 'pagado');
create index if not exists idx_ordenes_servicio_aeropuerto on public.ordenes_servicio (es_servicio_aeropuerto, numero_vuelo, vuelo_fecha);
create index if not exists idx_control_cobranza_fecha_limite on public.control_cobranza (fecha_limite_pago);
create index if not exists idx_control_cobranza_saldo on public.control_cobranza (saldo_pendiente);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_servicio_inicio_at()
returns trigger
language plpgsql
as $$
begin
  -- Default operating timezone. Change this if the agency operates from another base timezone.
  new.servicio_inicio_at = (new.fecha_servicio::timestamp + new.hora_servicio) at time zone 'America/Mexico_City';
  return new;
end;
$$;

drop trigger if exists trg_ordenes_servicio_inicio_at on public.ordenes_servicio;
create trigger trg_ordenes_servicio_inicio_at
before insert or update of fecha_servicio, hora_servicio on public.ordenes_servicio
for each row execute function public.set_servicio_inicio_at();

drop trigger if exists trg_ordenes_servicio_updated_at on public.ordenes_servicio;
create trigger trg_ordenes_servicio_updated_at
before update on public.ordenes_servicio
for each row execute function public.set_updated_at();

drop trigger if exists trg_control_cobranza_updated_at on public.control_cobranza;
create trigger trg_control_cobranza_updated_at
before update on public.control_cobranza
for each row execute function public.set_updated_at();

create or replace function public.current_usuario_rol()
returns public.usuario_rol
language sql
stable
security definer
set search_path = public
as $$
  select rol from public.usuarios where id = auth.uid() and activo = true;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_usuario_rol() = 'admin';
$$;

create or replace function public.is_cobranza_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_usuario_rol() in ('admin', 'cobranza');
$$;

alter table public.usuarios enable row level security;
alter table public.clientes enable row level security;
alter table public.proveedores_unidades enable row level security;
alter table public.contratos_tarifas enable row level security;
alter table public.experiencias_catalogo enable row level security;
alter table public.ordenes_servicio enable row level security;
alter table public.control_cobranza enable row level security;

drop policy if exists usuarios_select_self_or_admin on public.usuarios;
create policy usuarios_select_self_or_admin on public.usuarios
for select using (id = auth.uid() or public.is_admin());

drop policy if exists usuarios_admin_all on public.usuarios;
create policy usuarios_admin_all on public.usuarios
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists clientes_admin_cobranza_all on public.clientes;
create policy clientes_admin_cobranza_all on public.clientes
for all using (public.is_cobranza_or_admin()) with check (public.is_cobranza_or_admin());

drop policy if exists proveedores_admin_all on public.proveedores_unidades;
create policy proveedores_admin_all on public.proveedores_unidades
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists proveedores_operador_read on public.proveedores_unidades;
create policy proveedores_operador_read on public.proveedores_unidades
for select using (public.current_usuario_rol() = 'operador');

drop policy if exists contratos_admin_all on public.contratos_tarifas;
create policy contratos_admin_all on public.contratos_tarifas
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists experiencias_admin_all on public.experiencias_catalogo;
create policy experiencias_admin_all on public.experiencias_catalogo
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists experiencias_authenticated_read on public.experiencias_catalogo;
create policy experiencias_authenticated_read on public.experiencias_catalogo
for select using (auth.role() = 'authenticated');

drop policy if exists ordenes_admin_cobranza_all on public.ordenes_servicio;
create policy ordenes_admin_cobranza_all on public.ordenes_servicio
for all using (public.is_cobranza_or_admin()) with check (public.is_cobranza_or_admin());

drop policy if exists ordenes_operador_read_assigned on public.ordenes_servicio;
create policy ordenes_operador_read_assigned on public.ordenes_servicio
for select using (
  public.current_usuario_rol() = 'operador'
  and operador_id = auth.uid()
);

drop policy if exists ordenes_operador_update_tracking on public.ordenes_servicio;
create policy ordenes_operador_update_tracking on public.ordenes_servicio
for update using (
  public.current_usuario_rol() = 'operador'
  and operador_id = auth.uid()
) with check (
  public.current_usuario_rol() = 'operador'
  and operador_id = auth.uid()
);

drop policy if exists cobranza_admin_cobranza_all on public.control_cobranza;
create policy cobranza_admin_cobranza_all on public.control_cobranza
for all using (public.is_cobranza_or_admin()) with check (public.is_cobranza_or_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'evidencias-servicio',
  'evidencias-servicio',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists evidencias_operador_upload_assigned on storage.objects;
create policy evidencias_operador_upload_assigned on storage.objects
for insert with check (
  bucket_id = 'evidencias-servicio'
  and auth.role() = 'authenticated'
  and (
    public.is_admin()
    or exists (
      select 1
      from public.ordenes_servicio os
      where os.operador_id = auth.uid()
        and name like os.id::text || '/%'
    )
  )
);

drop policy if exists evidencias_admin_cobranza_read on storage.objects;
create policy evidencias_admin_cobranza_read on storage.objects
for select using (
  bucket_id = 'evidencias-servicio'
  and public.is_cobranza_or_admin()
);

drop policy if exists evidencias_operador_read_own on storage.objects;
create policy evidencias_operador_read_own on storage.objects
for select using (
  bucket_id = 'evidencias-servicio'
  and exists (
    select 1
    from public.ordenes_servicio os
    where os.operador_id = auth.uid()
      and name like os.id::text || '/%'
  )
);

commit;
