import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, GitBranch } from "lucide-react";
import { areas, getSubareas } from "@/lib/data";

export const metadata: Metadata = { title: "Áreas y subáreas" };

export default function AreasPage() {
  return <>
    <div className="page-heading">
      <div><div className="breadcrumb"><Link href="/biblioteca">Biblioteca</Link> / <span>Áreas</span></div><p className="eyebrow">Primer nivel de navegación</p><h1>Áreas institucionales</h1><p>Selecciona un área para consultar exclusivamente sus subáreas.</p></div>
      <Link className="button button-secondary" href="/biblioteca"><ArrowLeft size={15}/> Volver a la biblioteca</Link>
    </div>
    <section className="area-grid">
      {areas.map((area) => {
        const percentage = area.processCount ? Math.round(area.approved / area.processCount * 100) : 0;
        const areaSubareas = getSubareas(area.code);
        return <Link href={`/areas/${area.code}`} className="card area-card" key={area.code}>
          <div className="area-card-top"><div className="area-symbol" style={{ background: area.color }}>{area.code}</div><ArrowRight size={17}/></div>
          <h2>{area.name}</h2>
          <p>{area.description}</p>
          <div className="area-stats"><div><strong>{areaSubareas.length}</strong><span>Subáreas</span></div><div><strong>{area.processCount}</strong><span>Procesos</span></div><div><strong>{percentage}%</strong><span>Aprobado</span></div></div>
          <div className="progress-track"><div className="progress-fill" style={{ width: `${percentage}%` }} /></div>
          <div className="area-owner"><GitBranch size={12}/> Administrar estructura · Dueño: {area.owner}</div>
        </Link>;
      })}
    </section>
  </>;
}
