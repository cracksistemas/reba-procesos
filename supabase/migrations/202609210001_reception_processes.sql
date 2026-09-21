-- Organizes the official Reception manual for existing REBA Procesos projects.
-- Codes are stable so imported processes and their flowcharts keep their references.
update public.areas
set name = 'Recepción',
    description = 'Atención, inscripción, caja, certificados, canales digitales y continuidad operativa.'
where code = 'REC';

insert into public.subareas(area_id, code, name, description, owner_label, flow_steps, source)
select a.id, v.code, v.name, v.description, v.owner_label, v.flow_steps, 'drive'
from public.areas a
cross join (values
  ('REC-S01', 'Atención, orientación e inscripción', 'Atención institucional, orientación vigente e inscripción en Aula Virtual.', 'Personal de Recepción', array['Revisar atención y pendientes','Orientar con fuentes oficiales','Registrar inscripción','Cerrar o derivar']::text[]),
  ('REC-S02', 'Caja, pagos y certificados', 'Cobros, comprobantes, cuadre y entrega trazable de certificados.', 'Responsable de Caja', array['Validar pago','Emitir comprobante','Registrar cuadre','Entregar certificado']::text[]),
  ('REC-S03', 'Gestión documentaria y courier', 'Documentos externos, derivación interna, envíos y devoluciones de courier.', 'Personal de Recepción', array['Registrar ingreso','Identificar destino','Derivar o coordinar envío','Conservar evidencia']::text[]),
  ('REC-S04', 'Atención digital y experiencia', 'WhatsApp, redes sociales, postventa, sugerencias y reclamos con continuidad.', 'Personal de Recepción', array['Revisar historial','Atender o derivar','Registrar interacción','Dar seguimiento']::text[]),
  ('REC-S05', 'Operación y continuidad', 'Relevo, equipos, stock, atención de fin de semana y cierre de jornada.', 'Personal de Recepción', array['Preparar operación','Verificar activos e insumos','Atender contingencias','Transferir turno']::text[])
) as v(code, name, description, owner_label, flow_steps)
where a.code = 'REC'
on conflict(code) do update set
  name = excluded.name,
  description = excluded.description,
  owner_label = excluded.owner_label,
  flow_steps = excluded.flow_steps,
  source = excluded.source,
  is_active = true;
