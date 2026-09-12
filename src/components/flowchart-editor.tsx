"use client";

import { PointerEvent as ReactPointerEvent, useCallback, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Box, Circle, Diamond, FileText, GitBranch, Link2, MousePointer2, RotateCcw, Save, Trash2, X } from "lucide-react";
import type { Area, Subarea } from "@/lib/data";

type NodeType = "start" | "activity" | "decision" | "evidence" | "end";

type FlowNode = {
  id: string;
  type: NodeType;
  label: string;
  role: string;
  x: number;
  y: number;
};

type FlowEdge = {
  id: string;
  from: string;
  to: string;
  label: string;
  route: "normal" | "return";
};

type FlowGraph = { nodes: FlowNode[]; edges: FlowEdge[] };

const canvasWidth = 1160;
const canvasHeight = 820;

function nodeSize(type: NodeType) {
  if (type === "decision") return { width: 154, height: 116 };
  if (type === "start" || type === "end") return { width: 220, height: 66 };
  return { width: 220, height: 82 };
}

function buildInitialGraph(subarea: Subarea): FlowGraph {
  const nodes: FlowNode[] = [
    { id: "start", type: "start", label: `Inicio: ${subarea.name}`, role: subarea.owner, x: 470, y: 42 },
    ...subarea.flow.map((label, index) => ({
      id: `step-${index + 1}`,
      type: "activity" as const,
      label,
      role: subarea.owner,
      x: 470,
      y: 150 + index * 130,
    })),
    { id: "end", type: "end", label: "Fin: actividad cerrada y evidenciada", role: "Resultado", x: 470, y: 150 + subarea.flow.length * 130 },
  ];
  const edges = nodes.slice(0, -1).map((node, index) => ({
    id: `edge-${index + 1}`,
    from: node.id,
    to: nodes[index + 1].id,
    label: "",
    route: "normal" as const,
  }));
  return { nodes, edges };
}

function parseGraph(value: string | null, fallback: FlowGraph) {
  if (!value) return fallback;
  try {
    const graph = JSON.parse(value) as FlowGraph;
    return Array.isArray(graph.nodes) && Array.isArray(graph.edges) ? graph : fallback;
  } catch {
    return fallback;
  }
}

function edgePath(from: FlowNode, to: FlowNode) {
  const fromSize = nodeSize(from.type);
  const toSize = nodeSize(to.type);
  const x1 = from.x + fromSize.width / 2;
  const y1 = from.y + fromSize.height;
  const x2 = to.x + toSize.width / 2;
  const y2 = to.y;
  const bend = Math.max(45, Math.abs(y2 - y1) * 0.45);
  return {
    path: `M ${x1} ${y1} C ${x1} ${y1 + bend}, ${x2} ${y2 - bend}, ${x2} ${y2}`,
    labelX: (x1 + x2) / 2,
    labelY: (y1 + y2) / 2,
  };
}

