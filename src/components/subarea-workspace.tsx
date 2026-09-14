"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, Download, FileText, GitBranch, LayoutGrid, Pencil, ShieldCheck, UserRound, X } from "lucide-react";
import { FlowchartEditor } from "@/components/flowchart-editor";
import type { Area, Process, Subarea } from "@/lib/data";
import type { Flowchart } from "@/lib/flowcharts";

type SubareaWorkspaceProps = {
  area: Area;
  subarea: Subarea;
  siblings: Subarea[];
  flowcharts: Flowchart[];
  linkedProcesses: Process[];
  flowCounts: Record<string, number>;
  initialFlowCode?: string;
};

const viewerTabs = ["Diagrama", "Ficha", "KPI", "Documentos", "Historial"] as const;
type ViewerTab = typeof viewerTabs[number];

export function SubareaWorkspace({ area, subarea, siblings, flowcharts, linkedProcesses, flowCounts, initialFlowCode }: SubareaWorkspaceProps) {
  const initial = initialFlowCode && flowcharts.some((item) => item.code === initialFlowCode) ? initialFlowCode : null;
  const [activeCode, setActiveCode] = useState<string | null>(initial);
  const [tab, setTab] = useState<ViewerTab>("Diagrama");
  const [editing, setEditing] = useState(false);
  const activeFlow = useMemo(() => flowcharts.find((flowchart) => flowchart.code === activeCode) ?? null, [activeCode, flowcharts]);
  const totalEntries = flowcharts.length || linkedProcesses.length || 1;
  const activeVersion = activeFlow?.code.startsWith("COM-") ? "2.0" : "3.0";

  const openFlow = (code: string) => {
    setActiveCode(code);
    setTab("Diagrama");
    setEditing(false);
  };

  return <>
    <div className="subarea-workspace-heading">
      <div className="breadcrumb"><Link href="/biblioteca">Biblioteca</Link> / <Link href="/areas">Áreas</Link> / <Link href={`/areas/${area.code}`}>{area.name}</Link> / <span>{subarea.name}</span></div>
      <Link className="button button-secondary" href={`/areas/${area.code}`}><ArrowLeft size={14}/> Todas las subáreas</Link>
    </div>

    <section className="subarea-hero card">
      <div className="subarea-hero-mark" style={{ background: area.color }}><GitBranch size={23}/></div>
      <div><p className="eyebrow">{subarea.code} · Subárea de {area.name}</p><h1>{subarea.name}</h1><p>{subarea.description}</p></div>
      <div className="subarea-hero-facts"><span><UserRound size={14}/> {subarea.owner}</span><strong>{totalEntries} {totalEntries === 1 ? "elemento documentado" : "elementos documentados"}</strong></div>
    </section>

    {!activeCode ? <div className="subarea-directory-layout">
      <main>
        <div className="directory-heading"><div><h2>Procesos y programas</h2><p>Elige un elemento para abrir su ficha y su flujograma. Ninguno se abre automáticamente.</p></div><span>{totalEntries} disponibles</span></div>
        <section className="card process-directory-list" aria-label={`Procesos de ${subarea.name}`}>
          {flowcharts.length > 0 ? flowcharts.map((flowchart, index) => <button key={flowchart.code} className="process-directory-row" onClick={() => openFlow(flowchart.code)}>
            <span className="process-directory-index">{String(index + 1).padStart(2, "0")}</span>
            <div className="process-directory-main"><small>{flowchart.code}</small><strong>{flowchart.title}</strong><span>{flowchart.description}</span></div>
            <div className="process-directory-meta"><span className="status approved">Documentado</span><span>v{flowchart.code.startsWith("COM-") ? "2.0" : "3.0"}</span><span>{flowchart.owner}</span></div>
            <ArrowRight size={16}/>
          </button>) : linkedProcesses.length > 0 ? linkedProcesses.map((process, index) => <Link key={process.code} className="process-directory-row" href={`/procesos/${process.code}`}>
            <span className="process-directory-index">{String(index + 1).padStart(2, "0")}</span>
            <div className="process-directory-main"><small>{process.code}</small><strong>{process.name}</strong><span>{process.objective}</span></div>
            <div className="process-directory-meta"><span className={`status ${process.status === "Aprobado" ? "approved" : "review"}`}>{process.status}</span><span>v{process.version}</span><span>{process.owner}</span></div>
            <ArrowRight size={16}/>
          </Link>) : <button className="process-directory-row" onClick={() => setActiveCode(subarea.code)}>
            <span className="process-directory-index">01</span><div className="process-directory-main"><small>{subarea.code}-F01</small><strong>Flujograma general de {subarea.name}</strong><span>{subarea.description}</span></div><div className="process-directory-meta"><span className="status draft">Base inicial</span><span>v0.1</span><span>{subarea.owner}</span></div><ArrowRight size={16}/>
          </button>}
        </section>
      </main>
      <aside className="card sibling-directory"><div className="workspace-nav-head"><LayoutGrid size={16}/><div><strong>Otras subáreas</strong><span>{area.name}</span></div></div><nav className="workspace-subarea-list">{siblings.map((item) => <Link className={item.code === subarea.code ? "active" : ""} href={`/areas/${area.code}/${item.code}`} key={item.code}><span className="workspace-nav-code">{item.code.replace(`${area.code}-`, "")}</span><span><strong>{item.name}</strong><small>{flowCounts[item.code] || 1} {(flowCounts[item.code] || 1) === 1 ? "proceso" : "procesos"}</small></span><ArrowRight size={13}/></Link>)}</nav></aside>
    </div> : <section className="process-viewer">
      <div className="process-viewer-top card">
        <button className="icon-button viewer-back" onClick={() => { setActiveCode(null); setEditing(false); }} aria-label="Volver a la lista"><ArrowLeft size={18}/></button>
        <div><div className="viewer-context">{area.name} / {subarea.name} / {activeFlow?.code ?? `${subarea.code}-F01`}</div><h2>{activeFlow?.title ?? `Flujograma general de ${subarea.name}`}</h2><p>{activeFlow?.description ?? subarea.description}</p></div>
        <div className="viewer-metadata"><span><UserRound size={13}/> {activeFlow?.owner ?? subarea.owner}</span><span><ShieldCheck size={13}/> {activeFlow ? "Documentado" : "Borrador"}</span><span><Clock3 size={13}/> Versión {activeFlow ? activeVersion : "0.1"}</span></div>
        <button className={`button ${editing ? "button-secondary" : "button-primary"}`} onClick={() => setEditing((current) => !current)}>{editing ? <X size={15}/> : <Pencil size={15}/>} {editing ? "Salir de edición" : "Editar"}</button>
      </div>

      {editing && <div className="editing-mode-banner"><Pencil size={15}/><span><strong>Modo edición.</strong> Estás trabajando sobre un borrador local; la versión documentada permanece intacta.</span></div>}
      {!editing && <div className="tabs viewer-tabs" role="tablist" aria-label="Secciones del proceso">{viewerTabs.map((item) => <button key={item} className={`tab ${tab === item ? "active" : ""}`} onClick={() => setTab(item)} role="tab" aria-selected={tab === item}>{item}</button>)}</div>}

      <div className={!editing ? "card detail-panel viewer-panel" : "viewer-editor"}>
        {(editing || tab === "Diagrama") && <FlowchartEditor key={`${activeCode}-${editing ? "edit" : "read"}`} area={area} subarea={subarea} flowchart={activeFlow ?? undefined} embedded readOnly={!editing}/>}
        {!editing && tab === "Ficha" && <div className="summary-grid"><div><section className="summary-section"><h3>Objetivo</h3><p>{activeFlow?.description ?? subarea.description}</p></section><section className="summary-section"><h3>Alcance</h3><p>Desde el inicio documentado hasta el cierre del flujo, incluyendo decisiones, retornos, responsables y evidencias representadas.</p></section><section className="summary-section"><h3>Vista lineal accesible</h3><ol className="linear-flow">{(activeFlow?.nodes ?? []).map((node) => <li key={node.id}><strong>{node.role || "Actividad"}</strong><span>{node.label}</span></li>)}</ol></section></div><aside className="facts"><div className="fact"><span>Área</span><strong>{area.name}</strong></div><div className="fact"><span>Subárea</span><strong>{subarea.name}</strong></div><div className="fact"><span>Responsable</span><strong>{activeFlow?.owner ?? subarea.owner}</strong></div><div className="fact"><span>Nivel</span><strong>N2 · Operativo</strong></div><div className="fact"><span>Tipo</span><strong>Soporte / gestión</strong></div></aside></div>}
        {!editing && tab === "KPI" && <div className="viewer-placeholder"><CheckCircle2 size={24}/><h3>Indicadores vinculados</h3><p>Este flujo todavía no tiene indicadores publicados. La ficha está preparada para asociar meta, frecuencia, fuente y responsable.</p></div>}
        {!editing && tab === "Documentos" && <div className="viewer-placeholder"><FileText size={24}/><h3>Documentación relacionada</h3><p>Versión fuente {activeVersion} importada del documento HTML institucional.</p><button className="button button-secondary"><Download size={15}/> Descargar desde el diagrama</button></div>}
        {!editing && tab === "Historial" && <div className="activity-list viewer-history"><div className="activity-item"><strong>Versión {activeVersion} incorporada a la biblioteca</strong><span>Importación institucional · fuente HTML</span></div><div className="activity-item"><strong>Flujograma estructurado para edición visual</strong><span>Nodos y conexiones convertidos a formato XYFlow</span></div></div>}
      </div>
    </section>}
  </>;
}
