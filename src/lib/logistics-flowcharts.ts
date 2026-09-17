import type { MarketingFlowchart } from "./marketing-flowcharts";

type Step = { label: string; role: string; kind?: "activity" | "decision" | "evidence" };

const palette = {
  start: ["#e8f8f2", "#13795b"],
  activity: ["#fff7e3", "#b77900"],
  decision: ["#fff4cc", "#b77900"],
  evidence: ["#f4f7fa", "#52616b"],
  end: ["#e8f8f2", "#13795b"],
} as const;

function flow(code: string, title: string, description: string, steps: Step[]): MarketingFlowchart {
  const node = (id: string, kind: "start" | "activity" | "decision" | "evidence" | "end", label: string, role: string, position: { x: number; y: number }) => {
    const [fill, stroke] = palette[kind];
    return { id, kind, label, role, position, size: { width: kind === "decision" ? 420 : 480, height: 72 }, fill, stroke, textColor: "#243447" };
  };
  const nodes = [
    node(`${code}-start`, "start", "Inicio del proceso", "LOGÍSTICA", { x: 300, y: 30 }),
    ...steps.map((step, index) => node(`${code}-${index + 1}`, step.kind ?? "activity", step.label, step.role, { x: 170, y: 145 + index * 125 })),
    node(`${code}-end`, "end", "Proceso cerrado con trazabilidad", "LOGÍSTICA", { x: 300, y: 145 + steps.length * 125 }),
  ];
  const edges = nodes.slice(0, -1).map((item, index) => ({
    id: `${code}-edge-${index + 1}`,
    source: item.id,
    target: nodes[index + 1].id,
    label: "",
    route: "normal" as const,
    sourceHandle: "bottom" as const,
    targetHandle: "top" as const,
  }));
  return { code, sourceId: code, subareaCode: "LOG", subareaName: "Logística", owner: "Jefatura de Logística", title, description, context: "MOF Área Logística Rebagliati 2026. Documento técnico propuesto; requiere validación de Gerencia antes de entrar en vigencia.", closure: "Resultado documentado en el sistema de gestión logística.", canvas: { width: 850, height: 260 + steps.length * 125 }, nodes, edges };
}

