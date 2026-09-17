-- Adds the transversal Gerencia subarea introduced by the MOF Asistentes de Gerencia.
-- Safe for projects that already executed the original subareas seed migration.
insert into public.subareas(area_id, code, name, description, owner_label, flow_steps, source)
select
  a.id,
  'GER-S05',
  'Asistentes de Gerencia',
  'Supervisión transversal, seguimiento de acuerdos, control de incidencias y reportes ejecutivos a Gerencia.',
  'Asistente de Gerencia',
  array['Solicitar información','Verificar cumplimiento','Gestionar incidencias','Reportar a Gerencia']::text[],
  'drive'
from public.areas a
where a.code = 'GER'
on conflict(code) do update set
  name = excluded.name,
  description = excluded.description,
  owner_label = excluded.owner_label,
  flow_steps = excluded.flow_steps,
  source = excluded.source,
  is_active = true;
