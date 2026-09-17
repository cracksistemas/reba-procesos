-- REBA PROCESOS · Persistencia de procesos, tareas y diagramas editables
-- Ejecutar DESPUÉS de 202609100001_initial_schema.sql y 202609110001_subareas.sql.
-- Es segura de volver a ejecutar: no elimina ni modifica los datos existentes.

begin;

-- Crea el perfil de cada persona que ingresa mediante Supabase Auth.
-- Sin este trigger las referencias a public.profiles bloquean los guardados.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.email, '')
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = case when public.profiles.full_name = '' then excluded.full_name else public.profiles.full_name end;
  return new;
end;
$$;

drop trigger if exists auth_user_profile_created on auth.users;
create trigger auth_user_profile_created
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();

-- También crea perfiles para usuarios que ya existían antes de esta migración.
insert into public.profiles (id, full_name, email)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', ''),
  coalesce(u.email, '')
from auth.users u
on conflict (id) do update
  set email = excluded.email;

-- Ítems creados desde el portal. Es separado de public.processes para no
-- imponer el formato histórico de código ni requerir que se cargue una ficha
-- institucional completa antes de añadir una tarea o proceso operativo.
create table if not exists public.workspace_items (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z]{3}-S[0-9]{2}-(P|T)[0-9]{2,}$'),
  item_type text not null check (item_type in ('process','task')),
  area_id uuid not null references public.areas(id) on delete restrict,
  subarea_id uuid not null references public.subareas(id) on delete restrict,
  name text not null check (char_length(trim(name)) between 2 and 240),
  owner_label text not null default '',
  objective text not null default '',
  scope text not null default '',
  tasks jsonb not null default '[]'::jsonb check (jsonb_typeof(tasks) = 'array'),
  status public.process_status not null default 'draft',
  criticality public.process_criticality not null default 'medium',
  version text not null default '0.1' check (version ~ '^[0-9]+\.[0-9]+$'),
  source text not null default 'user' check (source in ('user','import','system')),
  created_by uuid not null references public.profiles(id) on delete restrict,
  updated_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subarea_id, name)
);

create index if not exists workspace_items_subarea_idx on public.workspace_items(subarea_id, updated_at desc);
create index if not exists workspace_items_created_by_idx on public.workspace_items(created_by, updated_at desc);
drop trigger if exists workspace_items_touch on public.workspace_items;
create trigger workspace_items_touch before update on public.workspace_items
  for each row execute function public.touch_updated_at();

-- Un documento editable por código de flujo. snapshot conserva nodos,
-- conexiones, estilos y viewport exactamente como el editor los entrega.
create table if not exists public.flowchart_documents (
  id uuid primary key default gen_random_uuid(),
  flow_code text not null unique check (flow_code ~ '^[A-Z]{3}-.+'),
  workspace_item_id uuid references public.workspace_items(id) on delete cascade,
  area_id uuid not null references public.areas(id) on delete restrict,
  subarea_id uuid not null references public.subareas(id) on delete restrict,
  title text not null default '',
  description text not null default '',
  snapshot jsonb not null default '{"version":2,"nodes":[],"edges":[]}'::jsonb,
  version text not null default '0.1' check (version ~ '^[0-9]+\.[0-9]+$'),
  created_by uuid not null references public.profiles(id) on delete restrict,
  updated_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(snapshot) = 'object')
);

create index if not exists flowchart_documents_subarea_idx on public.flowchart_documents(subarea_id, updated_at desc);
drop trigger if exists flowchart_documents_touch on public.flowchart_documents;
create trigger flowchart_documents_touch before update on public.flowchart_documents
  for each row execute function public.touch_updated_at();

-- Historial inmutable de cada guardado de diagrama, útil para auditoría y
-- restauración posterior sin sobreescribir el documento actual.
create table if not exists public.flowchart_revisions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.flowchart_documents(id) on delete cascade,
  revision_no integer not null check (revision_no > 0),
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object'),
  change_summary text not null default 'Actualización del diagrama',
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique(document_id, revision_no)
);

create index if not exists flowchart_revisions_document_idx on public.flowchart_revisions(document_id, revision_no desc);

