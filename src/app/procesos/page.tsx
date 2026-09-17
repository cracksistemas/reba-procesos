import type { Metadata } from "next";
import { ProcessCatalog } from "@/components/process-catalog";

export const metadata: Metadata = { title: "Procesos y tareas" };

export default async function ProcessesPage({ searchParams }: { searchParams: Promise<{ area?: string | string[]; subarea?: string | string[] }> }) {
  const query = await searchParams;
  const area = typeof query.area === "string" ? query.area : "Todas";
  const subarea = typeof query.subarea === "string" ? query.subarea : "Todas";

  return <ProcessCatalog initialArea={area} initialSubarea={subarea}/>;
}
