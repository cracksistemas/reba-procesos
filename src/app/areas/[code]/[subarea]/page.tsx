import { notFound } from "next/navigation";
import { SubareaPageClient } from "@/components/subarea-page-client";
import { getArea, getSubareas, processes, subareas } from "@/lib/data";

export function generateStaticParams() {
  return subareas.map((subarea) => ({ code: subarea.areaCode, subarea: subarea.code }));
}

export async function generateMetadata(props: { params: Promise<{ code: string; subarea: string }> }) {
  const params = await props.params;
  const area = getArea(params.code);
  const item = getSubareas(area?.code ?? "").find((candidate) => candidate.code.toLowerCase() === params.subarea.toLowerCase());
  return { title: item && area ? `${item.name} · ${area.name}` : "Subárea" };
}

export default async function SubareaPage(props: { params: Promise<{ code: string; subarea: string }>; searchParams: Promise<{ flujo?: string | string[] }> }) {
  const params = await props.params;
  const query = await props.searchParams;
  const area = getArea(params.code);
  if (!area) notFound();

  const siblings = getSubareas(area.code);
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
    />
  );
}
