begin;

create table if not exists public.subareas (
  id uuid primary key default gen_random_uuid(),
  area_id uuid not null references public.areas(id) on delete cascade,
  code text not null unique check (code ~ '^[A-Z]{3}-S[0-9]{2}$'),
  name text not null,
  description text not null default '',
  owner_id uuid references public.profiles(id) on delete set null,
  owner_label text not null default '',
  flow_steps text[] not null default '{}',
  drive_folder_id text,
  source text not null default 'system' check (source in ('drive','proposal','user','system')),
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(area_id, name)
);

create index if not exists subareas_area_idx on public.subareas(area_id);
create trigger subareas_touch before update on public.subareas for each row execute function public.touch_updated_at();

alter table public.processes add column if not exists subarea_id uuid references public.subareas(id) on delete restrict;
create index if not exists processes_subarea_idx on public.processes(subarea_id);

alter table public.subareas enable row level security;

create policy subareas_read_authenticated on public.subareas
  for select to authenticated using (true);

create policy subareas_manage_authorized on public.subareas
  for all to authenticated
  using (
    public.has_role('superadmin')
    or public.has_role('process_admin')
    or public.has_role('area_owner', area_id)
  )
  with check (
    public.has_role('superadmin')
    or public.has_role('process_admin')
    or public.has_role('area_owner', area_id)
  );