-- Roles existentes que pueden modificar contenido compartido del área.
create or replace function public.can_edit_workspace_area(target_area_id uuid, owner uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select owner = auth.uid()
    or public.has_role('superadmin')
    or public.has_role('process_admin')
    or public.has_role('area_owner', target_area_id)
    or public.has_role('editor', target_area_id);
$$;

alter table public.workspace_items enable row level security;
alter table public.flowchart_documents enable row level security;
alter table public.flowchart_revisions enable row level security;

drop policy if exists workspace_items_read_authenticated on public.workspace_items;
create policy workspace_items_read_authenticated on public.workspace_items
  for select to authenticated using (true);

drop policy if exists workspace_items_create_own on public.workspace_items;
create policy workspace_items_create_own on public.workspace_items
  for insert to authenticated
  with check (created_by = auth.uid() and updated_by = auth.uid());

drop policy if exists workspace_items_update_authorized on public.workspace_items;
create policy workspace_items_update_authorized on public.workspace_items
  for update to authenticated
  using (public.can_edit_workspace_area(area_id, created_by))
  with check (public.can_edit_workspace_area(area_id, created_by) and updated_by = auth.uid());

drop policy if exists workspace_items_delete_authorized on public.workspace_items;
create policy workspace_items_delete_authorized on public.workspace_items
  for delete to authenticated using (public.can_edit_workspace_area(area_id, created_by));

drop policy if exists flowchart_documents_read_authenticated on public.flowchart_documents;
create policy flowchart_documents_read_authenticated on public.flowchart_documents
  for select to authenticated using (true);

drop policy if exists flowchart_documents_create_own on public.flowchart_documents;
create policy flowchart_documents_create_own on public.flowchart_documents
  for insert to authenticated
  with check (created_by = auth.uid() and updated_by = auth.uid());

drop policy if exists flowchart_documents_update_authorized on public.flowchart_documents;
create policy flowchart_documents_update_authorized on public.flowchart_documents
  for update to authenticated
  using (public.can_edit_workspace_area(area_id, created_by))
  with check (public.can_edit_workspace_area(area_id, created_by) and updated_by = auth.uid());

drop policy if exists flowchart_documents_delete_authorized on public.flowchart_documents;
create policy flowchart_documents_delete_authorized on public.flowchart_documents
  for delete to authenticated using (public.can_edit_workspace_area(area_id, created_by));

drop policy if exists flowchart_revisions_read_authenticated on public.flowchart_revisions;
create policy flowchart_revisions_read_authenticated on public.flowchart_revisions
  for select to authenticated
  using (exists (select 1 from public.flowchart_documents d where d.id = document_id));

drop policy if exists flowchart_revisions_create_authorized on public.flowchart_revisions;
create policy flowchart_revisions_create_authorized on public.flowchart_revisions
  for insert to authenticated
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.flowchart_documents d
      where d.id = document_id and public.can_edit_workspace_area(d.area_id, d.created_by)
    )
  );

-- Función para guardar un proceso/tarea a partir de códigos de área y subárea.
-- Evita exponer UUID internos en el navegador y valida que la subárea pertenezca
-- al área enviada.
create or replace function public.save_workspace_item(p_item jsonb)
returns public.workspace_items
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_area public.areas;
  v_subarea public.subareas;
  v_item public.workspace_items;
  v_code text := upper(trim(coalesce(p_item ->> 'code', '')));
begin
  if auth.uid() is null then raise exception 'Debes iniciar sesión para guardar.' using errcode = '28000'; end if;
  select * into v_area from public.areas where code = upper(trim(p_item ->> 'area_code')) and is_active;
  select * into v_subarea from public.subareas where code = upper(trim(p_item ->> 'subarea_code')) and is_active;
  if v_area.id is null or v_subarea.id is null or v_subarea.area_id <> v_area.id then raise exception 'Área o subárea inválida.' using errcode = '22023'; end if;
  if v_code !~ '^[A-Z]{3}-S[0-9]{2}-(P|T)[0-9]{2,}$' then raise exception 'Código inválido: %', v_code using errcode = '22023'; end if;

  insert into public.workspace_items as wi (
    code, item_type, area_id, subarea_id, name, owner_label, objective, scope,
    tasks, status, criticality, version, source, created_by, updated_by
  ) values (
    v_code,
    case lower(coalesce(p_item ->> 'item_type', 'process')) when 'task' then 'task' else 'process' end,
    v_area.id, v_subarea.id,
    trim(coalesce(p_item ->> 'name', '')),
    trim(coalesce(p_item ->> 'owner_label', '')),
    coalesce(p_item ->> 'objective', ''), coalesce(p_item ->> 'scope', ''),
    coalesce(p_item -> 'tasks', '[]'::jsonb),
    coalesce((p_item ->> 'status')::public.process_status, 'draft'::public.process_status),
    coalesce((p_item ->> 'criticality')::public.process_criticality, 'medium'::public.process_criticality),
    coalesce(p_item ->> 'version', '0.1'), 'user', auth.uid(), auth.uid()
  )
  on conflict (code) do update set
    item_type = excluded.item_type, area_id = excluded.area_id, subarea_id = excluded.subarea_id,
    name = excluded.name, owner_label = excluded.owner_label, objective = excluded.objective,
    scope = excluded.scope, tasks = excluded.tasks, status = excluded.status,
    criticality = excluded.criticality, version = excluded.version, updated_by = auth.uid()
  returning * into v_item;
  return v_item;
