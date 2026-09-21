import type { MarketingFlowchart } from "./marketing-flowcharts";

type Activity = { kind?: "activity" | "evidence"; label: string; role?: string };
type Decision = { kind: "decision"; label: string; no: string; role?: string; noRole?: string };
type Stage = Activity | Decision;
type Spec = { code: string; title: string; description: string; subareaCode: string; subareaName: string; stages: Stage[] };

const colors = { start:["#e8f8f2","#13795b"], activity:["#eaf3ff","#2563a9"], decision:["#fff4cc","#b77900"], evidence:["#f4f7fa","#52616b"], end:["#eaf7ea","#2e7d32"] } as const;
type Kind = keyof typeof colors;
type Handle = "top" | "right" | "bottom" | "left";

function makeNode(id:string, kind:Kind, label:string, role:string, x:number, y:number, width:number, height=76) {
  const [fill, stroke] = colors[kind];
  return { id, kind, label, role, position:{x,y}, size:{width, height:kind === "decision" ? 76 : height}, fill, stroke, textColor:"#243447" };
}
function makeEdge(id:string, source:string, target:string, label="", sourceHandle:Handle="bottom", targetHandle:Handle="top", route:"normal"|"return"="normal") {
  return { id, source, target, label, sourceHandle, targetHandle, route };
}

function buildFlow(spec:Spec): MarketingFlowchart {
  const role = "RECEPCIÓN";
  const nodes = [makeNode(`${spec.code}-start`, "start", "Inicio del proceso", role, 425, 25, 300, 54)];
  const edges: ReturnType<typeof makeEdge>[] = [];
  let previous = `${spec.code}-start`;
  let fromDecision = false;
  let y = 120;

  spec.stages.forEach((stage, index) => {
    const id = `${spec.code}-n${index + 1}`;
    if (stage.kind === "decision") {
      nodes.push(makeNode(id, "decision", stage.label, stage.role ?? "CONTROL DE RECEPCIÓN", 330, y, 540));
      edges.push(makeEdge(`${spec.code}-e${index + 1}`, previous, id, fromDecision ? "Sí" : ""));
      const regularize = `${id}-no`;
      nodes.push(makeNode(regularize, "activity", stage.no, stage.noRole ?? role, 20, y + 112, 365, 88));
      edges.push(makeEdge(`${spec.code}-e${index + 1}-no`, id, regularize, "No", "left", "top"));
      edges.push(makeEdge(`${spec.code}-e${index + 1}-return`, regularize, id, "Regularizar / continuar", "right", "left", "return"));
      previous = id;
      fromDecision = true;
      y += 145;
      return;
    }
    const kind = stage.kind ?? "activity";
    nodes.push(makeNode(id, kind, stage.label, stage.role ?? role, 280, y, 640, kind === "evidence" ? 84 : 76));
    edges.push(makeEdge(`${spec.code}-e${index + 1}`, previous, id, fromDecision ? "Sí" : ""));
    previous = id;
    fromDecision = false;
    y += 110;
  });

  const close = `${spec.code}-close`;
  nodes.push(makeNode(close, "decision", "¿La atención quedó resuelta o correctamente derivada con trazabilidad?", "CONTROL DE RECEPCIÓN", 330, y, 540));
  edges.push(makeEdge(`${spec.code}-close-entry`, previous, close, fromDecision ? "Sí" : ""));
  const pending = `${spec.code}-pending`;
  nodes.push(makeNode(pending, "activity", "Registrar participante, solicitud, responsable, estado y próxima acción; informar al siguiente turno", role, 20, y + 112, 365, 88));
  edges.push(makeEdge(`${spec.code}-close-no`, close, pending, "No", "left", "top"));
  edges.push(makeEdge(`${spec.code}-close-return`, pending, close, "Completar", "right", "left", "return"));
  const end = `${spec.code}-end`;
  nodes.push(makeNode(end, "end", "Cierre de proceso con atención trazable", "EVIDENCIA", 405, y + 142, 390, 62));
  edges.push(makeEdge(`${spec.code}-close-yes`, close, end, "Sí"));

  return { code:spec.code, sourceId:spec.code, subareaCode:spec.subareaCode, subareaName:spec.subareaName, owner:"Personal de Recepción", title:spec.title, description:spec.description,
    context:"Manual operativo de Recepción. Se utiliza información institucional aprobada, trato cordial y trazabilidad de cada atención, derivación o pendiente.",
    closure:"Atención resuelta o correctamente derivada, con responsable, estado y próxima acción cuando corresponda.",
    canvas:{width:1100,height:y + 255}, nodes, edges };
}

const A = (label:string, role?:string): Activity => ({label, role});
const E = (label:string, role?:string): Activity => ({kind:"evidence", label, role});
const D = (label:string, no:string, role?:string, noRole?:string): Decision => ({kind:"decision", label, no, role, noRole});

