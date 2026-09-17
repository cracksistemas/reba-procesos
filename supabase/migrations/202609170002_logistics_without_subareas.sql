-- REBA PROCESOS · Logística sin subáreas
-- Ejecutar después de 202609170001_workspace_persistence.sql.
-- Sustituye únicamente el modelo anterior de Logística por procesos directos del área.

begin;

-- Retira los borradores, diagramas y procesos del modelo anterior LOG-S01..S03.
delete from public.flowchart_documents
where area_id = (select id from public.areas where code = 'LOG');

delete from public.workspace_items
where area_id = (select id from public.areas where code = 'LOG');

delete from public.processes
where area_id = (select id from public.areas where code = 'LOG');

delete from public.subareas
where area_id = (select id from public.areas where code = 'LOG');

-- Los ítems y lienzos de un área sin subáreas no requieren subarea_id.
alter table public.workspace_items alter column subarea_id drop not null;
alter table public.flowchart_documents alter column subarea_id drop not null;

alter table public.workspace_items drop constraint if exists workspace_items_code_check;
alter table public.workspace_items add constraint workspace_items_code_check
  check (code ~ '^[A-Z]{3}-(S[0-9]{2}-)?(P|T)[0-9]{2,}$');

-- Sobrescribe las funciones de guardado: p_subarea_code igual al área significa
-- que el proceso pertenece directamente al área (por ejemplo, LOG-P01).
create or replace function public.save_workspace_item(p_item jsonb)
returns public.workspace_items language plpgsql security invoker set search_path = public as $$
declare
  v_area public.areas; v_subarea public.subareas; v_item public.workspace_items;
  v_code text := upper(trim(coalesce(p_item ->> 'code', '')));
  v_subarea_code text := upper(trim(coalesce(p_item ->> 'subarea_code', '')));
begin
  if auth.uid() is null then raise exception 'Debes iniciar sesión para guardar.' using errcode = '28000'; end if;
  select * into v_area from public.areas where code = upper(trim(p_item ->> 'area_code')) and is_active;
  if v_area.id is null then raise exception 'Área inválida.' using errcode = '22023'; end if;
  if v_subarea_code <> '' and v_subarea_code <> v_area.code then
    select * into v_subarea from public.subareas where code = v_subarea_code and is_active;
    if v_subarea.id is null or v_subarea.area_id <> v_area.id then raise exception 'Subárea inválida.' using errcode = '22023'; end if;
  end if;
  if v_code !~ '^[A-Z]{3}-(S[0-9]{2}-)?(P|T)[0-9]{2,}$' then raise exception 'Código inválido: %', v_code using errcode = '22023'; end if;
  insert into public.workspace_items as wi (code,item_type,area_id,subarea_id,name,owner_label,objective,scope,tasks,status,criticality,version,source,created_by,updated_by)
  values (v_code,case lower(coalesce(p_item ->> 'item_type','process')) when 'task' then 'task' else 'process' end,v_area.id,v_subarea.id,trim(coalesce(p_item ->> 'name','')),trim(coalesce(p_item ->> 'owner_label','')),coalesce(p_item ->> 'objective',''),coalesce(p_item ->> 'scope',''),coalesce(p_item -> 'tasks','[]'::jsonb),coalesce((p_item ->> 'status')::public.process_status,'draft'::public.process_status),coalesce((p_item ->> 'criticality')::public.process_criticality,'medium'::public.process_criticality),coalesce(p_item ->> 'version','0.1'),'user',auth.uid(),auth.uid())
  on conflict (code) do update set item_type=excluded.item_type,area_id=excluded.area_id,subarea_id=excluded.subarea_id,name=excluded.name,owner_label=excluded.owner_label,objective=excluded.objective,scope=excluded.scope,tasks=excluded.tasks,status=excluded.status,criticality=excluded.criticality,version=excluded.version,updated_by=auth.uid()
  returning * into v_item;
  return v_item;
end;
$$;

create or replace function public.save_flowchart_document(p_flow_code text,p_area_code text,p_subarea_code text,p_title text,p_description text,p_snapshot jsonb,p_change_summary text default 'Actualización del diagrama')
returns public.flowchart_documents language plpgsql security invoker set search_path = public as $$
declare
  v_area public.areas; v_subarea public.subareas; v_document public.flowchart_documents;
  v_workspace_item_id uuid; v_revision integer; v_subarea_code text := upper(trim(coalesce(p_subarea_code,'')));
begin
  if auth.uid() is null then raise exception 'Debes iniciar sesión para guardar.' using errcode = '28000'; end if;
  if jsonb_typeof(p_snapshot) <> 'object' then raise exception 'El diagrama debe ser un objeto JSON.' using errcode = '22023'; end if;
  select * into v_area from public.areas where code = upper(trim(p_area_code)) and is_active;
  if v_area.id is null then raise exception 'Área inválida.' using errcode = '22023'; end if;
  if v_subarea_code <> '' and v_subarea_code <> v_area.code then
    select * into v_subarea from public.subareas where code = v_subarea_code and is_active;
    if v_subarea.id is null or v_subarea.area_id <> v_area.id then raise exception 'Subárea inválida.' using errcode = '22023'; end if;
  end if;
  select id into v_workspace_item_id from public.workspace_items where code = upper(trim(p_flow_code));
  insert into public.flowchart_documents as fd (flow_code,workspace_item_id,area_id,subarea_id,title,description,snapshot,created_by,updated_by)
  values (upper(trim(p_flow_code)),v_workspace_item_id,v_area.id,v_subarea.id,trim(coalesce(p_title,'')),coalesce(p_description,''),p_snapshot,auth.uid(),auth.uid())
  on conflict (flow_code) do update set workspace_item_id=excluded.workspace_item_id,area_id=excluded.area_id,subarea_id=excluded.subarea_id,title=excluded.title,description=excluded.description,snapshot=excluded.snapshot,updated_by=auth.uid()
  returning * into v_document;
  select coalesce(max(revision_no),0)+1 into v_revision from public.flowchart_revisions where document_id=v_document.id;
  insert into public.flowchart_revisions(document_id,revision_no,snapshot,change_summary,created_by) values(v_document.id,v_revision,p_snapshot,coalesce(nullif(trim(p_change_summary),''),'Actualización del diagrama'),auth.uid());
  return v_document;
end;
$$;

create or replace function public.get_workspace_items()
returns table (code text,item_type text,area_code text,area_name text,subarea_code text,subarea_name text,name text,owner_label text,objective text,scope text,tasks jsonb,status public.process_status,criticality public.process_criticality,version text,updated_at timestamptz)
language sql stable security invoker set search_path = public as $$
  select wi.code,wi.item_type,a.code,a.name,coalesce(s.code,a.code),coalesce(s.name,a.name),wi.name,wi.owner_label,wi.objective,wi.scope,wi.tasks,wi.status,wi.criticality,wi.version,wi.updated_at
  from public.workspace_items wi join public.areas a on a.id=wi.area_id left join public.subareas s on s.id=wi.subarea_id order by wi.updated_at desc;
$$;

commit;