const logisticsData: MarketingFlowchart[] = [
  flow("LOG-P01", "Requerimiento y planificación de eventos", "Planifica la demanda, capacidad, reservas y liberación de picking para cada evento.", [
    { label: "Programación Académica comparte eventos del mes actual y siguiente", role: "PROGRAMACIÓN ACADÉMICA" },
    { label: "Coordinación Académica emite requerimiento base antes del día 15", role: "COORDINACIÓN ACADÉMICA" },
    { label: "Valida fecha, aforo, sala, práctica, equipos, estaciones y responsable", role: "JEFE DE LOGÍSTICA" },
    { label: "Consolida demanda, capacidad y complejidad por evento", role: "LOGÍSTICA" },
    { label: "Consulta stock físico, reservado, disponible, vencimientos y equipos operativos", role: "ALMACÉN" },
    { label: "¿El stock es suficiente y operativo?", role: "CONTROL", kind: "decision" },
    { label: "Genera requerimiento de compra, reposición o mantenimiento cuando corresponda", role: "JEFE DE LOGÍSTICA" },
    { label: "Reserva stock por evento, genera checklist y congela cambios D-7", role: "LOGÍSTICA" },
    { label: "Libera picking según prioridad, fecha y ruta de almacén", role: "ALMACÉN" },
    { label: "Evento abastecido con trazabilidad", role: "EVIDENCIA", kind: "evidence" },
  ]),
  flow("LOG-P02", "Proceso de compras", "Gestiona compras desde la necesidad validada hasta el cierre y evaluación del proveedor.", [
    { label: "Necesidad validada de compra, reposición o servicio", role: "LOGÍSTICA" },
    { label: "Emite requerimiento de compra: descripción, cantidad, UM, especificación, fecha y centro de costo", role: "JEFE DE LOGÍSTICA" },
    { label: "Obtiene aprobación por presupuesto y nivel de autoridad", role: "GERENCIA / FINANZAS" },
    { label: "Solicita dos o tres cotizaciones y compara precio, calidad, plazo, garantía y comprobante", role: "LOGÍSTICA" },
    { label: "Selecciona proveedor homologado y emite orden de compra", role: "JEFE DE LOGÍSTICA" },
    { label: "Confirma entrega y da seguimiento a alertas", role: "LOGÍSTICA" },
    { label: "Recepciona y valida orden, guía, cantidad, estado y especificación", role: "ALMACÉN" },
    { label: "¿La recepción es conforme?", role: "CONTROL", kind: "decision" },
    { label: "Registra ingreso, costo, lote, vencimiento y ubicación; o rechaza y solicita reposición", role: "ALMACÉN" },
    { label: "Envía expediente completo a Finanzas y evalúa al proveedor", role: "LOGÍSTICA / FINANZAS", kind: "evidence" },
  ]),
  flow("LOG-P03", "Recepción, almacenamiento e inventario", "Mantiene identificado, conservado y disponible el inventario para la operación.", [
    { label: "Recepción conforme de bienes y materiales", role: "ALMACÉN" },
    { label: "Identifica SKU, familia, unidad, lote, vencimiento, costo y estado", role: "ALMACÉN" },
    { label: "Clasifica consumible, reutilizable, equipo, promocional o muestra", role: "ALMACÉN" },
    { label: "Asigna almacén, zona, estante, nivel, posición y etiqueta", role: "ALMACÉN" },
    { label: "Aplica FEFO/FIFO y condiciones de conservación", role: "ALMACÉN" },
    { label: "Registra el ingreso en SIGELOG/Kardex", role: "ALMACÉN" },
    { label: "Monitorea stock mínimo, reservas, vencimientos, antigüedad, mantenimiento y diferencias", role: "JEFE DE LOGÍSTICA" },
    { label: "¿Existe alerta o diferencia?", role: "CONTROL", kind: "decision" },
    { label: "Gestiona reposición, conteo, cuarentena, mantenimiento o ajuste autorizado", role: "LOGÍSTICA" },
    { label: "Stock disponible y reservable", role: "EVIDENCIA", kind: "evidence" },
  ]),
  flow("LOG-P04", "Picking, packing y operación de evento", "Prepara y opera los recursos de un evento con doble verificación y cierre D+1.", [
    { label: "Checklist liberado entre D-3 y D-2", role: "LOGÍSTICA" },
    { label: "Realiza picking por código, ubicación, cantidad y criterio FEFO/FIFO", role: "ALMACÉN" },
    { label: "Verificación 1: SKU, cantidad, unidad, estado y vencimiento", role: "ALMACÉN" },
    { label: "Prueba equipos, accesorios, cables, baterías y energía", role: "SOPORTE LOGÍSTICO" },
    { label: "Realiza packing por cubeta, estación, piso y secuencia", role: "ALMACÉN" },
    { label: "Rotula evento, fecha, sala, responsable y orden de montaje", role: "LOGÍSTICA" },
    { label: "Verificación 2 D-1 con Logística y Coordinación Académica", role: "LOGÍSTICA / ACADÉMICA" },
    { label: "Traslada, monta, prueba el ambiente, da soporte y repone de forma autorizada", role: "OPERACIÓN DE EVENTO" },
    { label: "Cierre D+1: consumo real, limpieza, reubicación, mantenimiento, diferencias y KPI", role: "LOGÍSTICA", kind: "evidence" },
  ]),
  flow("LOG-P05", "Logística inversa", "Recupera, clasifica, concilia y registra los recursos al término de cada evento.", [
    { label: "Retorno de materiales y equipos desde el evento", role: "OPERACIÓN DE EVENTO" },
    { label: "Realiza conteo preliminar y compara con el checklist", role: "ALMACÉN" },
    { label: "Segrega por condición y registra evidencia", role: "ALMACÉN" },
    { label: "Clasifica: no usado íntegro, usado reutilizable, dañado/incompleto o consumido/descartable", role: "ALMACÉN" },
    { label: "Reingresa y reubica; limpia y desinfecta; pone en cuarentena o gestiona mantenimiento/baja", role: "ALMACÉN" },
    { label: "Registra consumo y salida en Kardex", role: "ALMACÉN" },
    { label: "Concilia diferencias, valoriza pérdidas y asigna acciones", role: "JEFE DE LOGÍSTICA" },
    { label: "Actualiza SIGELOG, mantenimiento, stock y costo", role: "LOGÍSTICA" },
    { label: "Checklist cerrado e incidencia comunicada", role: "EVIDENCIA", kind: "evidence" },
  ]),
  flow("LOG-P06", "Operación de sábado y domingo", "Define la cobertura de fin de semana según carga, simultaneidad y complejidad de eventos.", [
    { label: "Jueves: cierra el plan de fin de semana con eventos, horarios, pisos, aforos y complejidad", role: "JEFE DE LOGÍSTICA" },
    { label: "Calcula carga: simple 1, medio 2, alto 3; suma simultaneidad y traslado", role: "JEFE DE LOGÍSTICA" },
    { label: "¿Hay más de 5 puntos o tres o más eventos simultáneos?", role: "CONTROL", kind: "decision" },
    { label: "Aplica cobertura estándar: Jefe de Logística + apoyo", role: "LOGÍSTICA" },
    { label: "Cuando supera la carga, activa apoyo temporal, redistribuye y preposiciona recursos", role: "JEFE DE LOGÍSTICA" },
    { label: "Viernes: picking terminado, equipos probados y cubetas selladas", role: "ALMACÉN" },
    { label: "Sábado y domingo: montaje, rondas, soporte, reposición y reporte", role: "OPERACIÓN DE EVENTO" },
    { label: "Domingo: retorno, conteo y segregación", role: "ALMACÉN" },
    { label: "Lunes D+1: cierra consumo, diferencias, reposición, mantenimiento y KPI", role: "JEFE DE LOGÍSTICA", kind: "evidence" },
  ]),
];

export default logisticsData;
