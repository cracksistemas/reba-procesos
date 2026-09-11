"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { areas, processes } from "@/lib/data";

export function ProcessCatalog() {
  const [query,setQuery]=useState(""); const [area,setArea]=useState("Todas"); const [status,setStatus]=useState("Todos");
  const filtered=useMemo(()=>processes.filter((item)=>{const haystack=`${item.code} ${item.name} ${item.owner} ${item.area}`.toLowerCase(); return haystack.includes(query.toLowerCase())&&(area==="Todas"||item.area===area)&&(status==="Todos"||item.status===status)}),[query,area,status]);
  return <><div className="filter-bar"><label className="search-input"><Search size={17}/><input value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Buscar por código, proceso o responsable" aria-label="Buscar procesos"/></label><select className="filter-select" value={area} onChange={(event)=>setArea(event.target.value)} aria-label="Filtrar por área"><option>Todas</option>{areas.map((item)=><option key={item.code}>{item.name}</option>)}</select><select className="filter-select" value={status} onChange={(event)=>setStatus(event.target.value)} aria-label="Filtrar por estado"><option>Todos</option><option>Borrador</option><option>En revisión</option><option>Observado</option><option>Aprobado</option></select></div>
  <div className="card table-wrap"><table className="data-table"><thead><tr><th>Código</th><th>Proceso</th><th>Área / dueño</th><th>Estado</th><th>Versión</th><th>Actualizado</th><th aria-label="Acciones"/></tr></thead><tbody>{filtered.map((item)=><tr key={item.code}><td><Link className="table-code" href={`/procesos/${item.code}`}>{item.code}</Link></td><td><span className="table-primary">{item.name}</span><span className="table-secondary">Criticidad {item.criticality.toLowerCase()}</span></td><td>{item.area}<span className="table-secondary">{item.owner}</span></td><td><StatusBadge status={item.status}/></td><td>v{item.version}</td><td>{item.updated}</td><td className="table-actions"><Link className="icon-button" href={`/procesos/${item.code}`} aria-label={`Abrir ${item.name}`}><ArrowRight size={16}/></Link></td></tr>)}</tbody></table>{filtered.length===0&&<div className="empty-state"><strong>No encontramos procesos</strong><p>Prueba con otro término o cambia los filtros.</p></div>}</div></>;
}