end;
$$;

-- Guarda el lienzo completo y genera un historial nuevo sólo cuando cambió.
create or replace function public.save_flowchart_document(
  p_flow_code text,
  p_area_code text,
  p_subarea_code text,
  p_title text,
  p_description text,
  p_snapshot jsonb,
  p_change_summary text default 'Actualización del diagrama'
)
returns public.flowchart_documents
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_area public.areas;
  v_subarea public.subareas;
  v_document public.flowchart_documents;
  v_workspace_item_id uuid;
  v_revision integer;
begin
  if auth.uid() is null then raise exception 'Debes iniciar sesión para guardar.' using errcode = '28000'; end if;
  if jsonb_typeof(p_snapshot) <> 'object' then raise exception 'El diagrama debe ser un objeto JSON.' using errcode = '22023'; end if;
  select * into v_area from public.areas where code = upper(trim(p_area_code)) and is_active;
  select * into v_subarea from public.subareas where code = upper(trim(p_subarea_code)) and is_active;
  if v_area.id is null or v_subarea.id is null or v_subarea.area_id <> v_area.id then raise exception 'Área o subárea inválida.' using errcode = '22023'; end if;
  select id into v_workspace_item_id from public.workspace_items where code = upper(trim(p_flow_code));

  insert into public.flowchart_documents as fd (
    flow_code, workspace_item_id, area_id, subarea_id, title, description,
    snapshot, created_by, updated_by
  ) values (
    upper(trim(p_flow_code)), v_workspace_item_id, v_area.id, v_subarea.id,
    trim(coalesce(p_title, '')), coalesce(p_description, ''), p_snapshot, auth.uid(), auth.uid()
  )
  on conflict (flow_code) do update set
    workspace_item_id = excluded.workspace_item_id, area_id = excluded.area_id,
    subarea_id = excluded.subarea_id, title = excluded.title,
    description = excluded.description, snapshot = excluded.snapshot, updated_by = auth.uid()
  returning * into v_document;

  select coalesce(max(revision_no), 0) + 1 into v_revision
  from public.flowchart_revisions where document_id = v_document.id;
  insert into public.flowchart_revisions(document_id, revision_no, snapshot, change_summary, created_by)
  values (v_document.id, v_revision, p_snapshot, coalesce(nullif(trim(p_change_summary), ''), 'Actualización del diagrama'), auth.uid());

  return v_document;
end;
$$;

-- Lecturas normalizadas para el cliente web, sin exponer UUID internos.
create or replace function public.get_workspace_items()
returns table (
  code text, item_type text, area_code text, area_name text,
  subarea_code text, subarea_name text, name text, owner_label text,
  objective text, scope text, tasks jsonb, status public.process_status,
  criticality public.process_criticality, version text, updated_at timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  select wi.code, wi.item_type, a.code, a.name, s.code, s.name, wi.name,
         wi.owner_label, wi.objective, wi.scope, wi.tasks, wi.status,
         wi.criticality, wi.version, wi.updated_at
  from public.workspace_items wi
  join public.areas a on a.id = wi.area_id
  join public.subareas s on s.id = wi.subarea_id
  order by wi.updated_at desc;
$$;

create or replace function public.get_flowchart_document(p_flow_code text)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select snapshot from public.flowchart_documents
  where flow_code = upper(trim(p_flow_code))
  limit 1;
$$;

grant execute on function public.can_edit_workspace_area(uuid, uuid) to authenticated;
grant execute on function public.save_workspace_item(jsonb) to authenticated;
grant execute on function public.save_flowchart_document(text, text, text, text, text, jsonb, text) to authenticated;
grant execute on function public.get_workspace_items() to authenticated;
grant execute on function public.get_flowchart_document(text) to authenticated;

commit;
