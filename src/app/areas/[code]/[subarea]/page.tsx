import { notFound } from "next/navigation";
import { SubareaWorkspace } from "@/components/subarea-workspace";
import { getArea, getSubareas, processes, subareas } from "@/lib/data";
import { getMarketingFlowcharts } from "@/lib/marketing-flowcharts";

export function generateStaticParams() {
  return subareas.map((subarea) => ({ code: subarea.areaCode, subarea: subarea.code }));
}

export async function generateMetadata(props: { params: Promise<{ code: string; subarea: string }> }) {
  const params = await props.params;
  const area = getArea(params.code);
  const item = getSubareas(area?.code ?? "").find((candidate) => candidate.code.toLowerCase() === params.subarea.toLowerCase());
  return { title: item && area ? `${item.name} · ${area.name}` : "Subárea" };
}

export default async function SubareaPage(props: { params: Promise<{ code: string; subarea: string }> }) {
  const params = await props.params;
  const area = getArea(params.code);
  if (!area) notFound();
  const siblings = getSubareas(area.code);
  const subarea = siblings.find((candidate) => candidate.code.toLowerCase() === params.subarea.toLowerCase());
  if (!subarea) notFound();

  const flowcharts = area.code === "MKT" ? getMarketingFlowcharts(subarea.code) : [];
  const flowCounts = Object.fromEntries(siblings.map((item) => {
    const imported = area.code === "MKT" ? getMarketingFlowcharts(item.code).length : 0;
    const linked = processes.filter((process) => process.subareaCode === item.code).length;
    return [item.code, imported || linked || 1];
  }));

  return <SubareaWorkspace area={area} subarea={subarea} siblings={siblings} flowcharts={flowcharts} flowCounts={flowCounts}/>;
}
