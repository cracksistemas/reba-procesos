import type { MarketingFlowchart } from "./marketing-flowcharts";

type Activity = { label: string; role: string };

const palette = {
  start: ["#e8f8f2", "#13795b"],
  activity: ["#eaf3ff", "#2563a9"],
  decision: ["#fff4cc", "#b77900"],
  evidence: ["#f4f7fa", "#52616b"],
  end: ["#e8f8f2", "#13795b"],
} as const;

function node(
  id: string,
  kind: "start" | "activity" | "decision" | "evidence" | "end",
  label: string,
  role: string,
  x: number,
  y: number,
  width = 470,
) {
  const [fill, stroke] = palette[kind];
  return { id, kind, label, role, position: { x, y }, size: { width: kind === "decision" ? 540 : width, height: kind === "decision" ? 76 : 76 }, fill, stroke, textColor: "#243447" };
}

function edge(id: string, source: string, target: string, label = "", sourceHandle: "top" | "left" | "right" | "bottom" = "bottom", targetHandle: "top" | "left" | "right" | "bottom" = "top") {
  return { id, source, target, label, route: "normal" as const, sourceHandle, targetHandle };
}

function supervisionFlow(
  code: string,
  title: string,
  description: string,
  steps: Activity[],
  question: string,
  yes: Activity,
  no: Activity,
  followUp: Activity,
): MarketingFlowchart {
  const ids = { start: `${code}-start`, decision: `${code}-decision`, yes: `${code}-yes`, no: `${code}-no`, follow: `${code}-follow`, end: `${code}-end` };
  const activityNodes = steps.map((step, index) => node(`${code}-step-${index + 1}`, "activity", step.label, step.role, 285, 145 + index * 116, 640));
  const decisionY = 145 + steps.length * 116;
  const nodes = [
    node(ids.start, "start", "Inicio de supervisión", "ASISTENTE DE GERENCIA", 490, 25, 230),
    ...activityNodes,
    node(ids.decision, "decision", question, "CONTROL GERENCIAL", 335, decisionY, 540),
    node(ids.yes, "evidence", yes.label, yes.role, 700, decisionY + 145, 420),
    node(ids.no, "activity", no.label, no.role, 20, decisionY + 145, 430),
    node(ids.follow, "activity", followUp.label, followUp.role, 300, decisionY + 285, 610),
    node(ids.end, "end", "Seguimiento documentado y Gerencia informada", "EVIDENCIA", 390, decisionY + 415, 430),
  ];
  const edges = [edge(`${code}-e-start`, ids.start, activityNodes[0].id)];
  activityNodes.slice(0, -1).forEach((item, index) => edges.push(edge(`${code}-e-${index + 1}`, item.id, activityNodes[index + 1].id)));
  edges.push(
    edge(`${code}-e-decision`, activityNodes.at(-1)!.id, ids.decision),
    edge(`${code}-e-yes`, ids.decision, ids.yes, "Sí", "right", "top"),
    edge(`${code}-e-no`, ids.decision, ids.no, "No", "left", "top"),
    edge(`${code}-e-yes-end`, ids.yes, ids.end, "", "bottom", "right"),
    edge(`${code}-e-no-follow`, ids.no, ids.follow, "", "bottom", "left"),
    edge(`${code}-e-follow-end`, ids.follow, ids.end),
  );
  return {
    code, sourceId: code, subareaCode: "GER-S05", subareaName: "Asistentes de Gerencia", owner: "Asistente de Gerencia",
    title, description,
    context: "MOF Asistentes de Gerencia. La asistencia supervisa, verifica, coordina y reporta; no reemplaza la ejecución operativa del área responsable.",
    closure: "Evidencia registrada, responsable identificado y estado reportado a Gerencia.",
    canvas: { width: 1160, height: decisionY + 535 }, nodes, edges,
  };
}

