import type { MarketingFlowchart } from "./marketing-flowcharts";

type Activity = { kind: "activity" | "evidence"; label: string; role: string };
type Decision = { kind: "decision"; label: string; correction: string; role?: string; correctionRole?: string };
type Stage = Activity | Decision;
type Spec = { code: string; title: string; description: string; stages: Stage[] };

const palette = {
  start: ["#e8f8f2", "#13795b"], activity: ["#ddebff", "#2563a9"], decision: ["#fff4cc", "#b77900"],
  evidence: ["#f4f7fa", "#52616b"], end: ["#eaf7ea", "#2e7d32"],
} as const;

function makeNode(id: string, kind: "start" | "activity" | "decision" | "evidence" | "end", label: string, role: string, x: number, y: number, width: number, height = 76) {
  const [fill, stroke] = palette[kind];
  return { id, kind, label, role, position: { x, y }, size: { width, height: kind === "decision" ? 76 : height }, fill, stroke, textColor: "#243447" };
}

function link(id: string, source: string, target: string, label = "", sourceHandle: "top" | "left" | "right" | "bottom" = "bottom", targetHandle: "top" | "left" | "right" | "bottom" = "top", route: "normal" | "return" = "normal") {
  return { id, source, target, label, route, sourceHandle, targetHandle };
}

function buildFlow(spec: Spec): MarketingFlowchart {
  const nodes = [makeNode(`${spec.code}-start`, "start", "Inicio del proceso", "ADM/RRHH", 480, 25, 240, 52)];
  const edges: ReturnType<typeof link>[] = [];
  let previous = `${spec.code}-start`;
  let previousWasDecision = false;
  let y = 125;

  spec.stages.forEach((stage, index) => {
    const id = `${spec.code}-n${index + 1}`;
    if (stage.kind === "decision") {
      nodes.push(makeNode(id, "decision", stage.label, stage.role ?? "ADM/RRHH", 350, y, 520));
      edges.push(link(`${spec.code}-e-${index + 1}`, previous, id, previousWasDecision ? "Sí" : ""));
      const correctionId = `${id}-correction`;
      nodes.push(makeNode(correctionId, "activity", stage.correction, stage.correctionRole ?? "ADM/RRHH", 20, y + 118, 360, 86));
      edges.push(link(`${spec.code}-e-${index + 1}-no`, id, correctionId, "No", "left", "top"));
      edges.push(link(`${spec.code}-e-${index + 1}-return`, correctionId, id, "Subsanar", "right", "left", "return"));
      previous = id; previousWasDecision = true; y += 140;
      return;
    }
    nodes.push(makeNode(id, stage.kind, stage.label, stage.role, 300, y, 620, stage.kind === "evidence" ? 82 : 76));
    edges.push(link(`${spec.code}-e-${index + 1}`, previous, id, previousWasDecision ? "Sí" : ""));
    previous = id; previousWasDecision = false; y += 108;
  });

  const closeCheck = `${spec.code}-close-check`;
  nodes.push(makeNode(closeCheck, "decision", "¿El cierre tiene evidencia, responsable, estado y fecha siguiente cuando corresponda?", "CONTROL DE CIERRE", 350, y, 520));
  edges.push(link(`${spec.code}-close-entry`, previous, closeCheck, previousWasDecision ? "Sí" : ""));
  const closeFix = `${spec.code}-close-fix`;
  nodes.push(makeNode(closeFix, "activity", "Completar evidencia, responsable, estado o próxima alerta antes de cerrar", "ADM/RRHH", 20, y + 118, 360, 86));
  edges.push(link(`${spec.code}-close-no`, closeCheck, closeFix, "No", "left", "top"));
  edges.push(link(`${spec.code}-close-return`, closeFix, closeCheck, "Completar", "right", "left", "return"));
  const end = `${spec.code}-end`;
  nodes.push(makeNode(end, "end", "Proceso cerrado con trazabilidad", "EVIDENCIA", 415, y + 138, 390, 64));
  edges.push(link(`${spec.code}-close-yes`, closeCheck, end, "Sí"));

  return {
    code: spec.code, sourceId: spec.code, subareaCode: "GER-S02", subareaName: "Administración y Recursos Humanos", owner: "Responsable de Recursos Humanos",
    title: spec.title, description: spec.description,
    context: "Flujo detallado a partir de Administración y Recursos Humanos. Incluye validaciones, retornos de subsanación, responsables funcionales y control de cierre.",
    closure: "Cierre obligatorio con evidencia vinculada, responsable identificado, estado actualizado y próxima fecha cuando corresponda.",
    canvas: { width: 1100, height: y + 245 }, nodes, edges,
  };
}

