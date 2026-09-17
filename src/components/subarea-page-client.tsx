"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SubareaWorkspace } from "@/components/subarea-workspace";
import { mergeSubareas, type Area, type Process, type Subarea } from "@/lib/data";
import { getFlowcharts, type Flowchart } from "@/lib/flowcharts";

type SubareaPageClientProps = {
  area: Area;
  subareaCode: string;
  staticSubarea?: Subarea;
  staticSiblings: Subarea[];
  staticProcesses: Process[];
  initialFlowCode?: string;
};

export function SubareaPageClient({
  area,
  subareaCode,
  staticSubarea,
  staticSiblings,
  staticProcesses,
  initialFlowCode,
}: SubareaPageClientProps) {
  const [storedSubareas, setStoredSubareas] = useState<Subarea[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = window.localStorage.getItem(`reba-subareas-${area.code}`);
      if (raw) {
        const parsed = JSON.parse(raw) as Subarea[];
        if (Array.isArray(parsed)) {
          setStoredSubareas(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, [area.code]);

  const allSiblings = useMemo(() => {
    return mergeSubareas(staticSiblings, storedSubareas);
  }, [staticSiblings, storedSubareas]);

  const subarea = useMemo(() => {
    if (staticSubarea) return staticSubarea;
    return allSiblings.find((s) => s.code.toLowerCase() === subareaCode.toLowerCase()) ?? null;
  }, [staticSubarea, allSiblings, subareaCode]);

  if (!subarea) {
    if (!mounted) {
      return null;
    }
    return (
      <div className="card empty-state" style={{ margin: "40px auto", maxWidth: "600px", padding: "30px", textAlign: "center" }}>
        <h2>Subárea no encontrada</h2>
        <p>No pudimos encontrar la subárea con código <strong>{subareaCode}</strong> en el área {area.name}.</p>
        <div style={{ marginTop: "16px" }}>
          <Link className="button button-primary" href={`/areas/${area.code}`}>
            <ArrowLeft size={14}/> Volver a {area.name}
          </Link>
        </div>
      </div>
    );
  }

  const flowcharts: Flowchart[] = getFlowcharts(subarea.code);
  const flowCounts = Object.fromEntries(
    allSiblings.map((item) => {
      const imported = getFlowcharts(item.code).length;
      const linked = staticProcesses.filter((process) => process.subareaCode === item.code).length;
      return [item.code, imported || linked || 1];
    })
  );

  const linkedProcesses = staticProcesses.filter((process) => process.subareaCode.toLowerCase() === subarea.code.toLowerCase());

  return (
    <SubareaWorkspace
      area={area}
      subarea={subarea}
      siblings={allSiblings}
      flowcharts={flowcharts}
      linkedProcesses={linkedProcesses}
      flowCounts={flowCounts}
      initialFlowCode={initialFlowCode}
    />
  );
}
