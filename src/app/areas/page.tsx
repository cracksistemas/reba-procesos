import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, GitBranch } from "lucide-react";
import { areas, getSubareas } from "@/lib/data";

export const metadata: Metadata = { title: "Áreas y subáreas" };

export default function AreasPage() {
  return <>
    <div className="page-heading">
      <div><p className="eyebrow">Estructura organizacional</p><h1>Áreas y subáreas</h1><p>Responsables, procesos y flujogramas organizados por unidad.</p></div>
      <Link className="button button-primary" href="/flujogramas"><GitBranch size={15}/> Ver flujogramas por área</Link>
    </div>
    <section className="area-grid">
      {areas.map((area) => {
        const percentage = area.processCount ? Math.round(area.approved / area.processCount * 100) : 0;
        const areaSubareas = getSubareas(area.code);
        return <Link href={`/areas/${area.code}`} className="card area-card" key={area.code}>
          <div className="area-card-top"><div className="area-symbol" style={{ background: area.color }}>{area.code}</div><ArrowRight size={17}/></div>
          <h2>{area.name}</h2>
          <p>{area.description}</p>
          <div className="subarea-preview">{areaSubareas.slice(0, 3).map((subarea) => <span key={subarea.code}>{subarea.name}</span>)}{areaSubareas.length > 3 && <span>+{areaSubareas.length - 3} más</span>}</div>
          <div className="area-stats"><div><strong>{area.processCount}</strong><span>Procesos</span></div><div><strong>{areaSubareas.length}</strong><span>Subáreas</span></div><div><strong>{percentage}%</strong><span>Aprobado</span></div></div>
          <div className="progress-track"><div className="progress-fill" style={{ width: `${percentage}%` }} /></div>
          <div className="area-owner"><GitBranch size={12}/> Administrar estructura · Dueño: {area.owner}</div>
        </Link>;
      })}
    </section>
  </>;
}