const A = (label: string, role = "ADM/RRHH"): Activity => ({ kind: "activity", label, role });
const E = (label: string, role = "ADM/RRHH"): Activity => ({ kind: "evidence", label, role });
const D = (label: string, correction: string, role = "ADM/RRHH", correctionRole = "ADM/RRHH"): Decision => ({ kind: "decision", label, correction, role, correctionRole });

const specs: Spec[] = [
  { code: "GER-ARH-01", title: "Planeamiento de personas y capacidad administrativa", description: "Determina si una brecha requiere dotación, redistribución, automatización o ajuste organizativo.", stages: [
    A("Registrar área solicitante, necesidad, motivo, urgencia, fecha e impacto esperado"), A("Analizar carga, funciones, perfil requerido, criticidad y capacidad actual"),
    D("¿La alternativa de redistribución, automatización o ajuste está definida?", "Evaluar tareas transferibles, automatización, reorganización y capacidad disponible"),
    D("¿La alternativa propuesta tiene viabilidad presupuestal?", "Reformular la alternativa y retornar al análisis de capacidad", "CFT", "CFT"),
    A("Presentar necesidad, análisis, alternativa e impacto a Gerencia", "GERENCIA"), D("¿Gerencia aprueba la dotación o ajuste?", "Registrar no aprobación o ajuste solicitado y reformular" , "GERENCIA", "GERENCIA"),
    E("Registrar decisión, responsable, fecha y acción siguiente; activar Reclutamiento si corresponde"),
  ]},
  { code: "GER-ARH-02", title: "Reclutamiento y selección", description: "Gestiona una vacante aprobada desde el perfil y postulaciones hasta la selección o descarte documentado.", stages: [
    A("Registrar vacante aprobada: cargo, área, perfil, jefe, modalidad y fecha requerida"), D("¿El perfil está completo y aprobado?", "Solicitar ajuste de perfil antes de publicar"),
    A("Definir cronograma y canales de reclutamiento"), A("Recibir y registrar postulaciones"), D("¿El postulante cumple requisitos mínimos?", "Registrar descarte con trazabilidad", "ADM/RRHH", "ADM/RRHH"),
    A("Entrevistar al candidato y solicitar evaluación técnica al líder cuando corresponda"), D("¿El candidato continúa y está recomendado?", "Registrar descarte o continuar búsqueda", "ADM/RRHH", "ADM/RRHH"),
    A("Consolidar CV, entrevista, evaluación y recomendación"), D("¿Gerencia aprueba la contratación?", "Comunicar descarte o buscar otro candidato", "GERENCIA", "GERENCIA"), E("Comunicar selección y activar ingreso, alta e inducción"),
  ]},
  { code: "GER-ARH-03", title: "Ingreso, alta e inducción", description: "Formaliza el ingreso de un candidato aprobado con expediente, contrato, altas, accesos e inducción.", stages: [
    A("Confirmar puesto, modalidad, condiciones y fecha de ingreso"), D("¿Las condiciones coinciden con lo aprobado?", "Regularizar condiciones con Gerencia antes de continuar"),
    A("Solicitar checklist documental y verificar expediente"), D("¿El expediente documental está completo?", "Solicitar faltantes y volver a verificar"),
    A("Registrar al colaborador una sola vez en el maestro institucional"), A("Preparar contrato, anexos y gestionar firmas"), D("¿Los documentos están firmados?", "Realizar seguimiento de firma antes del alta"),
    A("Gestionar alta legal, Vida Ley y registros aplicables", "LEGAL / ESPECIALISTA"), A("Solicitar accesos, equipos y herramientas", "LOGÍSTICA / SISTEMAS"), D("¿Todo está disponible para la fecha de ingreso?", "Escalar faltantes y confirmar nueva disponibilidad", "LOGÍSTICA / SISTEMAS", "LOGÍSTICA / SISTEMAS"),
    A("Ejecutar inducción general y coordinar inducción técnica con el líder"), E("Cerrar checklist de ingreso, accesos, activos, altas e inducción"),
  ]},
  { code: "GER-ARH-04", title: "Administración de personal y contratos", description: "Controla vencimientos, continuidad, renovaciones y contratos con alertas de 60, 30 y 15 días.", stages: [
    A("Revisar alertas automáticas de vencimientos 60, 30 y 15 días"), A("Identificar contratos próximos a vencer y verificar documentación, desempeño e incidencias"),
    D("¿La posición sigue siendo necesaria?", "Preparar recomendación de no continuidad"), D("¿Existen incidencias que cambian la recomendación?", "Incorporar incidencias y solicitar información complementaria"),
    A("Preparar recomendación: renovar, modificar, no renovar o revisar condiciones"), D("¿Gerencia aprueba la decisión?", "Atender observaciones y volver a evaluar", "GERENCIA", "GERENCIA"),
    A("Preparar documento y gestionar firma antes del vencimiento"), E("Actualizar maestro, expediente, vigencia y próxima alerta"),
  ]},
  { code: "GER-ARH-05", title: "Asistencia y novedades", description: "Registra y concilia diariamente asistencia, tardanzas, permisos, descansos y su impacto en planilla.", stages: [
    A("Revisar fuente institucional de asistencia"), A("Detectar tardanzas, faltas, permisos, horas extras, descansos u otras novedades"),
    D("¿Existe diferencia o novedad?", "Cerrar revisión diaria sin novedad"), A("Registrar novedad y consultar al colaborador"), D("¿La explicación y el sustento son válidos?", "Solicitar dato puntual al líder o registrar la condición correspondiente"),
    A("Determinar impacto en planilla"), D("¿Existen diferencias pendientes antes del corte?", "Retornar al caso para conciliar y corregir"), E("Cerrar periodo de asistencia conciliado"),
  ]},
  { code: "GER-ARH-06", title: "Vacaciones, relevos y continuidad", description: "Planifica vacaciones, cobertura y transferencia para mantener continuidad operativa.", stages: [
    A("Desde julio, identificar saldos, personas pendientes y periodos críticos"), A("Construir propuesta de vacaciones de julio a septiembre"),
    D("¿La propuesta de vacaciones mantiene la continuidad de la operación?", "Validar cobertura con el líder y resolver cruces"), D("¿Existe cobertura y suplente definido?", "Escalar falta de cobertura a Gerencia"),
    A("Comunicar calendario y emitir alerta siete días antes"), A("Exigir correo de pendientes y transferencia al responsable suplente"), D("¿La transferencia está completa?", "Escalar y completar pendientes antes de la ausencia"),
    E("Documentar retorno, actualizar saldo y cerrar periodo de vacaciones"),
  ]},
  { code: "GER-ARH-07", title: "Planilla, beneficios y pagos laborales", description: "Controla novedades, cálculo, aprobación, pago y evidencias laborales antes y después de cada corte.", stages: [
    A("Registrar novedades durante el mes: altas, bajas, vacaciones, horas, bonos, comisiones y cambios"), A("Cerrar novedades y preparar paquete para cálculo técnico"),
    D("¿Las novedades están conciliadas?", "Corregir novedades antes de enviar el cálculo"), A("Recibir cálculo y validar población, fechas, conceptos y consistencia"), D("¿Existen diferencias?", "Corregir diferencias y retornar a validación"),
    A("Presentar paquete a Gerencia", "GERENCIA"), D("¿Gerencia aprueba el pago?", "Devolver observaciones para corrección", "GERENCIA", "GERENCIA"),
    A("CFT emite instrucción autorizada a Tesorería", "CFT"), A("Tesorería ejecuta pago", "TESORERÍA"), D("¿El pago se ejecutó correctamente?", "Escalar diferencia de pago y regularizar", "TESORERÍA", "TESORERÍA"), E("Distribuir boletas, documentos y archivar evidencia"),
  ]},
  { code: "GER-ARH-08", title: "Desempeño, capacitación y desarrollo", description: "Gestiona ciclos de desempeño, brechas, acciones de desarrollo y seguimiento de aplicación.", stages: [
    A("Definir ciclo, calendario, criterios y formatos"), A("Recopilar información objetiva del periodo"), D("¿La información disponible es suficiente para evaluar?", "Entrevistar o consultar responsables técnicos"),
    A("Documentar resultados, fortalezas y brechas"), D("¿La evaluación está libre de brechas que requieran acción?", "Determinar capacitación, reconocimiento o plan de mejora"), A("Definir y comunicar la acción de desarrollo correspondiente"),
    D("¿La acción cuenta con decisión o presupuesto requerido?", "Solicitar decisión o presupuesto a Gerencia", "GERENCIA", "GERENCIA"), A("Ejecutar seguimiento de la acción"), D("¿La acción fue aplicada?", "Realizar seguimiento y ajustar el plan"), E("Registrar resultado y evidencia de aplicación"),
  ]},
  { code: "GER-ARH-09", title: "Relaciones laborales y casos sensibles", description: "Gestiona casos sensibles con evidencia, confidencialidad, criterio especializado y seguimiento hasta la resolución.", stages: [
    A("Registrar hecho, fecha, involucrados y origen del caso"), A("Entrevistar involucrados y recopilar evidencia"), D("¿El expediente cuenta con criterio legal cuando aplica?", "Solicitar criterio legal o especializado", "LEGAL / ESPECIALISTA", "LEGAL / ESPECIALISTA"),
    A("Analizar información y proponer medida, plan o seguimiento"), D("¿La medida cuenta con la aprobación gerencial requerida?", "Solicitar decisión de Gerencia", "GERENCIA", "GERENCIA"), A("Comunicar decisión y responsables"),
    D("¿El caso está resuelto?", "Continuar seguimiento y documentar nuevas evidencias"), E("Cerrar expediente confidencial con evidencia de resolución"),
  ]},
  { code: "GER-ARH-10", title: "Cumplimiento laboral y entidades", description: "Controla notificaciones, obligaciones, plazos, expedientes y presentaciones ante entidades.", stages: [
    A("Revisar diariamente casilla, canales oficiales y calendario de obligaciones"), D("¿Existe nueva notificación u obligación?", "Cerrar revisión diaria sin alerta"),
    A("Registrar documento, entidad, fecha, plazo y responsable"), A("Comunicar el mismo día a Gerencia y especialistas cuando corresponda"), A("Armar expediente y definir hitos intermedios"),
    D("¿El expediente cuenta con criterio especializado cuando aplica?", "Solicitar criterio técnico a Legal o Contabilidad", "LEGAL / ESPECIALISTA", "LEGAL / ESPECIALISTA"), A("Controlar entregables y documentación"), D("¿La documentación está completa antes del plazo?", "Escalar faltantes y solicitar subsanación"),
    A("Presentar a la entidad externa", "ENTIDAD EXTERNA"), E("Archivar cargo, constancia y evidencia; cerrar alerta"),
  ]},
  { code: "GER-ARH-11", title: "Salida y transferencia", description: "Gestiona una salida con transferencia de conocimiento, activos, accesos, liquidación y expediente de inactivos.", stages: [
    A("Recibir renuncia o decisión de salida y validar sustento"), A("Definir último día y abrir checklist de salida"), A("Documentar transferencia de conocimiento"), D("¿La transferencia está completa?", "Solicitar pendientes de transferencia"),
    A("Coordinar devolución de activos y revocación de accesos", "LOGÍSTICA / SISTEMAS"), D("¿Todos los activos fueron devueltos?", "Registrar pendiente y gestionar devolución", "LOGÍSTICA", "LOGÍSTICA"),
    A("Enviar datos para liquidación y revisar documentación", "CFT / FINANZAS"), D("¿El pago está aprobado?", "Subsanar expediente antes de la aprobación", "GERENCIA", "GERENCIA"), A("Tesorería paga y Contabilidad registra", "TESORERÍA / CONTABILIDAD"),
    A("Cerrar Vida Ley, registros aplicables y accesos restantes"), D("¿La entrevista de salida fue realizada cuando corresponde?", "Realizar entrevista de salida antes del cierre"), E("Mover expediente a inactivos y registrar evidencia final"),
  ]},
  { code: "GER-ARH-12", title: "Gestión documental administrativa", description: "Registra, clasifica, deriva y controla documentos administrativos manteniendo trazabilidad y confidencialidad.", stages: [
    A("Recibir documento por canal oficial"), A("Clasificar tipo, área, confidencialidad y plazo"), A("Registrar ID, fecha, remitente, responsable y estado"),
    D("¿Se aplicó tratamiento de confidencialidad cuando corresponde?", "Aplicar tratamiento restringido antes de derivar"), A("Derivar el documento al responsable"), A("Registrar derivación sin perder trazabilidad"),
    D("¿La respuesta o acción se realizó dentro del plazo?", "Dar seguimiento y escalar vencimiento"), E("Archivar versión final, respuesta y evidencia de cierre"),
  ]},
  { code: "GER-ARH-13", title: "Contratos y servicios administrativos", description: "Controla contratos, proveedores, entregables, vigencias, conformidad y expedientes de cierre o pago.", stages: [
    A("Registrar contrato o servicio, proveedor y responsable interno"), A("Verificar objeto, vigencia, entregables, monto y documentos"), D("¿El expediente está completo?", "Solicitar subsanación del expediente"),
    A("Programar alertas de vencimiento y fechas de control"), A("Solicitar conformidad al llegar un entregable"), D("¿El servicio es conforme?", "Registrar observación y solicitar regularización"),
    A("Determinar renovación, cierre o pago"), A("Preparar expediente correspondiente"), E("Archivar contrato, conformidad y evidencias"),
  ]},
  { code: "GER-ARH-14", title: "Trámites, licencias, pólizas y documentación corporativa", description: "Gestiona obligaciones externas, firmas, observaciones, constancias y alertas de renovación.", stages: [
    A("Identificar obligación o trámite y registrar entidad y fecha límite"), A("Preparar requisitos y asignar responsables"), D("¿La aprobación o firma requerida ya fue obtenida?", "Obtener aprobación o firma antes de presentar", "GERENCIA", "GERENCIA"),
    A("Presentar ante entidad o proveedor", "ENTIDAD EXTERNA"), D("¿La entidad formula observaciones?", "Registrar observación, subsanar y volver a presentar", "ENTIDAD EXTERNA", "ENTIDAD EXTERNA"),
    A("Recibir constancia o resultado", "ENTIDAD EXTERNA"), E("Archivar constancia, vigencia y crear alerta de renovación"),
  ]},
  { code: "GER-ARH-15", title: "Solicitudes administrativas y expediente para pago", description: "Conecta Administración con CFT, Finanzas, Gerencia, Tesorería y Contabilidad para pagos trazables.", stages: [
    A("Área solicitante confirma necesidad y conformidad", "ÁREA SOLICITANTE"), A("Administración recibe expediente y verifica documentación mínima y proveedor"), D("¿El expediente está completo?", "Devolver para subsanación"),
    D("¿El centro de costo o proyecto está asignado cuando corresponde?", "Asignar centro de costo o proyecto antes de remitir"), A("Remitir expediente a CFT", "CFT"), A("Finanzas valida presupuesto y disponibilidad de caja", "FINANZAS"),
    D("¿Existe presupuesto y caja?", "Detener, reprogramar o escalar solicitud", "FINANZAS", "FINANZAS"), D("¿Gerencia aprueba el pago según política?", "Devolver expediente con observaciones", "GERENCIA", "GERENCIA"),
    A("Tesorería ejecuta pago y Contabilidad registra operación", "TESORERÍA / CONTABILIDAD"), E("Administración conserva expediente, evidencia y conformidad"),
  ]},
  { code: "GER-ARH-16", title: "Actas, acuerdos y seguimiento gerencial", description: "Registra acuerdos, responsables y plazos; controla avances, bloqueos, evidencias y reportes gerenciales.", stages: [
    A("Registrar acuerdo, fecha, responsable y plazo"), A("Notificar al responsable y programar seguimiento previo al vencimiento"), A("Revisar avance en la fecha de seguimiento"),
    D("¿El acuerdo está cumplido?", "Identificar bloqueo o continuar seguimiento"), D("¿El bloqueo fue resuelto o no existe?", "Escalar bloqueo y registrar decisión de Gerencia", "GERENCIA", "GERENCIA"),
    A("Adjuntar evidencia y marcar acuerdo cerrado"), A("Consolidar acuerdos pendientes y reportar a Gerencia"), E("Actualizar cuadro general de seguimiento"),
  ]},
  { code: "GER-ARH-17", title: "Continuidad operativa del área", description: "Mantiene un ciclo preventivo de alternos, capacidad, pruebas y activación de contingencias.", stages: [
    A("Mantener mapa de funciones críticas, titular y alterno"), D("¿Cada función crítica tiene alterno?", "Designar y preparar alterno"),
    A("Revisar semanalmente próximos hitos, carga y capacidad"), D("¿Existe riesgo de capacidad?", "Preparar contingencia y redistribuir cobertura"),
    A("Actualizar kit de continuidad, repositorios y documentación crítica"), A("Seleccionar y probar trimestralmente un proceso crítico"), D("¿El esquema alterno permite ejecutar correctamente?", "Registrar brecha y corregir kit o procedimiento"),
    A("Ante ausencia o incidente, activar alterno y ejecutar continuidad"), D("¿La operación fue recuperada?", "Escalar y aplicar contingencia adicional"), E("Registrar recuperación, diferencias y mejora preventiva; retornar al ciclo normal"),
  ]},
];

const administrationDetailedFlowcharts = specs.map(buildFlow);
export default administrationDetailedFlowcharts;
