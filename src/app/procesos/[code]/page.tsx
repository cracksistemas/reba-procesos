import { notFound } from "next/navigation";
import { ProcessDetail } from "@/components/process-detail";
import { getProcess, processes } from "@/lib/data";
export function generateStaticParams(){return processes.map((process)=>({code:process.code}))}
export async function generateMetadata(props:PageProps<"/procesos/[code]">){const {code}=await props.params;const process=getProcess(code);return {title:process?.name??"Proceso"}}
export default async function ProcessPage(props:PageProps<"/procesos/[code]">){const {code}=await props.params;const process=getProcess(code);if(!process)notFound();return <ProcessDetail process={process}/>}
