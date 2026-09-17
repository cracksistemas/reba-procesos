"use client";

import type { Process, ProcessStatus } from "@/lib/data";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

type CloudResult = { synced: boolean; message?: string };

const statusToDatabase: Record<ProcessStatus, string> = { "Borrador": "draft", "En revisión": "in_review", "Observado": "observed", "Aprobado": "approved", "Obsoleto": "obsolete" };
const statusFromDatabase: Record<string, ProcessStatus> = { draft: "Borrador", in_review: "En revisión", observed: "Observado", approved: "Aprobado", obsolete: "Obsoleto" };

function criticalityToDatabase(value: Process["criticality"]) { return value === "Alta" ? "high" : value === "Baja" ? "low" : "medium"; }
function criticalityFromDatabase(value: string): Process["criticality"] { return value === "high" ? "Alta" : value === "low" ? "Baja" : "Media"; }

async function authenticatedClient(): Promise<{ client: ReturnType<typeof createClient> } | { message: string }> {
  if (!isSupabaseConfigured()) return { message: "Supabase aún no está configurado en este despliegue." };
  const client = createClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return { message: "Inicia sesión para guardar este cambio en la nube." };
  return { client };
}

export async function saveProcessToCloud(process: Process): Promise<CloudResult> {
  const connection = await authenticatedClient();
  if ("message" in connection) return { synced: false, message: connection.message };
  const { error } = await connection.client.rpc("save_workspace_item", { p_item: {
    code: process.code, item_type: process.type === "Tarea" ? "task" : "process",
    area_code: process.areaCode ?? process.subareaCode.slice(0, 3), subarea_code: process.subareaCode,
    name: process.name, owner_label: process.owner, objective: process.objective, scope: process.scope,
    tasks: process.tasks ?? [], status: statusToDatabase[process.status],
    criticality: criticalityToDatabase(process.criticality), version: process.version,
  } });
  return error ? { synced: false, message: error.message } : { synced: true };
}

export async function loadCloudProcesses(): Promise<Process[]> {
  const connection = await authenticatedClient();
  if ("message" in connection) return [];
  const { data, error } = await connection.client.rpc("get_workspace_items");
  if (error || !Array.isArray(data)) return [];
  return data.map((row) => {
    const item = row as Record<string, unknown>;
    const updatedAt = typeof item.updated_at === "string" ? new Date(item.updated_at) : new Date();
    const tasks = Array.isArray(item.tasks) ? item.tasks.filter((task): task is string => typeof task === "string") : [];
    return {
      code: String(item.code), name: String(item.name), area: String(item.area_name), areaCode: String(item.area_code),
      subareaCode: String(item.subarea_code), subarea: String(item.subarea_name), owner: String(item.owner_label || "Responsable pendiente"),
      status: statusFromDatabase[String(item.status)] ?? "Borrador", version: String(item.version || "0.1"),
      updated: `Nube · ${updatedAt.toLocaleDateString("es-PE")}`, criticality: criticalityFromDatabase(String(item.criticality)),
      objective: String(item.objective || ""), scope: String(item.scope || ""), nextReview: "Sin programar",
      completion: tasks.length > 0 ? 80 : 50, type: item.item_type === "task" ? "Tarea" : "Proceso", tasks, source: "Usuario",
    } satisfies Process;
  });
}

export async function saveFlowchartToCloud(input: { flowCode: string; areaCode: string; subareaCode: string; title: string; description: string; snapshot: unknown }): Promise<CloudResult> {
  const connection = await authenticatedClient();
  if ("message" in connection) return { synced: false, message: connection.message };
  const { error } = await connection.client.rpc("save_flowchart_document", {
    p_flow_code: input.flowCode, p_area_code: input.areaCode, p_subarea_code: input.subareaCode,
    p_title: input.title, p_description: input.description, p_snapshot: input.snapshot,
    p_change_summary: "Edición visual desde REBA Procesos",
  });
  return error ? { synced: false, message: error.message } : { synced: true };
}

export async function loadFlowchartFromCloud(flowCode: string): Promise<string | null> {
  const connection = await authenticatedClient();
  if ("message" in connection) return null;
  const { data, error } = await connection.client.rpc("get_flowchart_document", { p_flow_code: flowCode });
  return error || !data ? null : JSON.stringify(data);
}
