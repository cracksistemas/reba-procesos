export type ProcessStatus = "Borrador" | "En revisión" | "Observado" | "Aprobado" | "Obsoleto";

export type Area = {
  code: string; name: string; description: string; owner: string;
  processCount: number; approved: number; color: string;
};

export type Process = {
  code: string; name: string; area: string; owner: string; status: ProcessStatus;
  version: string; updated: string; criticality: "Baja" | "Media" | "Alta";
  objective: string; scope: string; nextReview: string; completion: number;
};

export const driveRoot = "https://drive.google.com/drive/folders/1YoIFfdcoQn107r0juIKyQk6fhaQWkT1H";

export const areas: Area[] = [
  { code: "COM", name: "Comercial", description: "Captación, seguimiento y conversión de oportunidades.", owner: "Jefatura Comercial", processCount: 4, approved: 2, color: "#00A7EB" },
  { code: "ACA", name: "Coordinación Académica", description: "Programación, ejecución académica y certificación.", owner: "Coordinación Académica", processCount: 4, approved: 3, color: "#7E57C2" },
  { code: "GER", name: "Gerencia", description: "Planeamiento, dirección y gobierno institucional.", owner: "Gerencia General", processCount: 2, approved: 2, color: "#01017B" },
  { code: "LOG", name: "Logística", description: "Compras, inventario y soporte operativo.", owner: "Jefatura de Logística", processCount: 2, approved: 1, color: "#D49A00" },
  { code: "MKT", name: "Marketing", description: "Campañas, contenidos y generación de demanda.", owner: "Jefatura de Marketing", processCount: 3, approved: 1, color: "#E85D75" },
  { code: "REC", name: "Recepción", description: "Atención, validación documental y orientación.", owner: "Coordinación de Recepción", processCount: 2, approved: 1, color: "#2E8B57" },
  { code: "SIS", name: "Sistemas", description: "Plataformas, datos, accesos y continuidad tecnológica.", owner: "Jefatura de Sistemas", processCount: 3, approved: 2, color: "#4263EB" },
];

