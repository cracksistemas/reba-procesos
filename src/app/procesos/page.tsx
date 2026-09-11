import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { ProcessCatalog } from "@/components/process-catalog";
export const metadata:Metadata={title:"Procesos"};
export default async function ProcessesPage({ searchParams }: { searchParams: Promise<{ area?: string | string[]; subarea?: string | string[] }> }) {
  const query = await searchParams;
  const area = typeof query.area === "string" ? query.area : "Todas";
  const subarea = typeof query.subarea === "string" ? query.subarea : "Todas";
  return <><div className="page-heading"><div><p className="eyebrow">Catálogo</p><h1>Procesos</h1><p>Encuentra la versión vigente, su área, subárea, dueño y estado de aprobación.</p></div><button className="button button-primary"><Plus size={16}/> Crear proceso</button></div><ProcessCatalog initialArea={area} initialSubarea={subarea}/></>;
}
