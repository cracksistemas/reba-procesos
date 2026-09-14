"use client";

import Link from "next/link";
import { FormEvent, useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { ArrowRight, CheckCircle2, GitBranch, Plus, Save, X } from "lucide-react";
import { FlowchartEditor } from "@/components/flowchart-editor";
import { mergeSubareas, type Area, type Process, type Subarea } from "@/lib/data";
import { getFlowcharts } from "@/lib/flowcharts";

type SubareaManagerProps = { area: Area; initialSubareas: Subarea[]; areaProcesses: Process[] };

const splitFlow = (value: string) => value
  .split(/[\n,>→]+/)
  .map((step) => step.trim())
  .filter(Boolean)
  .slice(0, 8);

export function SubareaManager({ area, initialSubareas, areaProcesses }: SubareaManagerProps) {
  const storageKey = `reba-subareas-${area.code}`;
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [customCanvas, setCustomCanvas] = useState<Subarea | null>(null);

  const subscribe = useCallback((onStoreChange: () => void) => {
    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === storageKey) onStoreChange();
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener(storageKey, onStoreChange);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(storageKey, onStoreChange);
    };
  }, [storageKey]);
  const getSnapshot = useCallback(() => window.localStorage.getItem(storageKey), [storageKey]);
  const storedValue = useSyncExternalStore(subscribe, getSnapshot, () => null);
  const items = useMemo(() => {
    if (!storedValue) return initialSubareas;
    try {
      return mergeSubareas(initialSubareas, JSON.parse(storedValue) as Subarea[]);
    } catch {
      return initialSubareas;
    }
  }, [initialSubareas, storedValue]);

  const persist = (next: Subarea[]) => {
    window.localStorage.setItem(storageKey, JSON.stringify(next));
    window.dispatchEvent(new Event(storageKey));
  };

  const nextCode = () => {
    const max = items.reduce((current, item) => {
      const match = item.code.match(/-S(\d+)$/);
      return Math.max(current, match ? Number(match[1]) : 0);
    }, 0);
    return `${area.code}-S${String(max + 1).padStart(2, "0")}`;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const owner = String(form.get("owner") ?? "").trim();
    const description = String(form.get("description") ?? "").trim();
    const flow = splitFlow(String(form.get("flow") ?? ""));
    if (!name || !owner || !description || flow.length < 2) {
      setError("Completa los datos e incluye al menos dos etapas del flujograma.");
      return;
    }
    const code = nextCode();
    persist([...items, { code, areaCode: area.code, name, owner, description, flow, source: "Usuario" }]);
    event.currentTarget.reset();
    setError("");
    setShowForm(false);
    setNotice(`${code} · ${name} se añadió correctamente.`);
    window.setTimeout(() => setNotice(""), 4500);
  };

  const documentedFlows = items.reduce((total, subarea) => {
    const imported = getFlowcharts(subarea.code).length;
    const related = areaProcesses.filter((process) => process.subareaCode === subarea.code).length;
    return total + (imported || related || 1);
  }, 0);

  return <>
    <div className="page-heading area-detail-heading">
      <div>
        <div className="breadcrumb"><Link href="/biblioteca">Biblioteca</Link> / <Link href="/areas">Áreas</Link> / <span>{area.code}</span></div>
        <p className="eyebrow">Área · elige una unidad para continuar</p>
        <h1>{area.name}</h1>
        <p>{area.description} Cada subárea reúne sus procesos, programas y flujogramas.</p>
      </div>
      <button className="button button-primary" onClick={() => setShowForm((current) => !current)}>
        {showForm ? <X size={16}/> : <Plus size={16}/>} {showForm ? "Cancelar" : "Nueva subárea"}
      </button>
    </div>

    {notice && <div className="pilot-banner" role="status"><CheckCircle2 size={17}/><span>{notice} <strong>Guardado en este navegador durante el piloto.</strong></span></div>}
    {error && <div className="form-error" role="alert">{error}</div>}

    {showForm && <form className="card subarea-form" onSubmit={handleSubmit}>
      <div className="card-header"><div><h2>Añadir subárea</h2><p>Se creará como {nextCode()} dentro de {area.name}.</p></div></div>
      <div className="form-grid">
        <label><span>Nombre de la subárea</span><input name="name" required placeholder="Ej. Talento humano" /></label>
        <label><span>Responsable</span><input name="owner" required placeholder="Cargo o nombre responsable" /></label>
        <label className="form-span"><span>Descripción</span><textarea name="description" required rows={2} placeholder="Qué gestiona esta subárea" /></label>
        <label className="form-span"><span>Etapas del flujograma</span><textarea name="flow" required rows={4} placeholder={'Una etapa por línea\nRecibir solicitud\nValidar información\nEjecutar actividad\nCerrar atención'} /></label>
      </div>
      <div className="form-actions"><button type="button" className="button button-secondary" onClick={() => setShowForm(false)}>Cancelar</button><button className="button button-primary" type="submit"><Save size={15}/> Guardar subárea</button></div>
    </form>}

    <section className="area-directory-summary" aria-label={`Resumen de ${area.name}`}>
      <div><strong>{items.length}</strong><span>Subáreas</span></div>
      <div><strong>{documentedFlows}</strong><span>Procesos y programas</span></div>
      <div><strong>{area.owner}</strong><span>Responsable del área</span></div>
    </section>

    <div className="directory-heading">
      <div><h2>Subáreas de {area.name}</h2><p>Selecciona una unidad para ver únicamente sus procesos y programas.</p></div>
      <span>{items.length} disponibles</span>
    </div>

    <section className="subarea-grid subarea-directory-grid" aria-label="Subáreas">
      {items.map((subarea) => {
        const related = areaProcesses.filter((process) => process.subareaCode === subarea.code);
        const imported = getFlowcharts(subarea.code);
        const total = imported.length || related.length || 1;
        const isCustom = subarea.source === "Usuario";

        return <article className="card subarea-browser-card" key={subarea.code}>
          <div className="subarea-card-head">
            <div className="subarea-icon" style={{ background: area.color }}><GitBranch size={18}/></div>
            <div><span className="detail-code">{subarea.code}</span><h2>{subarea.name}</h2></div>
            <span className={`source-label ${subarea.source === "Drive" ? "source-drive" : ""}`}>{subarea.source}</span>
          </div>
          <p className="subarea-description">{subarea.description}</p>
          <div className="subarea-card-facts"><span><strong>{total}</strong>{total === 1 ? " proceso o programa" : " procesos y programas"}</span><span>Madurez documental: <strong>{subarea.source === "Drive" ? "Documentada" : "En construcción"}</strong></span></div>
          <div className="subarea-browser-footer">
            <span>Responsable<br/><strong>{subarea.owner}</strong></span>
            {isCustom
              ? <button className="button button-ghost" onClick={() => setCustomCanvas(subarea)}>Abrir lienzo <ArrowRight size={14}/></button>
              : <Link className="button button-ghost" href={`/areas/${area.code}/${subarea.code}`}>Ver subárea <ArrowRight size={14}/></Link>}
          </div>
        </article>;
      })}
    </section>

    {customCanvas && <FlowchartEditor area={area} subarea={customCanvas} onClose={() => setCustomCanvas(null)}/>}
  </>;
}