export function FlowchartEditor({ area, subarea, onClose }: { area: Area; subarea: Subarea; onClose: () => void }) {
  const storageKey = `reba-flowchart-${subarea.code}`;
  const initialGraph = useMemo(() => buildInitialGraph(subarea), [subarea]);
  const subscribe = useCallback((onStoreChange: () => void) => {
    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === storageKey) onStoreChange();
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener(storageKey, onStoreChange);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(storageKey, onStoreChange);
    };
  }, [storageKey]);
  const getSnapshot = useCallback(() => window.localStorage.getItem(storageKey), [storageKey]);
  const storedValue = useSyncExternalStore(subscribe, getSnapshot, () => null);
  const storedGraph = useMemo(() => parseGraph(storedValue, initialGraph), [storedValue, initialGraph]);
  const effectiveCanvasHeight = Math.max(canvasHeight, 280 + subarea.flow.length * 130);
  const [draft, setDraft] = useState<FlowGraph | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [connectMode, setConnectMode] = useState(false);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [notice, setNotice] = useState("Selecciona y arrastra un cuadro para comenzar.");
  const surfaceRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const graph = draft ?? storedGraph;
  const selectedNode = graph.nodes.find((node) => node.id === selectedNodeId) ?? null;
  const selectedEdge = graph.edges.find((edge) => edge.id === selectedEdgeId) ?? null;

  const updateGraph = (updater: (current: FlowGraph) => FlowGraph) => {
    setDraft((current) => updater(current ?? graph));
  };

  const addNode = (type: NodeType) => {
    const id = `node-${Date.now()}`;
    const column = graph.nodes.length % 3;
    const row = Math.floor(graph.nodes.length / 3) % 5;
    const labels: Record<NodeType, string> = {
      start: "Inicio del proceso",
      activity: "Nueva actividad",
      decision: "¿Decisión?",
      evidence: "Evidencia o documento",
      end: "Fin del proceso",
    };
    updateGraph((current) => ({
      ...current,
      nodes: [...current.nodes, { id, type, label: labels[type], role: subarea.owner, x: 90 + column * 330, y: 95 + row * 145 }],
    }));
    setSelectedNodeId(id);
    setSelectedEdgeId(null);
    setNotice("Cuadro añadido. Edita su texto en el panel derecho.");
  };

  const chooseNode = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    setSelectedEdgeId(null);
    if (!connectMode) return;
    if (!connectFrom) {
      setConnectFrom(nodeId);
      setNotice("Ahora selecciona el cuadro de destino.");
      return;
    }
    if (connectFrom !== nodeId) {
      updateGraph((current) => ({
        ...current,
        edges: [...current.edges, { id: `edge-${Date.now()}`, from: connectFrom, to: nodeId, label: "", route: "normal" }],
      }));
      setNotice("Línea creada. Puedes seleccionarla para añadir una etiqueta o marcarla como retorno.");
    }
    setConnectFrom(null);
    setConnectMode(false);
  };

  const startDrag = (event: ReactPointerEvent<HTMLButtonElement>, node: FlowNode) => {
    if (connectMode) {
      chooseNode(node.id);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    dragRef.current = { id: node.id, offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top };
    event.currentTarget.setPointerCapture(event.pointerId);
    chooseNode(node.id);
  };

  const moveNode = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dragging = dragRef.current;
    const surface = surfaceRef.current;
    if (!dragging || !surface) return;
    const rect = surface.getBoundingClientRect();
    updateGraph((current) => ({
      ...current,
      nodes: current.nodes.map((node) => {
        if (node.id !== dragging.id) return node;
        const size = nodeSize(node.type);
        return {
          ...node,
          x: Math.max(12, Math.min(canvasWidth - size.width - 12, event.clientX - rect.left - dragging.offsetX)),
          y: Math.max(12, Math.min(effectiveCanvasHeight - size.height - 12, event.clientY - rect.top - dragging.offsetY)),
        };
      }),
    }));
  };

  const stopDrag = () => { dragRef.current = null; };

  const updateSelectedNode = (patch: Partial<FlowNode>) => {
    if (!selectedNodeId) return;
    updateGraph((current) => ({ ...current, nodes: current.nodes.map((node) => node.id === selectedNodeId ? { ...node, ...patch } : node) }));
  };

  const updateSelectedEdge = (patch: Partial<FlowEdge>) => {
    if (!selectedEdgeId) return;
    updateGraph((current) => ({ ...current, edges: current.edges.map((edge) => edge.id === selectedEdgeId ? { ...edge, ...patch } : edge) }));
  };

  const removeSelection = () => {
    if (selectedNodeId) {
      updateGraph((current) => ({
        nodes: current.nodes.filter((node) => node.id !== selectedNodeId),
        edges: current.edges.filter((edge) => edge.from !== selectedNodeId && edge.to !== selectedNodeId),
      }));
      setSelectedNodeId(null);
    } else if (selectedEdgeId) {
      updateGraph((current) => ({ ...current, edges: current.edges.filter((edge) => edge.id !== selectedEdgeId) }));
      setSelectedEdgeId(null);
    }
  };

  const save = () => {
    const value = JSON.stringify(graph);
    window.localStorage.setItem(storageKey, value);
    window.dispatchEvent(new Event(storageKey));
    setDraft(null);
    setNotice("Flujograma guardado en este navegador.");
  };

  const restoreTemplate = () => {
    setDraft(initialGraph);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setNotice("Plantilla restaurada. Presiona Guardar para confirmar el cambio.");
  };

  return <div className="flowchart-modal" role="dialog" aria-modal="true" aria-label={`Editor de ${subarea.name}`}>
    <div className="flowchart-editor-shell">
      <header className="flowchart-editor-head">
        <div className="flowchart-title-mark" style={{ background: area.color }}>{area.code}</div>
        <div><span>{area.name} · {subarea.code}</span><h2>{subarea.name}</h2></div>
        <div className="flowchart-save-state">{draft ? <><i/> Cambios sin guardar</> : <><i className="saved"/> Guardado</>}</div>
        <button className="icon-button" aria-label="Cerrar editor" onClick={onClose}><X size={21}/></button>
      </header>

      <div className="flowchart-toolbar" aria-label="Herramientas del flujograma">
        <button onClick={() => addNode("activity")}><Box size={16}/> Actividad</button>
        <button onClick={() => addNode("decision")}><Diamond size={16}/> Decisión</button>
        <button onClick={() => addNode("start")}><Circle size={16}/> Inicio</button>
        <button onClick={() => addNode("end")}><Circle size={16}/> Fin</button>
        <button onClick={() => addNode("evidence")}><FileText size={16}/> Evidencia</button>
        <span className="toolbar-divider"/>
        <button className={connectMode ? "active" : ""} onClick={() => { setConnectMode((current) => !current); setConnectFrom(null); }}><Link2 size={16}/> Conectar</button>
        <button disabled={!selectedNodeId && !selectedEdgeId} onClick={removeSelection}><Trash2 size={16}/> Eliminar</button>
        <button onClick={restoreTemplate}><RotateCcw size={16}/> Restaurar</button>
        <button className="toolbar-save" onClick={save}><Save size={16}/> Guardar</button>
      </div>

      <div className="flowchart-workspace">
        <div className="flowchart-scroll">
          <div className={`flowchart-surface ${connectMode ? "is-connecting" : ""}`} ref={surfaceRef} style={{ width: canvasWidth, height: effectiveCanvasHeight }} onPointerMove={moveNode} onPointerUp={stopDrag} onPointerCancel={stopDrag}>
            <svg className="flowchart-edges" width={canvasWidth} height={effectiveCanvasHeight} aria-hidden="true">
              <defs>
                <marker id="flow-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z"/></marker>
                <marker id="flow-arrow-return" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z"/></marker>
              </defs>
              {graph.edges.map((edge) => {
                const from = graph.nodes.find((node) => node.id === edge.from);
                const to = graph.nodes.find((node) => node.id === edge.to);
                if (!from || !to) return null;
                const geometry = edgePath(from, to);
                return <g key={edge.id} className={`flowchart-edge ${edge.route === "return" ? "return" : ""} ${selectedEdgeId === edge.id ? "selected" : ""}`} onClick={() => { setSelectedEdgeId(edge.id); setSelectedNodeId(null); }}>
                  <path className="edge-hitbox" d={geometry.path}/>
                  <path className="edge-line" d={geometry.path} markerEnd={`url(#${edge.route === "return" ? "flow-arrow-return" : "flow-arrow"})`}/>
                  {edge.label && <text x={geometry.labelX} y={geometry.labelY - 7}>{edge.label}</text>}
                </g>;
              })}
            </svg>
            {graph.nodes.map((node) => <button
              type="button"
              key={node.id}
              className={`canvas-node node-${node.type} ${selectedNodeId === node.id ? "selected" : ""} ${connectFrom === node.id ? "connect-source" : ""}`}
              style={{ left: node.x, top: node.y, ...nodeSize(node.type) }}
              onPointerDown={(event) => startDrag(event, node)}
              onDoubleClick={() => chooseNode(node.id)}
            >
              <span className="canvas-node-content"><small>{node.role}</small><strong>{node.label}</strong></span>
            </button>)}
          </div>
        </div>

        <aside className="flowchart-properties">
          <div className="properties-head"><MousePointer2 size={16}/><div><strong>Propiedades</strong><span>Edita el elemento seleccionado</span></div></div>
          {selectedNode ? <div className="properties-form">
            <label><span>Tipo de cuadro</span><select value={selectedNode.type} onChange={(event) => updateSelectedNode({ type: event.target.value as NodeType })}><option value="activity">Actividad</option><option value="decision">Decisión</option><option value="start">Inicio</option><option value="end">Fin</option><option value="evidence">Evidencia</option></select></label>
            <label><span>Responsable / carril</span><input value={selectedNode.role} onChange={(event) => updateSelectedNode({ role: event.target.value })}/></label>
            <label><span>Texto del cuadro</span><textarea rows={5} value={selectedNode.label} onChange={(event) => updateSelectedNode({ label: event.target.value })}/></label>
            <button className="button button-secondary danger-button" onClick={removeSelection}><Trash2 size={15}/> Eliminar cuadro</button>
          </div> : selectedEdge ? <div className="properties-form">
            <label><span>Etiqueta de línea</span><input placeholder="Ej. Sí / No" value={selectedEdge.label} onChange={(event) => updateSelectedEdge({ label: event.target.value })}/></label>
            <label><span>Tipo de ruta</span><select value={selectedEdge.route} onChange={(event) => updateSelectedEdge({ route: event.target.value as FlowEdge["route"] })}><option value="normal">Ruta normal</option><option value="return">Observación / retorno</option></select></label>
            <button className="button button-secondary danger-button" onClick={removeSelection}><Trash2 size={15}/> Eliminar línea</button>
          </div> : <div className="properties-empty"><GitBranch size={30}/><strong>Selecciona un elemento</strong><p>Haz clic en un cuadro o una línea. Para unir dos cuadros activa “Conectar” y selecciona origen y destino.</p></div>}
          <div className="properties-tip"><strong>Cómo usar el lienzo</strong><span>Arrastra cuadros para moverlos. Añade decisiones, evidencias o actividades desde la barra. Las rutas de observación se muestran en rojo.</span></div>
        </aside>
      </div>
      <footer className="flowchart-status"><span>{notice}</span><span>Formato inspirado en los flujogramas de Contabilidad · Lienzo {canvasWidth} × {effectiveCanvasHeight}</span></footer>
    </div>
  </div>;
}
