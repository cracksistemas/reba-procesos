-- REBA PROCESOS · Esquema MVP
-- Ejecutar mediante Supabase CLI o el editor SQL. Todas las tablas operativas usan RLS.

create extension if not exists pgcrypto;

create type public.process_status as enum ('draft','in_review','observed','approved','obsolete');
create type public.process_criticality as enum ('low','medium','high');
create type public.participant_type as enum ('owner','operator','reviewer','approver');
create type public.approval_decision as enum ('pending','approved','observed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z_]+$'),
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table public.areas (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z]{3}$'),
  name text not null unique,
  description text,
  owner_id uuid references public.profiles(id) on delete set null,
  drive_folder_id text,
  color text not null default '#01017B' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column area_id uuid references public.areas(id) on delete set null;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  area_id uuid references public.areas(id) on delete cascade,
  granted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique nulls not distinct (user_id, role_id, area_id)
);

create table public.processes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z]{3}-P[0-9]{2}(-SP[0-9]{2})?$'),
  name text not null,
  objective text not null default '',
  scope text not null default '',
  start_event text,
  end_event text,
  inputs text[] not null default '{}',
  outputs text[] not null default '{}',
  clients text[] not null default '{}',
  suppliers text[] not null default '{}',
  area_id uuid not null references public.areas(id) on delete restrict,
  owner_id uuid not null references public.profiles(id) on delete restrict,
  operator_id uuid references public.profiles(id) on delete set null,
  status public.process_status not null default 'draft',
  criticality public.process_criticality not null default 'medium',
  current_version text not null default '0.1' check (current_version ~ '^[0-9]+\.[0-9]+$'),
  drawio_file_id text,
  approved_pdf_file_id text,
  next_review_at date,
  archived_at timestamptz,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index processes_area_idx on public.processes(area_id);
create index processes_status_idx on public.processes(status);
create index processes_owner_idx on public.processes(owner_id);

create table public.process_versions (
  id uuid primary key default gen_random_uuid(),
  process_id uuid not null references public.processes(id) on delete cascade,
  version text not null check (version ~ '^[0-9]+\.[0-9]+$'),
  change_summary text not null,
  diagram_file_id text,
  pdf_file_id text,
  snapshot jsonb not null default '{}',
  is_approved boolean not null default false,
  approved_at timestamptz,
  approved_by uuid references public.profiles(id) on delete set null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique(process_id, version)
);

