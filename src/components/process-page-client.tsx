"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProcessDetail } from "@/components/process-detail";
import type { Process } from "@/lib/data";
import { useProcesses } from "@/lib/process-store";

type ProcessPageClientProps = {
  code: string;
  staticProcess?: Process;
};

export function ProcessPageClient({ code, staticProcess }: ProcessPageClientProps) {
  const allProcesses = useProcesses();
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);

  const process = useMemo(() => {
    if (staticProcess) return staticProcess;
    return allProcesses.find((p) => p.code.toLowerCase() === code.toLowerCase()) ?? null;
  }, [staticProcess, allProcesses, code]);

  if (!process) {
    if (!mounted) return null;
    return (
      <div className="card empty-state" style={{ margin: "40px auto", maxWidth: "600px", padding: "30px", textAlign: "center" }}>
        <h2>Proceso o tarea no encontrado</h2>
        <p>No se encontró ningún registro con el código <strong>{code}</strong>.</p>
        <div style={{ marginTop: "16px" }}>
          <Link className="button button-primary" href="/procesos">
            <ArrowLeft size={14}/> Volver al catálogo de procesos
          </Link>
        </div>
      </div>
    );
  }

  return <ProcessDetail process={process} />;
}
