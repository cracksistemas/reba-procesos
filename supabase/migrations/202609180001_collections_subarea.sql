-- Adds Cobranzas y Recuperación under Coordinación Académica for existing projects.
insert into public.subareas(area_id, code, name, description, owner_label, flow_steps, source)
select
  a.id,
  'ACA-S04',
  'Cobranzas y Recuperación',
  'Gestión de cartera, promesas, pagos, conciliación y reportes con trazabilidad financiera.',
  'Responsable de Cobranzas',
  array['Priorizar cartera','Gestionar contacto','Validar pago','Conciliar y reportar']::text[],
  'drive'
from public.areas a
where a.code = 'ACA'
on conflict(code) do update set
  name = excluded.name,
  description = excluded.description,
  owner_label = excluded.owner_label,
  flow_steps = excluded.flow_steps,
  source = excluded.source,
  is_active = true;
