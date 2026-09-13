"use client";

import { CSSProperties, useCallback, useMemo, useState, useSyncExternalStore } from "react";
import {
  addEdge,
  Background,
  BackgroundVariant,
  Connection,
  Controls,
  Edge,
  Handle,
  MarkerType,
  MiniMap,
  Node,
  NodeProps,
  Position,
  ReactFlow,
  ReactFlowInstance,
  Viewport,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Box, Circle, Diamond, FileText, GitBranch, Link2, RotateCcw, Save, Trash2, X } from "lucide-react";
import type { Area, Subarea } from "@/lib/data";
import type { MarketingFlowchart } from "@/lib/marketing-flowcharts";

type NodeKind = "start" | "activity" | "decision" | "evidence" | "exception" | "end";
type EdgeRoute = "normal" | "return";

type RebaNodeData = { label: string; role: string; kind: NodeKind; fill?: string; stroke?: string; textColor?: string };
type RebaNode = Node<RebaNodeData, "reba">;
type RebaEdge = Edge<{ route: EdgeRoute }>;
type FlowGraph = { version: 2; nodes: RebaNode[]; edges: RebaEdge[]; viewport?: Viewport };

const nodeTypes = { reba: RebaFlowNode };
const defaultViewport: Viewport = { x: 0, y: 0, zoom: 1 };
const nodeColors: Record<NodeKind, string> = { start: "#0f766e", activity: "#5653a6", decision: "#b77900", evidence: "#52616b", exception: "#b42318", end: "#2e7d32" };

