import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ClipboardCheck, MessageSquareWarning } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { reviews } from "@/lib/data";
export const metadata:Metadata={title:"Revisiones"};
export default function ReviewsPage(){return <><div className="page-heading"><div><p className="eyebrow">Cola de trabajo</p><h1>Revisiones</h1><p>Procesos que necesitan una decisión, comentario o corrección.</p></div></div><div className="card"><div className="card-header"><div><h2>Pendientes de atención</h2><p>{reviews.length} procesos asignados a tu rol</p></div></div>{reviews.map((process)=><div className="review-card" key={process.code}><div className="review-icon">{process.status==="Observado"?<MessageSquareWarning size={19}/>:<ClipboardCheck size={19}/>}</div><div><h3>{process.code} · {process.name}</h3><p>{process.area} · Dueño: {process.owner} · v{process.version}</p></div><div className="review-actions"><StatusBadge status={process.status}/><Link className="button button-secondary" href={`/procesos/${process.code}`}>Revisar <ArrowRight size={14}/></Link></div></div>)}</div></>}
