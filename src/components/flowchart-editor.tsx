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
import { AlignHorizontalSpaceBetween, AlignVerticalSpaceBetween, Box, Circle, Columns3, Diamond, FileText, GitBranch, Link2, PanelRightClose, PanelRightOpen, RotateCcw, Rows3, Save, Trash2, WandSparkles, X } from "lucide-react";
import type { Area, Subarea } from "@/lib/data";
import type { MarketingFlowchart } from "@/lib/marketing-flowcharts";

type NodeKind = "start" | "activity" | "decision" | "evidence" | "exception" | "end";
type EdgeRoute = "normal" | "return";
type AlignmentMode = "row" | "column" | "distribute-horizontal" | "distribute-vertical";

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

function getNodeSize(node: RebaNode) {
  return {
    width: numericSize(node.measured?.width, numericSize(node.style?.width, 250)),
    height: numericSize(node.measured?.height, numericSize(node.style?.height, 58)),
  };
}

function snapCoordinate(value: number) {
  return Math.round(value / 16) * 16;
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
  const [propertiesCollapsed, setPropertiesCollapsed] = useState(false);
  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? null;
  const selectedEdge = edges.find((edge) => edge.id === selectedEdgeId) ?? null;
  const selectedNodes = nodes.filter((node) => node.selected);

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

  const alignSelection = (mode: AlignmentMode) => {
    const chosen = nodes.filter((node) => node.selected);
    const required = mode.startsWith("distribute") ? 3 : 2;
    if (chosen.length < required) {
      setNotice(`Selecciona al menos ${required} cuadros con Ctrl/Cmd + clic para usar esta alineación.`);
      return;
    }

    const positions = new Map<string, { x: number; y: number }>();
    if (mode === "row") {
      const centerY = snapCoordinate(chosen.reduce((sum, node) => sum + node.position.y + getNodeSize(node).height / 2, 0) / chosen.length);
      chosen.forEach((node) => positions.set(node.id, { x: node.position.x, y: centerY - getNodeSize(node).height / 2 }));
    } else if (mode === "column") {
      const centerX = snapCoordinate(chosen.reduce((sum, node) => sum + node.position.x + getNodeSize(node).width / 2, 0) / chosen.length);
      chosen.forEach((node) => positions.set(node.id, { x: centerX - getNodeSize(node).width / 2, y: node.position.y }));
    } else {
      const horizontal = mode === "distribute-horizontal";
      const ordered = [...chosen].sort((a, b) => horizontal ? a.position.x - b.position.x : a.position.y - b.position.y);
      const first = ordered[0];
      const last = ordered[ordered.length - 1];
      const firstCenter = snapCoordinate(horizontal ? first.position.x + getNodeSize(first).width / 2 : first.position.y + getNodeSize(first).height / 2);
      const lastCenter = snapCoordinate(horizontal ? last.position.x + getNodeSize(last).width / 2 : last.position.y + getNodeSize(last).height / 2);
      const step = (lastCenter - firstCenter) / (ordered.length - 1);
      ordered.forEach((node, index) => {
        const size = getNodeSize(node);
        positions.set(node.id, horizontal
          ? { x: firstCenter + step * index - size.width / 2, y: node.position.y }
          : { x: node.position.x, y: firstCenter + step * index - size.height / 2 });
      });
    }

    setNodes((current) => current.map((node) => positions.has(node.id) ? { ...node, position: positions.get(node.id)! } : node));
    setDirty(true);
    setNotice(mode === "row" ? "Cuadros alineados en una fila." : mode === "column" ? "Cuadros alineados en una columna." : "Espaciado uniforme aplicado a la selección.");
  };

  const autoArrange = () => {
    const nodeIds = new Set(nodes.map((node) => node.id));
    const nodesById = new Map(nodes.map((node) => [node.id, node]));
    const hierarchyEdges = edges.filter((edge) => {
      if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) return false;
      if (edge.data?.route !== "return") return true;
      const source = nodesById.get(edge.source);
      const target = nodesById.get(edge.target);
      return Boolean(source && target && target.position.y > source.position.y);
    });
    const incoming = new Map(nodes.map((node) => [node.id, 0]));
    const outgoing = new Map(nodes.map((node) => [node.id, [] as string[]]));
    hierarchyEdges.forEach((edge) => {
      incoming.set(edge.target, (incoming.get(edge.target) ?? 0) + 1);
      outgoing.get(edge.source)?.push(edge.target);
    });

    const depth = new Map<string, number>();
    const queue = nodes
      .filter((node) => (incoming.get(node.id) ?? 0) === 0)
      .sort((a, b) => Number(b.data.kind === "start") - Number(a.data.kind === "start") || a.position.y - b.position.y);
    queue.forEach((node) => depth.set(node.id, 0));
    for (let index = 0; index < queue.length; index += 1) {
      const node = queue[index];
      const nodeDepth = depth.get(node.id) ?? 0;
      (outgoing.get(node.id) ?? []).forEach((targetId) => {
        depth.set(targetId, Math.max(depth.get(targetId) ?? 0, nodeDepth + 1));
        const nextIncoming = (incoming.get(targetId) ?? 1) - 1;
        incoming.set(targetId, nextIncoming);
        if (nextIncoming === 0) {
          const target = nodesById.get(targetId);
          if (target) queue.push(target);
        }
      });
    }

    let fallbackDepth = Math.max(0, ...depth.values());
    nodes.filter((node) => !depth.has(node.id)).sort((a, b) => a.position.y - b.position.y).forEach((node) => {
      fallbackDepth += 1;
      depth.set(node.id, fallbackDepth);
    });
    const layers = new Map<number, RebaNode[]>();
    nodes.forEach((node) => {
      const nodeDepth = depth.get(node.id) ?? 0;
      layers.set(nodeDepth, [...(layers.get(nodeDepth) ?? []), node]);
    });
    const bounds = nodes.reduce((result, node) => {
      const size = getNodeSize(node);
      return { left: Math.min(result.left, node.position.x), right: Math.max(result.right, node.position.x + size.width) };
    }, { left: Number.POSITIVE_INFINITY, right: Number.NEGATIVE_INFINITY });
    const canvasCenter = snapCoordinate(Math.max(650, Number.isFinite(bounds.left) ? (bounds.left + bounds.right) / 2 : 650));
    const positions = new Map<string, { x: number; y: number }>();
    let y = 48;
    [...layers.entries()].sort(([a], [b]) => a - b).forEach(([, layer]) => {
      const ordered = [...layer].sort((a, b) => a.position.x - b.position.x);
      const gap = 96;
      const totalWidth = ordered.reduce((sum, node) => sum + getNodeSize(node).width, 0) + gap * Math.max(0, ordered.length - 1);
      const layerHeight = Math.max(...ordered.map((node) => getNodeSize(node).height));
      const layerCenterY = snapCoordinate(y + layerHeight / 2);
      let x = canvasCenter - totalWidth / 2;
      ordered.forEach((node) => {
        const size = getNodeSize(node);
        positions.set(node.id, { x, y: layerCenterY - size.height / 2 });
        x += getNodeSize(node).width + gap;
      });
      y = layerCenterY + layerHeight / 2 + 112;
    });

    setNodes((current) => current.map((node) => ({ ...node, position: positions.get(node.id) ?? node.position })));
    setEdges((current) => current.map((edge) => {
      const route = edge.data?.route ?? "normal";
      const sourceDepth = depth.get(edge.source) ?? 0;
      const targetDepth = depth.get(edge.target) ?? sourceDepth;
      const sourcePosition = positions.get(edge.source);
      const targetPosition = positions.get(edge.target);
      const sourceHandle = route === "return" ? "right" : targetDepth > sourceDepth ? "bottom" : (targetPosition?.x ?? 0) >= (sourcePosition?.x ?? 0) ? "right" : "left";
      return makeEdge(edge.id, edge.source, edge.target, route, String(edge.label ?? ""), sourceHandle);
    }));
    setDirty(true);
    setNotice("Flujo ordenado por niveles; cuadros, espacios y rutas fueron realineados.");
    window.setTimeout(() => instance?.fitView({ padding: 0.14, duration: 450 }), 0);
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
        <button onClick={() => setPropertiesCollapsed((current) => !current)} aria-expanded={!propertiesCollapsed} aria-controls={`properties-${flowCode}`}>{propertiesCollapsed ? <PanelRightOpen size={16}/> : <PanelRightClose size={16}/>} {propertiesCollapsed ? "Mostrar panel" : "Ocultar panel"}</button>
        <button className="toolbar-save" onClick={save}><Save size={16}/> Guardar</button>
      </div>

      <div className="flowchart-alignment-bar" aria-label="Herramientas de alineación">
        <strong>Alineación</strong><span>{selectedNodes.length ? `${selectedNodes.length} seleccionados` : "Ctrl/Cmd + clic para seleccionar varios"}</span>
        <button disabled={selectedNodes.length < 2} onClick={() => alignSelection("row")} title="Alinear los centros en una fila"><Rows3 size={15}/> Fila</button>
        <button disabled={selectedNodes.length < 2} onClick={() => alignSelection("column")} title="Alinear los centros sobre un eje vertical para enderezar las conexiones"><Columns3 size={15}/> Columna / línea recta</button>
        <button disabled={selectedNodes.length < 3} onClick={() => alignSelection("distribute-horizontal")} title="Distribuir horizontalmente con espacios iguales"><AlignHorizontalSpaceBetween size={15}/> Espacio horizontal</button>
        <button disabled={selectedNodes.length < 3} onClick={() => alignSelection("distribute-vertical")} title="Distribuir verticalmente con espacios iguales"><AlignVerticalSpaceBetween size={15}/> Espacio vertical</button>
        <button className="auto-arrange-button" onClick={autoArrange} title="Ordenar automáticamente todo el flujograma"><WandSparkles size={15}/> Ordenar todo</button>
      </div>

      <div className={`flowchart-workspace ${propertiesCollapsed ? "properties-collapsed" : ""}`}>
        <div className="xyflow-canvas">
          <ReactFlow<RebaNode, RebaEdge>
            nodes={nodes} edges={edges} nodeTypes={nodeTypes}
            onNodesChange={handleNodesChange} onEdgesChange={handleEdgesChange} onConnect={onConnect} onInit={setInstance}
            onNodeClick={(event, node) => {
              if (event.ctrlKey || event.metaKey) {
                const selectedBeforeClick = new Set(selectedNodes.map((item) => item.id));
                const wasSelected = selectedBeforeClick.has(node.id);
                setNodes((current) => current.map((item) => ({
                  ...item,
                  selected: item.id === node.id ? !wasSelected : selectedBeforeClick.has(item.id),
                })));
              }
              setSelectedNodeId(node.id);
              setSelectedEdgeId(null);
            }}
            onEdgeClick={(_, edge) => { setSelectedEdgeId(edge.id); setSelectedNodeId(null); }}
            onPaneClick={() => { setSelectedNodeId(null); setSelectedEdgeId(null); }}
            defaultViewport={initialGraph.viewport ?? defaultViewport} fitView={!initialGraph.viewport} fitViewOptions={{ padding: 0.16, maxZoom: 1.1 }}
            minZoom={0.18} maxZoom={2.4} snapToGrid snapGrid={[16, 16]} selectionOnDrag deleteKeyCode={["Backspace", "Delete"]}
          >
            <Background variant={BackgroundVariant.Dots} gap={18} size={1.4} color="#cfd7e2"/>
            <Controls position="bottom-left" showInteractive={false}/>
            <MiniMap position="bottom-right" pannable zoomable nodeColor={(node) => (node.data as RebaNodeData).fill ?? nodeColors[(node.data as RebaNodeData).kind]} maskColor="rgba(240,243,248,.72)"/>
          </ReactFlow>
        </div>

        <aside id={`properties-${flowCode}`} className="flowchart-properties" hidden={propertiesCollapsed}>
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