const managementAssistantData: MarketingFlowchart[] = [
  supervisionFlow("GER-AG-01", "Supervisión general de actividades", "Controla el cumplimiento de objetivos, tareas e indicadores asignados por Gerencia.", [
    { label: "Gerencia define objetivo, tarea o indicador", role: "GERENCIA" },
    { label: "Asistente comunica la disposición al área responsable", role: "ASISTENTE DE GERENCIA" },
    { label: "Área responsable ejecuta la actividad", role: "ÁREA RESPONSABLE" },
    { label: "Asistente solicita reporte o evidencia", role: "ASISTENTE DE GERENCIA" },
    { label: "Asistente verifica cumplimiento", role: "ASISTENTE DE GERENCIA" },
  ], "¿Se cumplió correctamente?", { label: "Registrar cumplimiento y reportar a Gerencia", role: "ASISTENTE DE GERENCIA" }, { label: "Identificar observación, solicitar corrección y fijar fecha", role: "ASISTENTE DE GERENCIA" }, { label: "Dar seguimiento; si no se subsana, escalar a Gerencia", role: "ASISTENTE DE GERENCIA" }),
  supervisionFlow("GER-AG-02", "Supervisión de Recursos Humanos", "Verifica la gestión de asistencia, documentación laboral, contrataciones e incidencias de personal.", [
    { label: "RR. HH. presenta reporte de personal e incidencias", role: "RECURSOS HUMANOS" },
    { label: "Asistente revisa la información", role: "ASISTENTE DE GERENCIA" },
    { label: "Verifica políticas, plazos y documentación", role: "ASISTENTE DE GERENCIA" },
  ], "¿Existen incumplimientos u observaciones?", { label: "Registrar conformidad y reportar a Gerencia", role: "ASISTENTE DE GERENCIA" }, { label: "Solicitar sustento, regularización y fecha de cumplimiento", role: "ASISTENTE DE GERENCIA" }, { label: "Dar seguimiento y elevar a Gerencia si requiere decisión superior", role: "ASISTENTE DE GERENCIA" }),
  supervisionFlow("GER-AG-03", "Supervisión de Administración", "Da seguimiento a procedimientos, documentos, contratos, solicitudes y requerimientos administrativos.", [
    { label: "Se genera requerimiento o procedimiento administrativo", role: "ÁREA USUARIA" },
    { label: "Administración gestiona el requerimiento", role: "ADMINISTRACIÓN" },
    { label: "Asistente revisa estado, responsable y fecha límite", role: "ASISTENTE DE GERENCIA" },
  ], "¿Se encuentra dentro del plazo y con sustento?", { label: "Continuar seguimiento y cerrar al cumplirse", role: "ASISTENTE DE GERENCIA" }, { label: "Solicitar explicación, corrección y nueva fecha de atención", role: "ASISTENTE DE GERENCIA" }, { label: "Verificar cumplimiento y reportar resultado a Gerencia", role: "ASISTENTE DE GERENCIA" }),
  supervisionFlow("GER-AG-04", "Supervisión de Tesorería", "Controla oportunidad de reportes, pagos autorizados, obligaciones y sustento documental.", [
    { label: "Tesorería presenta reporte de ingresos, egresos y pagos pendientes", role: "TESORERÍA" },
    { label: "Asistente revisa fechas, autorizaciones y sustentos", role: "ASISTENTE DE GERENCIA" },
    { label: "Contrasta obligaciones programadas con pagos ejecutados", role: "ASISTENTE DE GERENCIA" },
  ], "¿Existen pagos vencidos, diferencias o falta de sustento?", { label: "Registrar conformidad y reportar", role: "ASISTENTE DE GERENCIA" }, { label: "Solicitar sustento e identificar responsable y fecha de regularización", role: "ASISTENTE DE GERENCIA" }, { label: "Dar seguimiento y comunicar a Gerencia las incidencias relevantes", role: "ASISTENTE DE GERENCIA" }),
  supervisionFlow("GER-AG-05", "Supervisión de Finanzas", "Contrasta presupuesto, proyecciones, resultados, variaciones y riesgos financieros reportados.", [
    { label: "Finanzas presenta presupuesto, proyección y resultados", role: "FINANZAS" },
    { label: "Asistente compara proyectado versus ejecutado", role: "ASISTENTE DE GERENCIA" },
    { label: "Identifica variaciones y riesgos relevantes", role: "ASISTENTE DE GERENCIA" },
  ], "¿Existen desviaciones importantes?", { label: "Consolidar resultados y reportar a Gerencia", role: "ASISTENTE DE GERENCIA" }, { label: "Solicitar explicación y plan de acción al área responsable", role: "ASISTENTE DE GERENCIA" }, { label: "Dar seguimiento a medidas correctivas y reportar evolución", role: "ASISTENTE DE GERENCIA" }),
  supervisionFlow("GER-AG-06", "Supervisión de Contabilidad", "Verifica entrega oportuna de comprobantes, sustentos y levantamiento de observaciones contables.", [
    { label: "Contabilidad solicita documentación a las áreas", role: "CONTABILIDAD" },
    { label: "Áreas remiten comprobantes y sustentos", role: "ÁREAS INVOLUCRADAS" },
    { label: "Asistente verifica entrega y cumplimiento de plazos", role: "ASISTENTE DE GERENCIA" },
  ], "¿La documentación está completa y oportuna?", { label: "Contabilidad continúa el proceso y se registra cumplimiento", role: "CONTABILIDAD" }, { label: "Identificar área pendiente y solicitar regularización", role: "ASISTENTE DE GERENCIA" }, { label: "Dar seguimiento a observaciones y reportar obligaciones o riesgos", role: "ASISTENTE DE GERENCIA" }),
  supervisionFlow("GER-AG-07", "Supervisión de Coordinación Académica", "Controla programación, eventos, clases, incidencias, entregables y coordinación entre áreas.", [
    { label: "Coordinación Académica ejecuta la programación", role: "COORDINACIÓN ACADÉMICA" },
    { label: "Asistente revisa clases, docentes, campus, evaluaciones y certificados", role: "ASISTENTE DE GERENCIA" },
    { label: "Verifica cronograma, incidencias y pendientes críticos", role: "ASISTENTE DE GERENCIA" },
  ], "¿El proceso se desarrolla según lo programado?", { label: "Registrar cumplimiento y continuar monitoreo", role: "ASISTENTE DE GERENCIA" }, { label: "Identificar incidencia y solicitar plan de solución", role: "ASISTENTE DE GERENCIA" }, { label: "Coordinar seguimiento entre áreas y escalar si requiere autorización", role: "ASISTENTE DE GERENCIA" }),
  supervisionFlow("GER-AG-08", "Supervisión de Cobranzas", "Revisa cartera pendiente, morosidad, recuperación, actualización de pagos y casos críticos.", [
    { label: "Cobranzas presenta cartera pendiente y resultados", role: "COBRANZAS" },
    { label: "Asistente revisa meta, morosidad y recuperación", role: "ASISTENTE DE GERENCIA" },
    { label: "Verifica seguimiento y actualización de estados de pago", role: "ASISTENTE DE GERENCIA" },
  ], "¿Se cumplen las metas y el plan de recuperación?", { label: "Registrar resultados y reportar", role: "ASISTENTE DE GERENCIA" }, { label: "Identificar causas y solicitar plan de recuperación", role: "ASISTENTE DE GERENCIA" }, { label: "Dar seguimiento y elevar casos críticos o montos relevantes", role: "ASISTENTE DE GERENCIA" }),
  supervisionFlow("GER-AG-09", "Supervisión de Logística", "Controla atención de requerimientos, compras, stock, entregas y sustento de adquisiciones.", [
    { label: "Área usuaria genera requerimiento", role: "ÁREA USUARIA" },
    { label: "Logística recibe, programa y gestiona", role: "LOGÍSTICA" },
    { label: "Asistente revisa prioridad, autorización, stock y fecha de atención", role: "ASISTENTE DE GERENCIA" },
  ], "¿El requerimiento fue atendido en el plazo?", { label: "Verificar entrega y cerrar pendiente", role: "ASISTENTE DE GERENCIA" }, { label: "Identificar causa, solicitar fecha de atención y dar seguimiento", role: "ASISTENTE DE GERENCIA" }, { label: "Si afecta la operación, alertar a Gerencia; si no, controlar hasta cierre", role: "ASISTENTE DE GERENCIA" }),
  supervisionFlow("GER-AG-10", "Supervisión de Ventas y Área Comercial", "Controla metas comerciales, indicadores de ventas, leads, conversiones, matrículas y planes de mejora.", [
    { label: "Gerencia establece meta comercial", role: "GERENCIA" },
    { label: "Comercial distribuye objetivos y ejecuta ventas", role: "COMERCIAL" },
    { label: "Asistente revisa leads, conversiones, matrículas y resultados", role: "ASISTENTE DE GERENCIA" },
  ], "¿Se cumple la meta comercial?", { label: "Registrar resultado y reportar a Gerencia", role: "ASISTENTE DE GERENCIA" }, { label: "Analizar desviaciones y solicitar plan de mejora", role: "ASISTENTE DE GERENCIA" }, { label: "Dar seguimiento al plan y reportar evolución a Gerencia", role: "ASISTENTE DE GERENCIA" }),
  supervisionFlow("GER-AG-11", "Supervisión de Marketing", "Verifica campañas, entregables, indicadores y articulación con Diseño, Audiovisuales y Comercial.", [
    { label: "Se define campaña o evento prioritario", role: "GERENCIA" },
    { label: "Marketing elabora y ejecuta el plan", role: "MARKETING" },
    { label: "Asistente verifica fechas, entregables y coordinación interáreas", role: "ASISTENTE DE GERENCIA" },
  ], "¿La campaña se ejecutó a tiempo y según lo aprobado?", { label: "Revisar indicadores y reportar resultados", role: "ASISTENTE DE GERENCIA" }, { label: "Identificar causa, solicitar corrección y nueva fecha", role: "ASISTENTE DE GERENCIA" }, { label: "Dar seguimiento hasta cierre y reportar incidencias relevantes", role: "ASISTENTE DE GERENCIA" }),
  supervisionFlow("GER-AG-12", "Supervisión de Diseño Gráfico", "Controla prioridades, brief, piezas, plazos, correcciones y coordinación del diseño gráfico.", [
    { label: "Área solicita pieza gráfica", role: "ÁREA SOLICITANTE" },
    { label: "Diseño recibe requerimiento y programa", role: "DISEÑO GRÁFICO" },
    { label: "Asistente verifica prioridad, brief y fecha de entrega", role: "ASISTENTE DE GERENCIA" },
  ], "¿La pieza fue entregada y aprobada en plazo?", { label: "Cerrar requerimiento y registrar cumplimiento", role: "ASISTENTE DE GERENCIA" }, { label: "Solicitar corrección o reprogramación con sustento", role: "ASISTENTE DE GERENCIA" }, { label: "Dar seguimiento hasta aprobación final y reportar retrasos recurrentes", role: "ASISTENTE DE GERENCIA" }),
  supervisionFlow("GER-AG-13", "Supervisión de Audiovisuales", "Controla producción audiovisual, prioridades, recursos, entregas, aprobación e incidencias técnicas.", [
    { label: "Se genera solicitud de video, grabación o edición", role: "ÁREA SOLICITANTE" },
    { label: "Audiovisuales programa producción y entrega", role: "AUDIOVISUALES" },
    { label: "Asistente verifica cronograma, prioridad y recursos", role: "ASISTENTE DE GERENCIA" },
  ], "¿El material fue entregado y aprobado en plazo?", { label: "Registrar entrega y cerrar pendiente", role: "ASISTENTE DE GERENCIA" }, { label: "Solicitar corrección o nueva fecha con sustento", role: "ASISTENTE DE GERENCIA" }, { label: "Dar seguimiento y reportar incidencias técnicas o retrasos críticos", role: "ASISTENTE DE GERENCIA" }),
  supervisionFlow("GER-AG-14", "Supervisión de Relaciones Públicas y Convenios", "Da seguimiento a oportunidades institucionales, convenios, documentación y compromisos externos.", [
    { label: "Se identifica institución u oportunidad", role: "RELACIONES PÚBLICAS" },
    { label: "Relaciones Públicas realiza contacto y presenta propuesta", role: "RELACIONES PÚBLICAS" },
    { label: "Asistente registra gestión y da seguimiento a respuesta y documentación", role: "ASISTENTE DE GERENCIA" },
  ], "¿La gestión requiere aprobación o decisión gerencial?", { label: "Elevar propuesta, condiciones o documento a Gerencia", role: "ASISTENTE DE GERENCIA" }, { label: "Continuar gestión dentro de facultades autorizadas", role: "RELACIONES PÚBLICAS" }, { label: "Registrar acuerdos, compromisos y controlar cumplimiento hasta cierre", role: "ASISTENTE DE GERENCIA" }),
  supervisionFlow("GER-AG-15", "Gestión de incidencias gerenciales", "Registra, prioriza, deriva y escala incidencias detectadas durante la supervisión institucional.", [
    { label: "Incidencia detectada", role: "ASISTENTE DE GERENCIA" },
    { label: "Registrar incidencia", role: "ASISTENTE DE GERENCIA" },
    { label: "Identificar área y responsable", role: "ASISTENTE DE GERENCIA" },
    { label: "Determinar nivel de prioridad", role: "ASISTENTE DE GERENCIA" },
  ], "¿La incidencia es crítica?", { label: "Informar inmediatamente a Gerencia y definir acción", role: "GERENCIA" }, { label: "Solicitar subsanación al área y establecer fecha límite", role: "ASISTENTE DE GERENCIA" }, { label: "Dar seguimiento, registrar evidencia y cerrar o escalar si no se soluciona", role: "ASISTENTE DE GERENCIA" }),
  supervisionFlow("GER-AG-16", "Reporte semanal de supervisión", "Consolida información de áreas, clasifica estado de pendientes e informa decisiones de Gerencia.", [
    { label: "Solicitar información a las áreas", role: "ASISTENTE DE GERENCIA" },
    { label: "Recibir reportes", role: "ÁREAS RESPONSABLES" },
    { label: "Revisar y validar información", role: "ASISTENTE DE GERENCIA" },
    { label: "Clasificar: cumplido, en proceso, vencido o crítico", role: "ASISTENTE DE GERENCIA" },
    { label: "Identificar principales incidencias y actualizar cuadro de control", role: "ASISTENTE DE GERENCIA" },
    { label: "Elaborar y presentar reporte ejecutivo a Gerencia", role: "ASISTENTE DE GERENCIA" },
    { label: "Gerencia define decisiones y Asistente comunica acuerdos", role: "GERENCIA" },
  ], "¿Existen acuerdos o pendientes que requieran seguimiento?", { label: "Registrar decisiones y cierre de periodo", role: "ASISTENTE DE GERENCIA" }, { label: "Asignar responsable y fecha de cumplimiento", role: "ASISTENTE DE GERENCIA" }, { label: "Dar seguimiento durante la semana y actualizar el estado", role: "ASISTENTE DE GERENCIA" }),
];

export default managementAssistantData;