insert into public.subareas(area_id, code, name, description, owner_label, flow_steps, source)
select a.id, seed.code, seed.name, seed.description, seed.owner_label, seed.flow_steps, seed.source
from public.areas a
join (values
  ('COM','COM-S01','Prospección y leads','Ingreso, calificación y asignación de oportunidades.','Coordinación Comercial',array['Captar oportunidad','Validar datos','Calificar lead','Asignar asesor']::text[],'proposal'),
  ('COM','COM-S02','Ventas y seguimiento','Gestión de contactos, propuestas y compromisos comerciales.','Jefatura Comercial',array['Contactar prospecto','Identificar necesidad','Presentar propuesta','Registrar seguimiento']::text[],'proposal'),
  ('COM','COM-S03','Cierre, matrícula y convenios','Formalización de ventas y transferencia del expediente.','Coordinación de Matrículas',array['Confirmar decisión','Validar condiciones','Registrar matrícula','Transferir expediente']::text[],'proposal'),
  ('ACA','ACA-S01','Programación académica','Planificación de programas, docentes, aulas y cronogramas.','Coordinación Académica',array['Recibir programación','Asignar docente','Validar recursos','Publicar cronograma']::text[],'proposal'),
  ('ACA','ACA-S02','Operaciones académicas','Ejecución, asistencia y seguimiento de las actividades académicas.','Responsable Académico',array['Aperturar sesión','Registrar asistencia','Atender incidencias','Cerrar sesión']::text[],'proposal'),
  ('ACA','ACA-S03','Certificación y calidad','Verificación de requisitos, emisión y entrega de certificados.','Coordinación de Certificación',array['Validar requisitos','Revisar expediente','Emitir certificado','Registrar entrega']::text[],'proposal'),
  ('GER','GER-S01','Administración','Coordinación administrativa, contratos y soporte a la gestión.','Administración',array['Recibir solicitud','Clasificar requerimiento','Gestionar aprobación','Cerrar atención']::text[],'drive'),
  ('GER','GER-S02','Administración y Recursos Humanos','Gestión de personas, contratación, asistencia y desarrollo.','Responsable de Recursos Humanos',array['Identificar necesidad','Seleccionar o atender','Formalizar gestión','Archivar evidencia']::text[],'drive'),
  ('GER','GER-S03','Contabilidad, Finanzas y Tesorería','Registro contable, control financiero, pagos y disponibilidad de caja.','Responsable de Finanzas',array['Recibir sustento','Validar operación','Registrar y aprobar','Pagar o conciliar']::text[],'drive'),
  ('GER','GER-S04','Seguridad y Salud en el Trabajo','Prevención, control y seguimiento de riesgos laborales.','Responsable de SST',array['Identificar peligro','Evaluar riesgo','Aplicar control','Verificar cumplimiento']::text[],'drive'),
  ('LOG','LOG-S01','Compras y abastecimiento','Adquisición de bienes y servicios para la operación.','Jefatura de Logística',array['Recibir solicitud','Cotizar','Aprobar compra','Recibir y dar conformidad']::text[],'proposal'),
  ('LOG','LOG-S02','Inventario y activos','Registro, asignación y control de bienes institucionales.','Responsable de Almacén',array['Registrar ingreso','Codificar activo','Asignar responsable','Controlar inventario']::text[],'proposal'),
  ('LOG','LOG-S03','Servicios generales','Mantenimiento, infraestructura y servicios de apoyo.','Coordinación Administrativa',array['Reportar necesidad','Programar atención','Ejecutar servicio','Validar conformidad']::text[],'proposal'),
  ('MKT','MKT-S01','Community Manager','Planificación, publicación y monitoreo de redes sociales.','Community Manager',array['Planificar calendario','Preparar contenido','Aprobar publicación','Publicar y monitorear']::text[],'drive'),
  ('MKT','MKT-S02','Community','Atención de comunidad, mensajes y derivación de oportunidades.','Responsable de Comunidad',array['Recibir interacción','Clasificar consulta','Responder o derivar','Registrar resultado']::text[],'drive'),
  ('MKT','MKT-S03','Diseño y audiovisual','Producción de piezas gráficas, video y recursos de campaña.','Responsable de Diseño',array['Recibir brief','Diseñar propuesta','Revisar pieza','Entregar arte final']::text[],'drive'),
  ('MKT','MKT-S04','Tráfico y pauta digital','Configuración, optimización y medición de campañas pagadas.','Trafficker Digital',array['Recibir campaña','Configurar pauta','Monitorear rendimiento','Optimizar y reportar']::text[],'drive'),
  ('REC','REC-S01','Atención y orientación','Recepción de consultas y orientación a alumnos y visitantes.','Coordinación de Recepción',array['Recibir consulta','Identificar necesidad','Orientar o derivar','Confirmar atención']::text[],'proposal'),
  ('REC','REC-S02','Caja y validación de pagos','Comprobación de pagos y habilitación de servicios.','Responsable de Caja',array['Recibir comprobante','Validar pago','Registrar operación','Confirmar habilitación']::text[],'proposal'),
  ('REC','REC-S03','Gestión documentaria','Recepción, derivación y archivo de documentos.','Responsable de Recepción',array['Recibir documento','Registrar ingreso','Derivar responsable','Archivar evidencia']::text[],'proposal'),
  ('SIS','SIS-S01','Infraestructura y soporte','Atención de incidencias y continuidad de los servicios tecnológicos.','Mesa de Ayuda',array['Registrar incidencia','Clasificar prioridad','Resolver o escalar','Validar cierre']::text[],'proposal'),
  ('SIS','SIS-S02','Sistemas y automatización','Desarrollo, integración y mejora de soluciones internas.','Jefatura de Sistemas',array['Recibir requerimiento','Analizar solución','Implementar cambio','Validar entrega']::text[],'proposal'),
  ('SIS','SIS-S03','Datos, seguridad y accesos','Gobierno de datos, altas, bajas y control de permisos.','Responsable de Seguridad',array['Recibir solicitud','Validar autorización','Aplicar acceso','Auditar resultado']::text[],'proposal')
) as seed(area_code, code, name, description, owner_label, flow_steps, source)
  on seed.area_code = a.code
on conflict(code) do update set
  name = excluded.name,
  description = excluded.description,
  owner_label = excluded.owner_label,
  flow_steps = excluded.flow_steps,
  source = excluded.source;

update public.processes p set subarea_id = s.id
from public.subareas s
where s.code = case p.code
  when 'COM-P01' then 'COM-S01' when 'COM-P02' then 'COM-S02' when 'COM-P03' then 'COM-S03' when 'COM-P04' then 'COM-S01'
  when 'ACA-P01' then 'ACA-S01' when 'ACA-P02' then 'ACA-S03' when 'ACA-P03' then 'ACA-S02'
  when 'GER-P01' then 'GER-S03' when 'LOG-P01' then 'LOG-S01'
  when 'MKT-P01' then 'MKT-S04' when 'MKT-P02' then 'MKT-S01' when 'MKT-P03' then 'MKT-S04'
  when 'REC-P01' then 'REC-S02' when 'SIS-P01' then 'SIS-S03' when 'SIS-P02' then 'SIS-S01'
end;

commit;