export const processes: Process[] = [
  { code: "COM-P01", name: "Gestión de leads", area: "Comercial", owner: "Ana Salazar", status: "Aprobado", version: "1.2", updated: "Hoy, 09:42", criticality: "Alta", objective: "Convertir oportunidades calificadas en matrículas mediante un seguimiento oportuno y trazable.", scope: "Desde la asignación del lead hasta su conversión o descarte documentado.", nextReview: "15 mar 2027", completion: 100 },
  { code: "COM-P02", name: "Seguimiento comercial", area: "Comercial", owner: "Luis Vega", status: "Borrador", version: "0.4", updated: "Hoy, 08:15", criticality: "Media", objective: "Estandarizar los contactos y compromisos con prospectos.", scope: "Incluye llamadas, mensajería, reuniones y registro de resultados.", nextReview: "Sin programar", completion: 62 },
  { code: "COM-P03", name: "Cierre y matrícula", area: "Comercial", owner: "Ana Salazar", status: "En revisión", version: "1.0", updated: "Ayer, 16:30", criticality: "Alta", objective: "Asegurar un cierre correcto y la transferencia del alumno a Académica.", scope: "Desde la decisión de compra hasta la entrega del expediente.", nextReview: "10 sep 2027", completion: 88 },
  { code: "COM-P04", name: "Reactivación de prospectos", area: "Comercial", owner: "Luis Vega", status: "Observado", version: "0.8", updated: "08 sep, 11:20", criticality: "Baja", objective: "Recuperar oportunidades inactivas con criterios homogéneos.", scope: "Prospectos sin actividad durante 30 días.", nextReview: "Sin programar", completion: 74 },
  { code: "ACA-P01", name: "Programación académica", area: "Coordinación Académica", owner: "María Torres", status: "Aprobado", version: "2.1", updated: "09 sep, 14:10", criticality: "Alta", objective: "Planificar sesiones, docentes y recursos académicos.", scope: "Desde la apertura del programa hasta la publicación del cronograma.", nextReview: "01 mar 2027", completion: 100 },
  { code: "ACA-P02", name: "Gestión de certificación", area: "Coordinación Académica", owner: "María Torres", status: "En revisión", version: "1.5", updated: "08 sep, 18:05", criticality: "Alta", objective: "Emitir certificados válidos, completos y trazables.", scope: "Desde la verificación de requisitos hasta la entrega al alumno.", nextReview: "10 sep 2027", completion: 91 },
  { code: "ACA-P03", name: "Control de asistencia", area: "Coordinación Académica", owner: "Carlos Ríos", status: "Aprobado", version: "1.0", updated: "05 sep, 10:00", criticality: "Media", objective: "Registrar y validar la asistencia de alumnos y docentes.", scope: "Todas las sesiones sincrónicas y presenciales.", nextReview: "05 sep 2027", completion: 100 },
  { code: "MKT-P01", name: "Planificación de campañas", area: "Marketing", owner: "Valeria Cruz", status: "Aprobado", version: "1.3", updated: "09 sep, 09:12", criticality: "Media", objective: "Diseñar campañas alineadas a metas comerciales y académicas.", scope: "Desde el brief hasta la autorización de pauta.", nextReview: "09 sep 2027", completion: 100 },
  { code: "MKT-P02", name: "Community Manager", area: "Marketing", owner: "Diego León", status: "En revisión", version: "1.5", updated: "Hace 2 h", criticality: "Media", objective: "Planificar, publicar y monitorear la comunicación en redes sociales.", scope: "Calendario, contenidos, aprobación, publicación y reporte mensual.", nextReview: "10 sep 2027", completion: 93 },
  { code: "MKT-P03", name: "Gestión de pauta digital", area: "Marketing", owner: "Valeria Cruz", status: "Observado", version: "0.9", updated: "07 sep, 12:44", criticality: "Alta", objective: "Administrar inversión digital con controles y medición de resultados.", scope: "Configuración, seguimiento, optimización y cierre de campañas.", nextReview: "Sin programar", completion: 81 },
  { code: "REC-P01", name: "Validación de pagos", area: "Recepción", owner: "Rosa Campos", status: "Aprobado", version: "1.1", updated: "03 sep, 15:20", criticality: "Alta", objective: "Confirmar pagos antes de habilitar servicios al alumno.", scope: "Desde la recepción del comprobante hasta la confirmación en el sistema.", nextReview: "03 mar 2027", completion: 100 },
  { code: "SIS-P01", name: "Alta y baja de accesos", area: "Sistemas", owner: "Jorge Paz", status: "Aprobado", version: "2.0", updated: "02 sep, 17:10", criticality: "Alta", objective: "Gestionar accesos de forma segura y oportuna.", scope: "Personal, docentes, proveedores y usuarios temporales.", nextReview: "02 mar 2027", completion: 100 },
  { code: "SIS-P02", name: "Gestión de incidencias", area: "Sistemas", owner: "Jorge Paz", status: "En revisión", version: "1.1", updated: "01 sep, 09:35", criticality: "Media", objective: "Restaurar servicios según prioridad e impacto.", scope: "Registro, clasificación, atención, escalamiento y cierre.", nextReview: "10 sep 2027", completion: 89 },
  { code: "LOG-P01", name: "Compras y abastecimiento", area: "Logística", owner: "Paola Díaz", status: "Borrador", version: "0.6", updated: "30 ago, 14:00", criticality: "Media", objective: "Abastecer bienes y servicios con aprobación y evidencia.", scope: "Desde la solicitud hasta la conformidad de recepción.", nextReview: "Sin programar", completion: 57 },
  { code: "GER-P01", name: "Aprobación de presupuesto", area: "Gerencia", owner: "Gerencia General", status: "Aprobado", version: "1.0", updated: "25 ago, 11:15", criticality: "Alta", objective: "Asegurar decisiones presupuestales consistentes y documentadas.", scope: "Solicitudes extraordinarias y presupuesto anual.", nextReview: "25 feb 2027", completion: 100 },
];

export const reviews = processes.filter((process) => ["En revisión", "Observado"].includes(process.status));
export const statusTone: Record<ProcessStatus, string> = { "Borrador": "draft", "En revisión": "review", "Observado": "observed", "Aprobado": "approved", "Obsoleto": "obsolete" };
export function getProcess(code: string) { return processes.find((process) => process.code.toLowerCase() === code.toLowerCase()); }
