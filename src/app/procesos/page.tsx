import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { ProcessCatalog } from "@/components/process-catalog";
export const metadata:Metadata={title:"Procesos"};
export default function ProcessesPage(){return <><div className="page-heading"><div><p className="eyebrow">Catálogo</p><h1>Procesos</h1><p>Encuentra la versión vigente, su dueño y estado de aprobación.</p></div><button className="button button-primary"><Plus size={16}/> Crear proceso</button></div><ProcessCatalog/></>}