const receptionSpecs: Spec[] = [
  { code:"REC-AT-001", title:"Atención integral al visitante y participante", description:"Asegura una atención cordial, institucional, trazable y correctamente derivada.", subareaCode:"REC-S01", subareaName:"Atención, orientación e inscripción", stages:[
    A("Abrir puesto, habilitar computadora, verificar material informativo y condiciones básicas de atención"),
    A("Revisar llamadas, correos, WhatsApp, mensajes, notificaciones, avisos y pendientes del turno anterior"),
    D("¿Existen pendientes del turno anterior?", "Priorizar por urgencia, confirmar responsable y mantener la continuidad del caso"),
    A("Leer historial, identificar participante y requerimiento; revisar información institucional relacionada"),
    A("Brindar saludo cordial, trato respetuoso e institucional, sin tuteo"),
    A("Clasificar necesidad: información, inscripción, pago, certificado, documento, reclamo, courier, consulta comercial, orientación académica o incidencia"),
    D("¿Recepción puede resolver con información institucional disponible?", "Derivar al área correspondiente conservando la continuidad; no limitarse a indicar que pregunte en otra área"),
    A("Usar únicamente Aula Virtual, Drive, catálogo vigente, sistema e información aprobada"),
    D("¿Existe sugerencia, comentario o necesidad relevante?", "Continuar la atención y conservar el registro cuando exista oportunidad posterior"),
    E("Registrar sugerencia o insight: curso, ponente, horario, taller, problema recurrente o necesidad observada")
  ]},
  { code:"REC-INS-001", title:"Información e inscripción en Aula Virtual", description:"Orienta con fuentes oficiales y registra directamente al participante en Aula Virtual.", subareaCode:"REC-S01", subareaName:"Atención, orientación e inscripción", stages:[
    A("Identificar curso, diplomado o evento solicitado"),
    A("Consultar catálogo, Drive, Aula Virtual y material institucional vigente"),
    A("Brindar orientación oficial y resolver consultas"),
    D("¿El interesado desea inscribirse?", "Cerrar atención dejando información clara para una decisión posterior"),
    D("¿La información necesaria para registrar al participante está completa?", "Solicitar información faltante antes de registrar"),
    A("Ingresar al Aula Virtual y registrar la inscripción"),
    D("¿El sistema confirma el registro?", "Registrar incidencia, derivar a Sistemas o al área correspondiente y mantener atención pendiente"),
    E("Confirmar inscripción y orientación final al participante")
  ]},
  { code:"REC-CER-001", title:"Entrega de certificados", description:"Entrega solo certificados disponibles y deja trazabilidad física, digital y académica.", subareaCode:"REC-S02", subareaName:"Caja, pagos y certificados", stages:[
    A("Identificar participante, curso o diplomado y certificado solicitado"),
    A("Consultar Drive, Aula Virtual y base correspondiente"),
    D("¿El certificado está disponible físicamente en oficina?", "Informar que aún no corresponde entrega y registrar o mantener el seguimiento"),
    D("¿Recoge el titular?", "Verificar que el tercero esté autorizado; si no lo está, no entregar y solicitar regularización"),
    A("Verificar identidad conforme al procedimiento interno"),
    A("Entregar certificado e identificar si tiene auspicio universitario"),
    E("Registrar entrega y firma en el Cuaderno de Cargo de Entrega de Certificados"),
    A("Registrar como entregado en sistema o base y actualizar herramienta compartida con Académica"),
    D("¿La entrega quedó registrada correctamente?", "Regularizar el registro antes de cerrar")
  ]},
  { code:"REC-INF-001", title:"Control de información institucional vigente", description:"Evita que Recepción entregue información desactualizada sobre eventos y programas.", subareaCode:"REC-S01", subareaName:"Atención, orientación e inscripción", stages:[
    A("Abrir fuente institucional: Drive, red o catálogo"),
    A("Ubicar evento del mes vigente"),
    D("¿La información está disponible?", "Solicitar o coordinar información con el área propietaria y mantener la consulta pendiente"),
    D("¿La información está vigente?", "Identificar pieza, catálogo, fecha o contenido a actualizar y coordinar con Diseño o área correspondiente"),
    A("Brindar información validada"),
    A("Mensualmente verificar catálogos virtuales"),
    D("¿Existen catálogos desactualizados?", "Coordinar actualización con el área propietaria")
  ]},
  { code:"REC-OLV-001", title:"Gestión de Olva Courier", description:"Controla envíos quincenales, devoluciones y reenvíos con información actualizada.", subareaCode:"REC-S03", subareaName:"Gestión documentaria y courier", stages:[
    A("Registrar llegada del personal de Olva Courier"),
    D("¿La operación es envío programado?", "Recibir envío devuelto, identificar participante y contactar inmediatamente"),
    A("Comunicar llegada a áreas correspondientes y facilitar entrega de envíos programados"),
    E("Registrar datos en Drive y cuaderno OLVA; mantener programación de envíos cada 15 días"),
    A("Para devolución, coordinar nueva fecha de envío y actualizar Drive y cuaderno OLVA"),
    D("¿Se logró contactar al participante?", "Dejar próxima acción y reportar al siguiente turno")
  ]},
  { code:"REC-WSP-001", title:"Atención por WhatsApp y postventa", description:"Mantiene continuidad de conversaciones, atención clara y derivación trazable por WhatsApp.", subareaCode:"REC-S04", subareaName:"Atención digital y experiencia", stages:[
    A("Abrir WhatsApp asignado y revisar el historial completo"),
    A("Identificar tipo: interesado, participante, postventa o incidencia"),
    D("¿Es interesado?", "Atender participante o postventa y derivar según la naturaleza de la consulta"),
    A("Responder de forma puntual, clara y con ortografía revisada; solicitar teléfono y correo cuando corresponda"),
    D("¿La carga operativa permite apoyo comercial?", "Registrar o derivar para asegurar continuidad comercial"),
    A("Realizar seguimiento de consultas, necesidades, experiencia y oportunidades de mejora"),
    D("¿Puede resolverse en Recepción?", "Derivar al área correspondiente sin cerrar el historial"),
    D("¿Queda algo pendiente?", "Registrar para el turno siguiente")
  ]},
  { code:"REC-RS-001", title:"Atención y prospección en redes sociales", description:"Gestiona contactos y oportunidades en redes con frecuencias y límites definidos por el manual.", subareaCode:"REC-S04", subareaName:"Atención digital y experiencia", stages:[
    A("Identificar interesados, grupos, publicaciones y eventos"),
    A("Enviar solicitudes de amistad: máximo 10 por día por cuenta"),
    A("Compartir Fan Page, eventos asignados e información a contactos: máximo 10 envíos por día"),
    D("¿Corresponde publicación de interacción del evento?", "Continuar con la revisión diaria"),
    A("Verificar frecuencia: máximo dos publicaciones por semana por evento"),
    A("Compartir eventos en grupos relacionados y revisar comentarios, Inbox y solicitudes"),
    D("¿Existe interesado?", "Cerrar revisión diaria"),
    E("Solicitar datos y derivar al flujo de atención digital e inscripción")
  ]},
  { code:"REC-REL-001", title:"Relevo de turno, equipos y activos", description:"Transfiere pendientes, caja, equipos, celulares, llaves y condiciones del puesto de forma controlada.", subareaCode:"REC-S05", subareaName:"Operación y continuidad", stages:[
    A("Identificar y clasificar pendientes: cliente, pago, certificado, WhatsApp, documentos, courier, equipo o stock"),
    E("Comunicar pendientes verbalmente y por escrito en el grupo general; Recepción 2 coordina relevo y envía reporte"),
    A("Recepción 1 permanece en caja hasta concluir cuadre"),
    A("Verificar computadora, impresora, periféricos, 11 celulares y 4 juegos de llaves"),
    D("¿Existe incidencia o daño?", "Registrar, comunicar y derivar según tipo; mantener pendiente trazable"),
    A("Dejar equipos limpios y ordenados"),
    D("¿Es cierre de jornada?", "Entregar turno con pendientes trazables"),
    E("Apagar computadora e impresora, luego estabilizador; confirmar turno entregado")
  ]},
  { code:"REC-STK-001", title:"Control de stock e insumos de Recepción", description:"Verifica materiales, chaquetas e insumos de atención y genera requisiciones oportunas.", subareaCode:"REC-S05", subareaName:"Operación y continuidad", stages:[
    A("Verificar materiales necesarios"),
    D("¿Es viernes?", "Continuar control diario de materiales"),
    A("Preparar requisición y enviarla por correo a Logística"),
    A("Verificar stock de chaquetas por dama, caballero y tallas de mayor rotación"),
    D("¿Existe riesgo de faltante?", "Incluir necesidad en la requisición"),
    A("Verificar café, azúcar, vasos, cucharitas, palillos y servilletas"),
    D("¿Hay al menos tres paquetes de vasos?", "Solicitar reposición"),
    E("Limpiar y ordenar carrito; higienizar hervidora y confirmar abastecimiento")
  ]},
  { code:"REC-FDS-001", title:"Atención presencial de fin de semana", description:"Coordina atención, pagos, orientación, afluencia y vacantes durante cursos y diplomados.", subareaCode:"REC-S05", subareaName:"Operación y continuidad", stages:[
    A("Preparar sencillo en caja, mantener Drive o base abierto y consultar calendario académico en Aula Virtual"),
    A("Identificar cursos, diplomados, auditorios y horarios del día"),
    A("Recibir cordialmente al participante e indicar auditorio"),
    D("¿Debe realizar pago?", "Continuar orientación al participante"),
    A("Ejecutar proceso de caja y validar relación de participantes pagados cuando corresponda"),
    D("¿Existe alta afluencia?", "Continuar atención según capacidad"),
    A("Coordinar con Académica y verificar vacantes"),
    D("¿Existe vacante?", "Informar condición de capacidad según indicación Académica"),
    E("Al cierre o relevo, reportar pendientes y realizar cuadre")
  ]},
  { code:"REC-CAJ-001", title:"Caja, pagos y cuadre", description:"Controla pagos presenciales, efectivo, POS, comprobantes y cierre de caja.", subareaCode:"REC-S02", subareaName:"Caja, pagos y certificados", stages:[
    A("Acceder al sistema de caja en Recepción 1 y recibir solicitud de pago"),
    A("Verificar importe"),
    D("¿El pago es en efectivo?", "Procesar pago con POS Niubiz según procedimiento"),
    A("Contar dinero con concentración"),
    D("¿Existe billete de S/200?", "Aplicar restricciones de sencillo y continuar validación de efectivo"),
    A("Validar billete con plumón, detector u otro medio disponible"),
    D("¿El billete es válido?", "No aceptar y solicitar otro medio de pago"),
    D("¿La transacción POS fue aprobada?", "Informar e intentar según procedimiento o autorización; no registrar como cobrado sin aprobación"),
    A("Registrar pago en sistema y emitir boleta o factura"),
    D("¿La atención es presencial?", "Enviar comprobante por correo"),
    A("Entregar comprobante físico y asegurar que Recepción 1 no quede sola durante la operación"),
    A("Realizar cierre y cuadre de caja"),
    D("¿La caja cuadra?", "Revisar movimientos, efectivo, POS y comprobantes; reportar diferencia conforme al procedimiento interno"),
    E("Registrar o entregar cuadre")
  ]},
  { code:"REC-SR-001", title:"Sugerencias y reclamos", description:"Registra, deriva, da seguimiento y cierra sugerencias o reclamos con evidencia de atención.", subareaCode:"REC-S04", subareaName:"Atención digital y experiencia", stages:[
    A("Abrir Drive de sugerencias y reclamos"),
    A("Registrar fecha, nombre, curso o diplomado, teléfono, motivo y detalle"),
    D("¿Recepción puede dar solución inmediata?", "Derivar a Coordinación o área correspondiente"),
    A("Registrar respuesta o derivación"),
    A("Área responsable analiza y coordina descargo o solución"),
    E("Registrar observaciones, solución y nombre de quien atendió"),
    D("¿El caso fue atendido?", "Mantener pendiente y realizar seguimiento")
  ]},
  { code:"REC-MP-001", title:"Mesa de partes y documentos externos", description:"Registra, deriva y conserva trazabilidad de documentos externos recibidos.", subareaCode:"REC-S03", subareaName:"Gestión documentaria y courier", stages:[
    A("Identificar remitente, destinatario o área y tipo de documento"),
    A("Ubicar Cuaderno de Cargo en Recepción 1 y registrar documento recibido"),
    D("¿Se identifica claramente el área destinataria?", "Solicitar orientación o identificación interna antes de derivar"),
    A("Derivar al área correspondiente"),
    D("¿La entrega requiere evidencia de recepción interna?", "Conservar o archivar según trámite y dejar trazabilidad disponible"),
    E("Conservar evidencia de la derivación y cierre del trámite")
  ]},
  { code:"REC-CH-001", title:"Cambio de turno y cierre de jornada", description:"Es el control transversal para asegurar continuidad operativa al cambio de turno o cierre diario.", subareaCode:"REC-S05", subareaName:"Operación y continuidad", stages:[
    A("Revisar caja y POS"),
    D("¿Corresponde cuadre?", "Reportar condición y continuar con el control"),
    A("Realizar o reportar cuadre"),
    A("Informar pendientes verbalmente y por grupo general"),
    A("Verificar celulares, llaves, WhatsApp, llamadas, mensajes y canales de atención"),
    A("Dejar disponibles Drive, bases e información necesaria; verificar equipos"),
    D("¿Existe incidencia de equipo?", "Registrar o reportar incidencia"),
    D("¿Es cierre de jornada?", "Continuar con entrega de turno"),
    A("Apagar correctamente computadora e impresora, luego estabilizador"),
    A("Verificar stock, insumos y requisiciones"),
    D("¿Existe pendiente que afectará al siguiente turno?", "Confirmar descripción, responsable o área, estado y próxima acción"),
    E("Confirmar cambio de turno")
  ]},
];

export default receptionSpecs.map(buildFlow);
