import type { CSSProperties } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, FolderKanban, Info, Layers3 } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { areas, processes, reviews } from "@/lib/data";

export default function Home() {
  const approved = processes.filter((item) => item.status === "Aprobado").length;
  const drafts = processes.filter((item) => item.status === "Borrador").length;
  const metricStyle = (color: string, tint: string) => ({ "--metric-color": color, "--metric-tint": tint } as CSSProperties);
  return <>
    <div className="page-heading"><div><p className="eyebrow">Panel institucional</p><h1>Gestión de Procesos</h1><p>Consulta, actualiza y controla los procesos de Rebagliati.</p></div><Link className="button button-primary" href="/procesos">Ver catálogo <ArrowRight size={16}/></Link></div>
    <div className="pilot-banner"><Info size={17}/><span><strong>Entorno piloto.</strong> Los registros visibles sirven para validar la experiencia; la estructura está lista para conectarse al proyecto Supabase y a los archivos maestros de Drive.</span></div>
    <section className="dashboard-grid" aria-label="Resumen">
      <div className="metric-card" style={metricStyle("#01017B","#EEEEFF")}><div className="metric-top"><div className="metric-icon"><FolderKanban size={19}/></div><span className="metric-change">7 áreas</span></div><div className="metric-number">{processes.length}</div><div className="metric-label">Procesos inventariados</div></div>
      <div className="metric-card" style={metricStyle("#2E8B57","#E8F7EF")}><div className="metric-top"><div className="metric-icon"><CheckCircle2 size={19}/></div><span className="metric-change">{Math.round(approved/processes.length*100)}%</span></div><div className="metric-number">{approved}</div><div className="metric-label">Procesos aprobados</div></div>
      <div className="metric-card" style={metricStyle("#D49A00","#FFF5D9")}><div className="metric-top"><div className="metric-icon"><Clock3 size={19}/></div><span className="metric-change">Atención</span></div><div className="metric-number">{reviews.length}</div><div className="metric-label">En revisión u observados</div></div>
      <div className="metric-card" style={metricStyle("#7E57C2","#F1ECF8")}><div className="metric-top"><div className="metric-icon"><Layers3 size={19}/></div><span className="metric-change">En curso</span></div><div className="metric-number">{drafts}</div><div className="metric-label">Borradores activos</div></div>
    </section>
    <section className="section-grid">
      <div><div className="card"><div className="card-header"><div><h2>Procesos que requieren atención</h2><p>Revisiones y observaciones pendientes</p></div><Link className="text-link" href="/revisiones">Ver todos</Link></div><div className="process-list">{reviews.slice(0,5).map((process)=><Link className="process-row" href={`/procesos/${process.code}`} key={process.code}><div className="process-icon">{process.area.slice(0,2).toUpperCase()}</div><div className="process-info"><strong>{process.name}</strong><span>{process.code} · {process.owner}</span></div><StatusBadge status={process.status}/><span className="process-version">v{process.version}</span><ArrowRight className="open-arrow" size={16}/></Link>)}</div></div>
      <div className="card" style={{marginTop:18}}><div className="card-header"><div><h2>Actividad reciente</h2><p>Cambios registrados en el catálogo</p></div></div><div className="activity-list"><div className="activity-item"><strong>Community Manager</strong> fue enviado a revisión.<span>Diego León · Hace 2 horas</span></div><div className="activity-item"><strong>Gestión de leads v1.2</strong> fue aprobada.<span>Ana Salazar · Hoy, 09:42</span></div><div className="activity-item"><strong>Gestión de pauta digital</strong> recibió 2 observaciones.<span>Valeria Cruz · 07 sep, 12:44</span></div></div></div></div>
      <div className="card"><div className="card-header"><div><h2>Avance por área</h2><p>Porcentaje de procesos aprobados</p></div></div><div className="area-progress">{areas.slice(0,6).map((area)=>{const percentage=Math.round(area.approved/area.processCount*100);return <div className="area-progress-row" key={area.code}><div className="area-progress-head"><strong>{area.name}</strong><span>{percentage}%</span></div><div className="progress-track"><div className="progress-fill" style={{width:`${percentage}%`}}/></div></div>})}<Link className="button button-ghost" style={{width:"100%",marginTop:4}} href="/areas"><AlertTriangle size={15}/> Ver brechas por área</Link></div></div>
    </section>
  </>;
}
