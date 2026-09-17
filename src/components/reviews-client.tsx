"use client";

import Link from "next/link";
import { ArrowRight, ClipboardCheck, MessageSquareWarning } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import type { Process } from "@/lib/data";
import { useProcesses } from "@/lib/process-store";

export function ReviewsClient({ initialProcesses }: { initialProcesses: Process[] }) {
  const allProcesses = useProcesses(initialProcesses);
  const reviews = allProcesses.filter((process) => process.status === "En revisión" || process.status === "Observado");
  return <div className="card">
    <div className="card-header"><div><h2>Pendientes de atención</h2><p>{reviews.length} procesos asignados a tu rol</p></div></div>
    {reviews.length ? reviews.map((process) => <div className="review-card" key={process.code}>
      <div className="review-icon">{process.status === "Observado" ? <MessageSquareWarning size={19}/> : <ClipboardCheck size={19}/>}</div>
      <div><h3>{process.code} · {process.name}</h3><p>{process.area} · Dueño: {process.owner} · v{process.version}</p></div>
      <div className="review-actions"><StatusBadge status={process.status}/><Link className="button button-secondary" href={`/procesos/${process.code}`}>Revisar <ArrowRight size={14}/></Link></div>
    </div>) : <div className="empty-state"><ClipboardCheck size={24}/><strong>No hay revisiones pendientes</strong><p>Todos los procesos revisados fueron aprobados o devueltos para edición.</p></div>}
  </div>;
}
