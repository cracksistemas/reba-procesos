"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { mergeProcesses, processes as defaultProcesses, type Process, type ProcessType } from "@/lib/data";
import type { Flowchart } from "@/lib/flowcharts";
import type { ImportedFlowNode, ImportedFlowEdge } from "@/lib/marketing-flowcharts";
import { loadCloudProcesses, saveProcessToCloud } from "@/lib/workspace-cloud";

export const PROCESS_STORAGE_KEY = "reba-custom-processes";
export const PROCESS_EVENT_NAME = "reba-processes-changed";

export function getStoredProcesses(): Process[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PROCESS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Process[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function persistProcesses(items: Process[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROCESS_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(PROCESS_EVENT_NAME));
}

export function generateProcessCode(areaCode: string, subareaCode: string, type: ProcessType = "Proceso", existingProcesses: Process[]): string {
  const isTask = type === "Tarea";
  const prefix = isTask ? `${subareaCode || areaCode}-T` : `${subareaCode || areaCode}-P`;
  const pattern = new RegExp(`^${prefix}(\\d+)$`, "i");
  
  let max = 0;
  existingProcesses.forEach((p) => {
    const match = p.code.match(pattern);
    if (match) {
      max = Math.max(max, Number(match[1]));
    }
  });

  return `${prefix}${String(max + 1).padStart(2, "0")}`;
}

export function saveProcess(
  data: {
    code?: string;
    name: string;
    area: string;
    areaCode: string;
    subareaCode: string;
    subarea: string;
    owner: string;
    type?: ProcessType;
    criticality?: "Baja" | "Media" | "Alta";
    status?: Process["status"];
    objective?: string;
    scope?: string;
    tasks?: string[];
  },
  allExisting: Process[]
): Process {
  const type = data.type ?? "Proceso";
  const code = data.code?.trim() || generateProcessCode(data.areaCode, data.subareaCode, type, allExisting);
  const now = new Date();
  const dateStr = `Hoy, ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const newProcess: Process = {
    code,
    name: data.name.trim(),
    area: data.area,
    areaCode: data.areaCode,
    subareaCode: data.subareaCode,
    subarea: data.subarea,
    owner: data.owner.trim(),
    status: data.status ?? "Borrador",
    version: "0.1",
    updated: dateStr,
    criticality: data.criticality ?? "Media",
    objective: data.objective?.trim() || `Gestión de ${data.name.toLowerCase()} para ${data.subarea || data.area}.`,
    scope: data.scope?.trim() || "Desde la recepción de la tarea hasta la verificación y registro de evidencia.",
    nextReview: "Sin programar",
    completion: data.tasks && data.tasks.length > 0 ? 80 : 50,
    type,
    tasks: data.tasks && data.tasks.length > 0 ? data.tasks : ["Registrar solicitud o inicio", "Ejecutar actividad principal", "Validar cumplimiento y evidencias", "Cerrar y reportar resultado"],
    source: "Usuario",
  };

  const stored = getStoredProcesses();
  const index = stored.findIndex((p) => p.code.toLowerCase() === code.toLowerCase());
  let nextStored: Process[];
  if (index >= 0) {
    nextStored = [...stored];
    nextStored[index] = newProcess;
  } else {
    nextStored = [...stored, newProcess];
  }

  persistProcesses(nextStored);
  void saveProcessToCloud(newProcess);
  return newProcess;
}

export function deleteProcess(code: string) {
  const stored = getStoredProcesses();
  const nextStored = stored.filter((p) => p.code.toLowerCase() !== code.toLowerCase());
  persistProcesses(nextStored);
}

export function updateProcessStatus(process: Process, status: Process["status"]): Process {
  const now = new Date();
  const updated: Process = {
    ...process,
    status,
    updated: `Hoy, ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
  };
  const stored = getStoredProcesses();
  const existingIndex = stored.findIndex((item) => item.code.toLowerCase() === process.code.toLowerCase());
  const nextStored = existingIndex >= 0
    ? stored.map((item, index) => index === existingIndex ? updated : item)
    : [...stored, updated];
  persistProcesses(nextStored);
  void saveProcessToCloud(updated);
  return updated;
}

export function useProcesses(initialProcesses: Process[] = defaultProcesses): Process[] {
  const [cloudProcesses, setCloudProcesses] = useState<Process[]>([]);
  const subscribe = useCallback((onStoreChange: () => void) => {
    if (typeof window === "undefined") return () => {};
    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === PROCESS_STORAGE_KEY) onStoreChange();
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener(PROCESS_EVENT_NAME, onStoreChange);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(PROCESS_EVENT_NAME, onStoreChange);
    };
  }, []);

  const getSnapshot = useCallback(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem(PROCESS_STORAGE_KEY) ?? "";
  }, []);

  const getServerSnapshot = useCallback(() => "", []);

  const storedRaw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    let active = true;
    void loadCloudProcesses().then((items) => { if (active && items.length) setCloudProcesses(items); });
    return () => { active = false; };
  }, []);

  let stored: Process[] = [];
  try {
    if (storedRaw) {
      stored = JSON.parse(storedRaw) as Process[];
    }
  } catch {
    stored = [];
  }

  return mergeProcesses(mergeProcesses(initialProcesses, cloudProcesses), stored);
}

export function processToFlowchart(process: Process): Flowchart {
  const tasks = process.tasks && process.tasks.length > 0
    ? process.tasks
    : ["Registrar solicitud o inicio", "Ejecutar actividad principal", "Validar cumplimiento y evidencias", "Cerrar y reportar resultado"];

  const nodes: ImportedFlowNode[] = [
    {
      id: "start",
      kind: "start",
      label: `Inicio: ${process.name}`,
      role: process.owner,
      position: { x: 380, y: 40 },
      size: { width: 220, height: 64 },
      fill: "#e6f7f5",
      stroke: "#0f766e",
      textColor: "#0f615b",
    },
    ...tasks.map((taskLabel, idx) => ({
      id: `task-node-${idx + 1}`,
      kind: "activity" as const,
      label: taskLabel,
      role: process.owner,
      position: { x: 370, y: 160 + idx * 140 },
      size: { width: 240, height: 72 },
      fill: "#e8e9ff",
      stroke: "#5653a6",
      textColor: "#283549",
    })),
    {
      id: "end",
      kind: "end",
      label: `Fin: ${process.name} completado`,
      role: "Cierre",
      position: { x: 380, y: 160 + tasks.length * 140 },
      size: { width: 220, height: 64 },
      fill: "#eaf7ea",
      stroke: "#2e7d32",
      textColor: "#276b2b",
    },
  ];

  const edges: ImportedFlowEdge[] = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    edges.push({
      id: `edge-${nodes[i].id}-${nodes[i + 1].id}`,
      source: nodes[i].id,
      target: nodes[i + 1].id,
      label: "",
      route: "normal",
      sourceHandle: "bottom",
      targetHandle: "top",
    });
  }

  return {
    code: process.code,
    sourceId: process.code,
    subareaCode: process.subareaCode,
    subareaName: process.subarea,
    owner: process.owner,
    title: process.name,
    description: process.objective,
    context: process.scope,
    closure: `Cierre: ${process.name} concluido satisfactoriamente y registrado en el sistema.`,
    canvas: { width: 1000, height: 260 + tasks.length * 140 },
    nodes,
    edges,
  };
}
