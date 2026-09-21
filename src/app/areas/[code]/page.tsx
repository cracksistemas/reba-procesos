import { notFound } from "next/navigation";
import { SubareaManager } from "@/components/subarea-manager";
import { areas, getArea, getSubareas, processes } from "@/lib/data";

export function generateStaticParams() {
  return areas.map((area) => ({ code: area.code }));
}

export async function generateMetadata(props: { params: Promise<{ code: string }> }) {
  const { code } = await props.params;
  const area = getArea(code);
  return { title: area ? `${area.name} · Procesos` : "Área" };
}

export default async function AreaPage(props: { params: Promise<{ code: string }> }) {
  const { code } = await props.params;
  const area = getArea(code);
  if (!area) notFound();
  if (area.code === "LOG" || area.code === "REC") {
    return <SubareaManager area={area} initialSubareas={[{ code: area.code, areaCode: area.code, name: area.name, description: area.description, owner: area.owner, flow: [], source: "Drive" }]} areaProcesses={processes.filter((process) => process.area === area.name)} areaOnly />;
  }
  return <SubareaManager area={area} initialSubareas={getSubareas(area.code)} areaProcesses={processes.filter((process) => process.area === area.name)} />;
}
