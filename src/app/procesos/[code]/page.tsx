import { ProcessPageClient } from "@/components/process-page-client";
import { getProcess } from "@/lib/data";
import { requireAreaAccess } from "@/lib/server/guards";

export async function generateMetadata(props: { params: Promise<{ code: string }> }) {
  const { code } = await props.params;
  const process = getProcess(code);
  return { title: process?.name ?? `Proceso ${code}` };
}

export default async function ProcessPage(props: { params: Promise<{ code: string }> }) {
  const { code } = await props.params;
  const process = getProcess(code);
  await requireAreaAccess(process?.areaCode ?? code.slice(0, 3));

  return <ProcessPageClient code={code} staticProcess={process} />;
}
