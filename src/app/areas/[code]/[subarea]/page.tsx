import { notFound } from "next/navigation";
import { SubareaPageClient } from "@/components/subarea-page-client";
import { getArea, getSubareas, processes, type Subarea } from "@/lib/data";
import { requireAreaAccess } from "@/lib/server/guards";

export async function generateMetadata(props: { params: Promise<{ code: string; subarea: string }> }) {
  const params = await props.params;
  const area = getArea(params.code);
  const item = (area?.code === "LOG" && params.subarea.toLowerCase() === "log") || (area?.code === "REC" && params.subarea.toLowerCase() === "rec")
    ? { name: area.name }
    : getSubareas(area?.code ?? "").find((candidate) => candidate.code.toLowerCase() === params.subarea.toLowerCase());
  return { title: item && area ? `${item.name} · ${area.name}` : "Subárea" };
}

export default async function SubareaPage(props: { params: Promise<{ code: string; subarea: string }>; searchParams: Promise<{ flujo?: string | string[]; editar?: string | string[] }> }) {
  const params = await props.params;
  const query = await props.searchParams;
  const area = getArea(params.code);
  if (!area) notFound();
  await requireAreaAccess(area.code);

  const isDirectAreaRoot = (area.code === "LOG" && params.subarea.toLowerCase() === "log") || (area.code === "REC" && params.subarea.toLowerCase() === "rec");
  const siblings: Subarea[] = isDirectAreaRoot ? [{ code: area.code, areaCode: area.code, name: area.name, description: area.description, owner: area.owner, flow: [], source: "Drive" }] : getSubareas(area.code);
  const subarea = siblings.find((candidate) => candidate.code.toLowerCase() === params.subarea.toLowerCase());
  const initialFlowCode = typeof query.flujo === "string" ? query.flujo : undefined;

  return (
    <SubareaPageClient
      area={area}
      subareaCode={params.subarea}
      staticSubarea={subarea}
      staticSiblings={siblings}
      staticProcesses={processes}
      initialFlowCode={initialFlowCode}
      initialEdit={query.editar === "1"}
    />
  );
}
