"use client";

import type { Process, ProcessStatus } from "@/lib/data";

type CloudResult = { synced: boolean; message?: string };

const statusToDatabase: Record<ProcessStatus, string> = { "Borrador": "draft", "En revisión": "in_review", "Observado": "observed", "Aprobado": "approved", "Obsoleto": "obsolete" };
const statusFromDatabase: Record<string, ProcessStatus> = { draft: "Borrador", in_review: "En revisión", observed: "Observado", approved: "Aprobado", obsolete: "Obsoleto" };

function criticalityToDatabase(value: Process["criticality"]) { return value === "Alta" ? "high" : value === "Baja" ? "low" : "medium"; }
function criticalityFromDatabase(value: string): Process["criticality"] { return value === "high" ? "Alta" : value === "low" ? "Baja" : "Media"; }

async function send(url: string, method: string, body: unknown): Promise<CloudResult> {
  const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
  if (response?.ok) return { synced: true };
  const data = await response?.json().catch(() => null) as { message?: string } | null;
  return { synced: false, message: data?.message ?? "No se pudo conectar con el servidor." };
}

export async function saveProcessToCloud(process: Process): Promise<CloudResult> {
  return send("/api/workspace/items", "POST", {
    code: process.code, item_type: process.type === "Tarea" ? "task" : "process",
    area_code: process.areaCode ?? process.subareaCode.slice(0, 3), subarea_code: process.subareaCode,
    name: process.name, owner_label: process.owner, objective: process.objective, scope: process.scope,
    tasks: process.tasks ?? [], status: statusToDatabase[process.status],
    criticality: criticalityToDatabase(process.criticality), version: process.version,
  });
}

export async function loadCloudProcesses(): Promise<Process[]> {
  const response = await fetch("/api/workspace/items").catch(() => null);
  const data: unknown = response?.ok ? await response.json().catch(() => null) : null;
  if (!Array.isArray(data)) return [];
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
  return send(`/api/workspace/flowcharts/${encodeURIComponent(input.flowCode)}`, "PUT", {
    areaCode: input.areaCode, subareaCode: input.subareaCode, title: input.title, description: input.description, snapshot: input.snapshot,
  });
}

export async function loadFlowchartFromCloud(flowCode: string): Promise<string | null> {
  const response = await fetch(`/api/workspace/flowcharts/${encodeURIComponent(flowCode)}`).catch(() => null);
  const data = response?.ok ? await response.json().catch(() => null) as { snapshot?: unknown } | null : null;
  return data?.snapshot ? JSON.stringify(data.snapshot) : null;
}
