import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { areas } from "@/lib/data";
export const metadata:Metadata={title:"Áreas"};
export default function AreasPage(){return <><div className="page-heading"><div><p className="eyebrow">Estructura organizacional</p><h1>Áreas</h1><p>Responsables y avance documental por unidad.</p></div></div><section className="area-grid">{areas.map((area)=>{const percentage=Math.round(area.approved/area.processCount*100);return <Link href={`/procesos?area=${area.code}`} className="card area-card" key={area.code}><div className="area-card-top"><div className="area-symbol" style={{background:area.color}}>{area.code}</div><ArrowRight size={17}/></div><h2>{area.name}</h2><p>{area.description}</p><div className="area-stats"><div><strong>{area.processCount}</strong><span>Procesos</span></div><div><strong>{percentage}%</strong><span>Aprobado</span></div></div><div className="progress-track"><div className="progress-fill" style={{width:`${percentage}%`}}/></div><div className="area-owner">Dueño: {area.owner}</div></Link>})}</section></>}
