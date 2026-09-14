import type { Metadata } from "next";
import { ProcessLibrary } from "@/components/process-library";

export const metadata: Metadata = { title: "Biblioteca de procesos" };

export default async function LibraryPage({ searchParams }: { searchParams: Promise<{ search?: string | string[] }> }) {
  const query = await searchParams;
  const search = typeof query.search === "string" ? query.search : "";
  return <>
    <div className="page-heading library-heading"><div><p className="eyebrow">Fuente única de consulta</p><h1>Biblioteca de procesos</h1><p>Explora la estructura institucional sin mezclar áreas, subáreas, procesos y editores en una sola pantalla.</p></div></div>
    <ProcessLibrary initialQuery={search}/>
  </>;
}