function numericSize(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function nodeDimensions(kind: NodeKind, label = "", role = "", preferredWidth?: number) {
  const baseWidth = kind === "decision" ? 300 : kind === "exception" ? 320 : kind === "start" || kind === "end" ? 230 : 250;
  const maxWidth = kind === "decision" || kind === "exception" ? 540 : 440;
  const textLength = label.replace(/\s+/g, " ").trim().length;
  const responsiveWidth = baseWidth + Math.max(0, textLength - 42) * 1.7;
  const width = Math.round(Math.min(maxWidth, Math.max(baseWidth, preferredWidth ?? 0, responsiveWidth)));
  const usableWidth = width * (kind === "decision" ? 0.68 : kind === "exception" ? 0.78 : kind === "start" || kind === "end" ? 0.82 : 1) - 36;
  const charactersPerLine = Math.max(18, Math.floor(usableWidth / 5.6));
  const labelLines = Math.max(1, Math.ceil(textLength / charactersPerLine));
  const roleHeight = role.trim() ? 16 : 0;
  const contentHeight = 20 + roleHeight + labelLines * 14;
  const minimumHeight = kind === "decision" ? 72 : kind === "exception" ? 64 : kind === "start" || kind === "end" ? 54 : 58;
  return { width, height: Math.max(minimumHeight, contentHeight) };
}

function fitNodeBox(kind: NodeKind, label: string, role: string, position: { x: number; y: number }, currentStyle?: RebaNode["style"]) {
  const currentWidth = numericSize(currentStyle?.width, nodeDimensions(kind).width);
  const currentHeight = numericSize(currentStyle?.height, nodeDimensions(kind).height);
  const style = nodeDimensions(kind, label, role, currentWidth);
  return {
    style,
    position: {
      x: position.x + (currentWidth - style.width) / 2,
      y: position.y + (currentHeight - style.height) / 2,
    },
  };
}

function RebaFlowNode({ data, selected }: NodeProps<RebaNode>) {
  const customColors = data.fill ? {
    "--node-fill": data.fill,
    "--node-stroke": data.stroke ?? "#5653a6",
    "--node-text": data.textColor ?? "#243447",
  } as CSSProperties : undefined;
  return <div className={`xy-node node-${data.kind} ${selected ? "selected" : ""}`} style={customColors}>
    <Handle className="xy-handle" type="target" position={Position.Top}/>
    <Handle className="xy-handle xy-handle-left" id="left" type="source" position={Position.Left}/>
    <div className="xy-node-content">{data.role && <small>{data.role}</small>}<strong>{data.label}</strong></div>
    <Handle className="xy-handle" id="bottom" type="source" position={Position.Bottom}/>
    <Handle className="xy-handle xy-handle-right" id="right" type="source" position={Position.Right}/>
  </div>;
}

function makeEdge(id: string, source: string, target: string, route: EdgeRoute = "normal", label = "", sourceHandle?: string | null): RebaEdge {
  const color = route === "return" ? "#c0392b" : "#52616b";
  return {
    id, source, target, sourceHandle, type: "smoothstep", label, data: { route },
    style: { stroke: color, strokeWidth: route === "return" ? 2.4 : 1.8, strokeDasharray: route === "return" ? "7 4" : undefined },
    labelStyle: { fill: color, fontWeight: 800, fontSize: 11 },
    labelBgStyle: { fill: "#ffffff", fillOpacity: 0.92 },
    markerEnd: { type: MarkerType.ArrowClosed, color, width: 18, height: 18 },
  };
}

function buildInitialGraph(subarea: Subarea, imported?: MarketingFlowchart): FlowGraph {
  if (imported) {
    return {
      version: 2,
      nodes: imported.nodes.map((node) => {
        const box = fitNodeBox(node.kind, node.label, node.role, node.position, node.size);
        return {
          id: node.id,
          type: "reba",
          position: box.position,
          data: { kind: node.kind, label: node.label, role: node.role, fill: node.fill, stroke: node.stroke, textColor: node.textColor },
          style: box.style,
        };
      }),
      edges: imported.edges.map((edge) => makeEdge(edge.id, edge.source, edge.target, edge.route, edge.label, edge.sourceHandle)),
    };
  }
  const x = 430;
  const nodes: RebaNode[] = [
    { id: "start", type: "reba", position: { x, y: 30 }, data: { kind: "start", label: `Inicio: ${subarea.name}`, role: subarea.owner }, style: nodeDimensions("start", `Inicio: ${subarea.name}`, subarea.owner) },
    ...subarea.flow.map((label, index) => ({ id: `step-${index + 1}`, type: "reba" as const, position: { x, y: 150 + index * 145 }, data: { kind: "activity" as const, label, role: subarea.owner }, style: nodeDimensions("activity", label, subarea.owner) })),
    { id: "end", type: "reba", position: { x, y: 150 + subarea.flow.length * 145 }, data: { kind: "end", label: "Fin: actividad cerrada y evidenciada", role: "Resultado" }, style: nodeDimensions("end", "Fin: actividad cerrada y evidenciada", "Resultado") },
  ];
  const edges = nodes.slice(0, -1).map((node, index) => makeEdge(`edge-${index + 1}`, node.id, nodes[index + 1].id));
  return { version: 2, nodes, edges };
}

function migrateGraph(value: string | null, fallback: FlowGraph): FlowGraph {
  if (!value) return fallback;
  try {
    const raw = JSON.parse(value) as { nodes?: Array<Record<string, unknown>>; edges?: Array<Record<string, unknown>>; viewport?: Viewport };
    if (!Array.isArray(raw.nodes) || !Array.isArray(raw.edges)) return fallback;
    const nodes: RebaNode[] = raw.nodes.map((item, index) => {
      const data = item.data as Partial<RebaNodeData> | undefined;
      const legacyKind = typeof item.type === "string" && item.type !== "reba" ? item.type as NodeKind : undefined;
      const kind = data?.kind ?? legacyKind ?? "activity";
      const position = item.position as { x?: number; y?: number } | undefined;
      const label = data?.label ?? String(item.label ?? "Actividad");
      const role = data?.role ?? String(item.role ?? "Responsable");
      const positionValue = { x: position?.x ?? (typeof item.x === "number" ? item.x : 90 + (index % 3) * 310), y: position?.y ?? (typeof item.y === "number" ? item.y : 80 + Math.floor(index / 3) * 145) };
      const currentStyle = item.style && typeof item.style === "object" ? item.style as RebaNode["style"] : undefined;
      const box = fitNodeBox(kind, label, role, positionValue, currentStyle);
      return {
        id: String(item.id ?? `node-${index + 1}`), type: "reba",
        position: box.position,
        data: { kind, label, role, fill: data?.fill, stroke: data?.stroke, textColor: data?.textColor },
        style: box.style,
      };
    });
    const edges = raw.edges.map((item, index) => {
      const data = item.data as { route?: EdgeRoute } | undefined;
      const route = data?.route ?? (item.route === "return" ? "return" : "normal");
      return makeEdge(String(item.id ?? `edge-${index + 1}`), String(item.source ?? item.from ?? ""), String(item.target ?? item.to ?? ""), route, typeof item.label === "string" ? item.label : "", typeof item.sourceHandle === "string" ? item.sourceHandle : null);
    }).filter((edge) => edge.source && edge.target);
    return { version: 2, nodes, edges, viewport: raw.viewport };
  } catch {
    return fallback;
  }
}

function FlowchartCanvas({ area, subarea, flowCode, flowTitle, initialGraph, storageKey, onClose, embedded = false }: { area: Area; subarea: Subarea; flowCode: string; flowTitle: string; initialGraph: FlowGraph; storageKey: string; onClose?: () => void; embedded?: boolean }) {
  const [nodes, setNodes, onNodesChange] = useNodesState<RebaNode>(initialGraph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<RebaEdge>(initialGraph.edges);
  const [instance, setInstance] = useState<ReactFlowInstance<RebaNode, RebaEdge> | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [notice, setNotice] = useState("Arrastra el lienzo, usa la rueda para acercar y une los puntos de conexión.");
  const [dirty, setDirty] = useState(false);
  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? null;
  const selectedEdge = edges.find((edge) => edge.id === selectedEdgeId) ?? null;

  const markDirty = useCallback(() => setDirty(true), []);
  const handleNodesChange = useCallback((changes: Parameters<typeof onNodesChange>[0]) => {
    onNodesChange(changes);
    if (changes.some((change) => change.type !== "select" && change.type !== "dimensions")) markDirty();
  }, [onNodesChange, markDirty]);
  const handleEdgesChange = useCallback((changes: Parameters<typeof onEdgesChange>[0]) => {
    onEdgesChange(changes);
    if (changes.some((change) => change.type !== "select")) markDirty();
  }, [onEdgesChange, markDirty]);

  const onConnect = useCallback((connection: Connection) => {
    setEdges((current) => addEdge(makeEdge(`edge-${Date.now()}`, connection.source, connection.target, "normal", "", connection.sourceHandle), current));
    setDirty(true);
    setNotice("Conexión creada. Selecciona la línea para añadir Sí/No o marcarla como retorno.");
  }, [setEdges]);

  const addNode = (kind: NodeKind) => {
    const labels: Record<NodeKind, string> = { start: "Inicio del proceso", activity: "Nueva actividad", decision: "¿Decisión?", evidence: "Evidencia o documento", exception: "Excepción o escalamiento", end: "Fin del proceso" };
    const center = instance?.screenToFlowPosition({ x: window.innerWidth * 0.48, y: window.innerHeight * 0.48 }) ?? { x: 250, y: 180 };
    const id = `node-${Date.now()}`;
    const node: RebaNode = { id, type: "reba", position: center, data: { kind, label: labels[kind], role: subarea.owner }, style: nodeDimensions(kind, labels[kind], subarea.owner), selected: true };
    setNodes((current) => [...current.map((item) => ({ ...item, selected: false })), node]);
    setSelectedNodeId(id); setSelectedEdgeId(null); setDirty(true);
    setNotice("Cuadro añadido. Edita su contenido en el panel derecho y conéctalo desde sus puntos.");
  };

  const updateSelectedNode = (patch: Partial<RebaNodeData>) => {
    if (!selectedNodeId) return;
    setNodes((current) => current.map((node) => {
      if (node.id !== selectedNodeId) return node;
      const data = { ...node.data, ...patch };
      const box = fitNodeBox(data.kind, data.label, data.role, node.position, node.style);
      return { ...node, data, position: box.position, style: box.style };
    }));
    setDirty(true);
  };

  const updateSelectedEdge = (patch: { label?: string; route?: EdgeRoute }) => {
    if (!selectedEdgeId) return;
    setEdges((current) => current.map((edge) => edge.id === selectedEdgeId ? makeEdge(edge.id, edge.source, edge.target, patch.route ?? edge.data?.route ?? "normal", patch.label ?? String(edge.label ?? ""), edge.sourceHandle) : edge));
    setDirty(true);
  };

  const removeSelection = () => {
    if (selectedNodeId) {
      setNodes((current) => current.filter((node) => node.id !== selectedNodeId));
      setEdges((current) => current.filter((edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId));
      setSelectedNodeId(null);
    } else if (selectedEdgeId) {
      setEdges((current) => current.filter((edge) => edge.id !== selectedEdgeId));
      setSelectedEdgeId(null);
    }
    setDirty(true);
  };

  const restoreTemplate = () => {
    setNodes(initialGraph.nodes); setEdges(initialGraph.edges); setSelectedNodeId(null); setSelectedEdgeId(null); setDirty(true);
    window.setTimeout(() => instance?.fitView({ padding: 0.16, duration: 350 }), 0);
    setNotice("Plantilla restaurada. Presiona Guardar para confirmar el cambio.");
  };

  const save = () => {
    const flow = instance?.toObject();
    const graph: FlowGraph = { version: 2, nodes, edges, viewport: flow?.viewport };
    window.localStorage.setItem(storageKey, JSON.stringify(graph));
    window.dispatchEvent(new Event(storageKey));
    setDirty(false); setNotice("Flujograma guardado en este navegador.");
  };

  return <div className={`flowchart-modal${embedded ? " flowchart-embedded" : ""}`} role={embedded ? "region" : "dialog"} aria-modal={embedded ? undefined : true} aria-label={`Editor de ${flowTitle}`}>
    <div className="flowchart-editor-shell">
      <header className="flowchart-editor-head">
        <div className="flowchart-title-mark" style={{ background: area.color }}>{area.code}</div>
        <div><span>{area.name} · {subarea.name} · {flowCode}</span><h2>{flowTitle}</h2></div>
        <div className="flowchart-save-state">{dirty ? <><i/> Cambios sin guardar</> : <><i className="saved"/> Guardado</>}</div>
        {!embedded && <button className="icon-button" aria-label="Cerrar editor" onClick={onClose}><X size={21}/></button>}
      </header>

      <div className="flowchart-toolbar" aria-label="Herramientas del flujograma">
        <button onClick={() => addNode("activity")}><Box size={16}/> Actividad</button>
        <button onClick={() => addNode("decision")}><Diamond size={16}/> Decisión</button>
        <button onClick={() => addNode("start")}><Circle size={16}/> Inicio</button>
        <button onClick={() => addNode("end")}><Circle size={16}/> Fin</button>
        <button onClick={() => addNode("evidence")}><FileText size={16}/> Evidencia</button>
        <span className="toolbar-divider"/>
        <span className="xy-connect-tip"><Link2 size={15}/> Arrastra entre los puntos para conectar</span>
        <button disabled={!selectedNodeId && !selectedEdgeId} onClick={removeSelection}><Trash2 size={16}/> Eliminar</button>
        <button onClick={restoreTemplate}><RotateCcw size={16}/> Restaurar</button>
        <button className="toolbar-save" onClick={save}><Save size={16}/> Guardar</button>
      </div>

      <div className="flowchart-workspace">
        <div className="xyflow-canvas">
          <ReactFlow<RebaNode, RebaEdge>
            nodes={nodes} edges={edges} nodeTypes={nodeTypes}
            onNodesChange={handleNodesChange} onEdgesChange={handleEdgesChange} onConnect={onConnect} onInit={setInstance}
            onNodeClick={(_, node) => { setSelectedNodeId(node.id); setSelectedEdgeId(null); }}
            onEdgeClick={(_, edge) => { setSelectedEdgeId(edge.id); setSelectedNodeId(null); }}
            onPaneClick={() => { setSelectedNodeId(null); setSelectedEdgeId(null); }}
            defaultViewport={initialGraph.viewport ?? defaultViewport} fitView={!initialGraph.viewport} fitViewOptions={{ padding: 0.16, maxZoom: 1.1 }}
            minZoom={0.18} maxZoom={2.4} snapToGrid snapGrid={[16, 16]} selectionOnDrag deleteKeyCode={["Backspace", "Delete"]} multiSelectionKeyCode={["Meta", "Control"]}
          >
            <Background variant={BackgroundVariant.Dots} gap={18} size={1.4} color="#cfd7e2"/>
            <Controls position="bottom-left" showInteractive={false}/>
            <MiniMap position="bottom-right" pannable zoomable nodeColor={(node) => (node.data as RebaNodeData).fill ?? nodeColors[(node.data as RebaNodeData).kind]} maskColor="rgba(240,243,248,.72)"/>
          </ReactFlow>
        </div>

        <aside className="flowchart-properties">
          <div className="properties-head"><GitBranch size={16}/><div><strong>Propiedades</strong><span>Edita el elemento seleccionado</span></div></div>
          {selectedNode ? <div className="properties-form">
            <label><span>Tipo de cuadro</span><select value={selectedNode.data.kind} onChange={(event) => updateSelectedNode({ kind: event.target.value as NodeKind })}><option value="activity">Actividad</option><option value="decision">Decisión</option><option value="start">Inicio</option><option value="end">Fin</option><option value="evidence">Evidencia</option><option value="exception">Excepción</option></select></label>
            <label><span>Responsable / carril</span><input value={selectedNode.data.role} onChange={(event) => updateSelectedNode({ role: event.target.value })}/></label>
            <label><span>Texto del cuadro</span><textarea rows={5} value={selectedNode.data.label} onChange={(event) => updateSelectedNode({ label: event.target.value })}/></label>
            <button className="button button-secondary danger-button" onClick={removeSelection}><Trash2 size={15}/> Eliminar cuadro</button>
          </div> : selectedEdge ? <div className="properties-form">
            <label><span>Etiqueta de línea</span><input placeholder="Ej. Sí / No" value={String(selectedEdge.label ?? "")} onChange={(event) => updateSelectedEdge({ label: event.target.value })}/></label>
            <label><span>Tipo de ruta</span><select value={selectedEdge.data?.route ?? "normal"} onChange={(event) => updateSelectedEdge({ route: event.target.value as EdgeRoute })}><option value="normal">Ruta normal</option><option value="return">Observación / retorno</option></select></label>
            <button className="button button-secondary danger-button" onClick={removeSelection}><Trash2 size={15}/> Eliminar línea</button>
          </div> : <div className="properties-empty"><GitBranch size={30}/><strong>Selecciona un elemento</strong><p>Haz clic en un cuadro o línea. Arrastra desde un punto del cuadro de origen hacia el destino para conectarlos.</p></div>}
          <div className="properties-tip"><strong>Editor avanzado XYFlow</strong><span>Rueda: zoom · Arrastrar fondo: desplazarse · Ctrl/Cmd: selección múltiple · Supr: eliminar · Minimap: navegación rápida.</span></div>
        </aside>
      </div>
      <footer className="flowchart-status"><span>{notice}</span><span>Motor XYFlow · JSON estructurado · Formato visual REBA</span></footer>
    </div>
  </div>;
}

export function FlowchartEditor({ area, subarea, flowchart, onClose, embedded = false }: { area: Area; subarea: Subarea; flowchart?: MarketingFlowchart; onClose?: () => void; embedded?: boolean }) {
  const flowCode = flowchart?.code ?? subarea.code;
  const flowTitle = flowchart?.title ?? subarea.name;
  const storageKey = `reba-flowchart-${flowCode}`;
  const template = useMemo(() => buildInitialGraph(subarea, flowchart), [subarea, flowchart]);
  const subscribe = useCallback((onStoreChange: () => void) => {
    const handleStorage = (event: StorageEvent) => { if (!event.key || event.key === storageKey) onStoreChange(); };
    window.addEventListener("storage", handleStorage); window.addEventListener(storageKey, onStoreChange);
    return () => { window.removeEventListener("storage", handleStorage); window.removeEventListener(storageKey, onStoreChange); };
  }, [storageKey]);
  const getSnapshot = useCallback(() => window.localStorage.getItem(storageKey), [storageKey]);
  const storedValue = useSyncExternalStore(subscribe, getSnapshot, () => null);
  const initialGraph = useMemo(() => migrateGraph(storedValue, template), [storedValue, template]);
  return <FlowchartCanvas key={storedValue ?? flowCode} area={area} subarea={subarea} flowCode={flowCode} flowTitle={flowTitle} initialGraph={initialGraph} storageKey={storageKey} onClose={onClose} embedded={embedded}/>;
}