create table public.process_participants (
  process_id uuid not null references public.processes(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  participant_type public.participant_type not null,
  created_at timestamptz not null default now(),
  primary key(process_id, profile_id, participant_type)
);

create table public.process_documents (
  id uuid primary key default gen_random_uuid(),
  process_id uuid not null references public.processes(id) on delete cascade,
  code text,
  name text not null,
  document_type text not null default 'related',
  drive_file_id text not null,
  mime_type text,
  version text,
  is_official boolean not null default false,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.process_comments (
  id uuid primary key default gen_random_uuid(),
  process_id uuid not null references public.processes(id) on delete cascade,
  version_id uuid references public.process_versions(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete restrict,
  body text not null check (char_length(body) between 1 and 4000),
  node_id text,
  is_resolved boolean not null default false,
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.process_kpis (
  id uuid primary key default gen_random_uuid(),
  process_id uuid not null references public.processes(id) on delete cascade,
  code text not null,
  name text not null,
  formula text not null,
  unit text not null,
  target numeric,
  frequency text not null,
  source text,
  owner_id uuid references public.profiles(id) on delete set null,
  is_active boolean not null default true,
  unique(process_id, code)
);

create table public.process_approvals (
  id uuid primary key default gen_random_uuid(),
  process_id uuid not null references public.processes(id) on delete cascade,
  version_id uuid not null references public.process_versions(id) on delete cascade,
  step smallint not null check (step between 1 and 3),
  approver_id uuid not null references public.profiles(id) on delete restrict,
  decision public.approval_decision not null default 'pending',
  comment text,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  unique(version_id, step)
);

create table public.activity_log (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  process_id uuid references public.processes(id) on delete cascade,
  event_type text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index activity_log_process_created_idx on public.activity_log(process_id, created_at desc);

create or replace function public.has_role(requested text, requested_area uuid default null)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(
    select 1 from public.user_roles ur join public.roles r on r.id=ur.role_id
    where ur.user_id=auth.uid() and r.code=requested
      and (requested_area is null or ur.area_id is null or ur.area_id=requested_area)
  );
$$;

create or replace function public.can_read_process(target public.processes)
returns boolean language sql stable security definer set search_path=public as $$
  select target.status='approved' or target.owner_id=auth.uid()
    or exists(select 1 from public.process_participants pp where pp.process_id=target.id and pp.profile_id=auth.uid())
    or public.has_role('superadmin') or public.has_role('process_admin')
    or public.has_role('area_owner',target.area_id);
$$;

create or replace function public.can_edit_process(target public.processes)
returns boolean language sql stable security definer set search_path=public as $$
  select target.status in ('draft','observed') and (
    target.owner_id=auth.uid() or public.has_role('superadmin') or public.has_role('process_admin')
    or public.has_role('area_owner',target.area_id) or public.has_role('editor',target.area_id)
  );
$$;

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at=now(); return new; end; $$;

create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger areas_touch before update on public.areas for each row execute function public.touch_updated_at();
create trigger processes_touch before update on public.processes for each row execute function public.touch_updated_at();
create trigger comments_touch before update on public.process_comments for each row execute function public.touch_updated_at();

create or replace function public.protect_approved_version() returns trigger language plpgsql as $$
begin
  if old.is_approved then raise exception 'Las versiones aprobadas son inmutables'; end if;
  return new;
end; $$;
create trigger approved_versions_immutable before update or delete on public.process_versions for each row execute function public.protect_approved_version();

create or replace function public.audit_process_status() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if tg_op='INSERT' then
    insert into public.activity_log(actor_id,process_id,event_type,metadata) values(auth.uid(),new.id,'PROCESS_CREATED',jsonb_build_object('status',new.status));
  elsif old.status is distinct from new.status then
    insert into public.activity_log(actor_id,process_id,event_type,metadata) values(auth.uid(),new.id,'PROCESS_STATUS_CHANGED',jsonb_build_object('from_status',old.status,'to_status',new.status,'version',new.current_version));
  else
    insert into public.activity_log(actor_id,process_id,event_type,metadata) values(auth.uid(),new.id,'PROCESS_UPDATED',jsonb_build_object('version',new.current_version));
  end if;
  return new;
end; $$;
create trigger processes_audit after insert or update on public.processes for each row execute function public.audit_process_status();

alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.user_roles enable row level security;
alter table public.areas enable row level security;
alter table public.processes enable row level security;
alter table public.process_versions enable row level security;
alter table public.process_participants enable row level security;
alter table public.process_documents enable row level security;
alter table public.process_comments enable row level security;
alter table public.process_kpis enable row level security;
alter table public.process_approvals enable row level security;
alter table public.activity_log enable row level security;

create policy profiles_read_authenticated on public.profiles for select to authenticated using (true);
create policy profiles_update_self on public.profiles for update to authenticated using (id=auth.uid()) with check (id=auth.uid());
create policy roles_read_authenticated on public.roles for select to authenticated using (true);
create policy user_roles_read_self_or_admin on public.user_roles for select to authenticated using (user_id=auth.uid() or public.has_role('superadmin') or public.has_role('process_admin'));
create policy user_roles_manage_admin on public.user_roles for all to authenticated using (public.has_role('superadmin') or public.has_role('process_admin')) with check (public.has_role('superadmin') or public.has_role('process_admin'));
create policy areas_read_authenticated on public.areas for select to authenticated using (true);
create policy areas_manage_admin on public.areas for all to authenticated using (public.has_role('superadmin') or public.has_role('process_admin')) with check (public.has_role('superadmin') or public.has_role('process_admin'));
create policy processes_read_allowed on public.processes for select to authenticated using (public.can_read_process(processes));
create policy processes_create_allowed on public.processes for insert to authenticated with check (created_by=auth.uid() and (public.has_role('superadmin') or public.has_role('process_admin') or public.has_role('area_owner',area_id) or public.has_role('editor',area_id)));
create policy processes_update_allowed on public.processes for update to authenticated using (public.can_edit_process(processes) or public.has_role('reviewer',area_id) or public.has_role('approver',area_id)) with check (public.can_read_process(processes));
create policy processes_delete_admin on public.processes for delete to authenticated using (status='draft' and (public.has_role('superadmin') or public.has_role('process_admin')));
create policy versions_read_with_process on public.process_versions for select to authenticated using (exists(select 1 from public.processes p where p.id=process_id and public.can_read_process(p)));
create policy versions_create_editor on public.process_versions for insert to authenticated with check (created_by=auth.uid() and exists(select 1 from public.processes p where p.id=process_id and public.can_edit_process(p)));
create policy participants_read_with_process on public.process_participants for select to authenticated using (exists(select 1 from public.processes p where p.id=process_id and public.can_read_process(p)));
create policy participants_manage_editor on public.process_participants for all to authenticated using (exists(select 1 from public.processes p where p.id=process_id and public.can_edit_process(p))) with check (exists(select 1 from public.processes p where p.id=process_id and public.can_edit_process(p)));
create policy documents_read_with_process on public.process_documents for select to authenticated using (exists(select 1 from public.processes p where p.id=process_id and public.can_read_process(p)));
create policy documents_manage_editor on public.process_documents for all to authenticated using (exists(select 1 from public.processes p where p.id=process_id and public.can_edit_process(p))) with check (created_by=auth.uid() and exists(select 1 from public.processes p where p.id=process_id and public.can_edit_process(p)));
create policy comments_read_with_process on public.process_comments for select to authenticated using (exists(select 1 from public.processes p where p.id=process_id and public.can_read_process(p)));
create policy comments_create_reviewer on public.process_comments for insert to authenticated with check (author_id=auth.uid() and exists(select 1 from public.processes p where p.id=process_id and public.can_read_process(p)));
create policy comments_update_author on public.process_comments for update to authenticated using (author_id=auth.uid() or public.has_role('process_admin')) with check (author_id=auth.uid() or public.has_role('process_admin'));
create policy kpis_read_with_process on public.process_kpis for select to authenticated using (exists(select 1 from public.processes p where p.id=process_id and public.can_read_process(p)));
create policy kpis_manage_editor on public.process_kpis for all to authenticated using (exists(select 1 from public.processes p where p.id=process_id and public.can_edit_process(p))) with check (exists(select 1 from public.processes p where p.id=process_id and public.can_edit_process(p)));
create policy approvals_read_with_process on public.process_approvals for select to authenticated using (exists(select 1 from public.processes p where p.id=process_id and public.can_read_process(p)));
create policy approvals_decide_assignee on public.process_approvals for update to authenticated using (approver_id=auth.uid() or public.has_role('superadmin')) with check (approver_id=auth.uid() or public.has_role('superadmin'));
create policy approvals_create_admin on public.process_approvals for insert to authenticated with check (public.has_role('process_admin') or public.has_role('area_owner'));
create policy activity_read_allowed on public.activity_log for select to authenticated using (process_id is null or exists(select 1 from public.processes p where p.id=process_id and public.can_read_process(p)));

insert into public.roles(code,name,description) values
('superadmin','Superadministrador','Control completo del sistema'),
('process_admin','Administrador de Procesos','Gobierno y configuración'),
('area_owner','Dueño de Área','Gobierno dentro de su área'),
('editor','Editor','Edita fichas y diagramas'),
('reviewer','Revisor','Comenta y observa versiones'),
('approver','Aprobador','Aprueba versiones según criticidad'),
('reader','Lector','Consulta procesos vigentes')
on conflict(code) do nothing;

insert into public.areas(code,name,description,color) values
('COM','Comercial','Captación, seguimiento y conversión de oportunidades','#00A7EB'),
('ACA','Coordinación Académica','Programación, ejecución académica y certificación','#7E57C2'),
('GER','Gerencia','Planeamiento, dirección y gobierno institucional','#01017B'),
('LOG','Logística','Compras, inventario y soporte operativo','#D49A00'),
('MKT','Marketing','Campañas, contenidos y generación de demanda','#E85D75'),
('REC','Recepción','Atención, validación documental y orientación','#2E8B57'),
('SIS','Sistemas','Plataformas, datos, accesos y continuidad tecnológica','#4263EB')
on conflict(code) do update set name=excluded.name,description=excluded.description,color=excluded.color;

grant execute on function public.has_role(text,uuid) to authenticated;
grant execute on function public.can_read_process(public.processes) to authenticated;
grant execute on function public.can_edit_process(public.processes) to authenticated;
