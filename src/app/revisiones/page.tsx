import type { Metadata } from "next";
import { ReviewsClient } from "@/components/reviews-client";
import { processes } from "@/lib/data";
export const metadata:Metadata={title:"Revisiones"};
export default function ReviewsPage(){return <><div className="page-heading"><div><p className="eyebrow">Cola de trabajo</p><h1>Revisiones</h1><p>Procesos que necesitan una decisión, comentario o corrección.</p></div></div><ReviewsClient initialProcesses={processes}/></>}
