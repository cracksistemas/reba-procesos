"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, GitBranch, LayoutGrid, ListTree, UserRound } from "lucide-react";
import { FlowchartEditor } from "@/components/flowchart-editor";
import type { Area, Subarea } from "@/lib/data";
import type { MarketingFlowchart } from "@/lib/marketing-flowcharts";

type SubareaWorkspaceProps = {
  area: Area;
  subarea: Subarea;
  siblings: Subarea[];
  flowcharts: MarketingFlowchart[];
  flowCounts: Record<string, number>;
};

export function SubareaWorkspace({ area, subarea, siblings, flowcharts, flowCounts }: SubareaWorkspaceProps) {
  const [activeCode, setActiveCode] = useState(flowcharts[0]?.code ?? subarea.code);
  const activeFlow = useMemo(() => flowcharts.find((flowchart) => flowchart.code === activeCode), [activeCode, flowcharts]);
  const activePosition = activeFlow ? flowcharts.findIndex((flowchart) => flowchart.code === activeFlow.code) + 1 : 1;
  const totalFlows = flowcharts.length || 1;
  const flowTitle = activeFlow?.title ?? `Flujograma general de ${subarea.name}`;
  const flowDescription = activeFlow?.description ?? subarea.description;
  const nodeCount = activeFlow?.nodes.length ?? subarea.flow.length + 2;

  return <>
    <div className="subarea-workspace-heading">
      <div className="breadcrumb"><Link href="/areas">Áreas</Link> / <Link href={`/areas/${area.code}`}>{area.name}</Link> / <span>{subarea.name}</span></div>
      <Link className="button button-secondary" href={`/areas/${area.code}`}><ArrowLeft size={14}/> Todas las subáreas</Link>
    </div>

    <section className="subarea-hero card">
      <div className="subarea-hero-mark" style={{ background: area.color }}><GitBranch size={23}/></div>
      <div><p className="eyebrow">{subarea.code} · Subárea de {area.name}</p><h1>{subarea.name}</h1><p>{subarea.description}</p></div>
      <div className="subarea-hero-facts"><span><UserRound size={14}/> {subarea.owner}</span><strong>{totalFlows} {totalFlows === 1 ? "flujo documentado" : "flujos documentados"}</strong></div>
    </section>

    <div className="subarea-workspace-layout">
      <aside className="workspace-navigator card" aria-label="Navegación de la subárea">
        <div className="workspace-process-head"><ListTree size={15}/><div><strong>Procesos y programas</strong><span>{subarea.name}</span></div></div>
        <div className="workspace-flow-list">
          {flowcharts.length ? flowcharts.map((flowchart, index) => <button className={flowchart.code === activeCode ? "active" : ""} key={flowchart.code} onClick={() => setActiveCode(flowchart.code)} aria-pressed={flowchart.code === activeCode}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div><small>{flowchart.code}</small><strong>{flowchart.title}</strong></div>
          </button>) : <button className="active" aria-pressed={true}><span>01</span><div><small>{subarea.code}</small><strong>Flujograma general</strong></div></button>}
        </div>

        <div className="workspace-nav-head"><LayoutGrid size={16}/><div><strong>Cambiar de subárea</strong><span>{area.name}</span></div></div>
        <nav className="workspace-subarea-list">
          {siblings.map((item) => <Link className={item.code === subarea.code ? "active" : ""} href={`/areas/${area.code}/${item.code}`} key={item.code}>
            <span className="workspace-nav-code">{item.code.replace(`${area.code}-`, "")}</span>
            <span><strong>{item.name}</strong><small>{flowCounts[item.code] || 1} {(flowCounts[item.code] || 1) === 1 ? "flujo" : "flujos"}</small></span>
            <ArrowRight size={13}/>
          </Link>)}
        </nav>
      </aside>

      <main className="workspace-flow-content">
        <section className="workspace-flow-summary card">
          <div className="workspace-flow-index"><span>{String(activePosition).padStart(2, "0")}</span><small>de {String(totalFlows).padStart(2, "0")}</small></div>
          <div><p className="eyebrow">{activeFlow?.code ?? subarea.code} · Lienzo editable</p><h2>{flowTitle}</h2><p>{flowDescription}</p></div>
          <div className="workspace-flow-metrics"><span><strong>{nodeCount}</strong> cuadros</span><span><strong>{activeFlow?.edges.length ?? Math.max(0, nodeCount - 1)}</strong> conexiones</span><span><CheckCircle2 size={13}/> Estructurado</span></div>
        </section>

        <div className="workspace-editor-caption"><div><strong>Flujograma completo</strong><span>Selecciona un cuadro o una línea para editar sus propiedades.</span></div><span>Los cambios se guardan en este navegador</span></div>
        <FlowchartEditor key={activeFlow?.code ?? subarea.code} area={area} subarea={subarea} flowchart={activeFlow} embedded/>
      </main>
    </div>
  </>;
}
