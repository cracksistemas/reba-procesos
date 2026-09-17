import { ProcessPageClient } from "@/components/process-page-client";
import { getProcess, processes } from "@/lib/data";

export function generateStaticParams() {
  return processes.map((process) => ({ code: process.code }));
}

export async function generateMetadata(props: { params: Promise<{ code: string }> }) {
  const { code } = await props.params;
  const process = getProcess(code);
  return { title: process?.name ?? `Proceso ${code}` };
}

export default async function ProcessPage(props: { params: Promise<{ code: string }> }) {
  const { code } = await props.params;
  const process = getProcess(code);

  return <ProcessPageClient code={code} staticProcess={process} />;
}
