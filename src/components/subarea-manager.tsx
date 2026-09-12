"use client";

import Link from "next/link";
import { FormEvent, useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { ArrowRight, CheckCircle2, GitBranch, Pencil, Plus, Save, X } from "lucide-react";
import { FlowchartEditor } from "@/components/flowchart-editor";
import type { Area, Process, Subarea } from "@/lib/data";

type SubareaManagerProps = {
  area: Area;
  initialSubareas: Subarea[];
  areaProcesses: Process[];
};

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
  const [activeFlowchart, setActiveFlowchart] = useState<Subarea | null>(null);

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
      const stored = JSON.parse(storedValue) as Subarea[];
      const byCode = new Map(initialSubareas.map((item) => [item.code, item]));
      stored.forEach((item) => byCode.set(item.code, item));
      return Array.from(byCode.values());
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

  return <>
    <div className="page-heading area-detail-heading">
      <div>
        <div className="breadcrumb"><Link href="/areas">Áreas</Link> / <span>{area.code}</span></div>
        <p className="eyebrow">Estructura organizacional</p>
        <h1>{area.name}</h1>
        <p>{area.description} Dueño: {area.owner}.</p>
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

    <section className="card area-structure" aria-label={`Estructura de ${area.name}`}>
      <div className="card-header"><div><h2>Mapa de subáreas</h2><p>Secuencia referencial de coordinación interna.</p></div><span className="structure-count">{items.length} subáreas</span></div>
      <div className="subarea-map">
        <div className="flow-node start">{area.name}</div>
        <ArrowRight className="flow-arrow" size={18}/>
        <div className="subarea-map-list">{items.map((item) => <a href={`#${item.code}`} className="map-node" key={item.code}>{item.name}</a>)}</div>
      </div>
    </section>

    <section className="subarea-grid" aria-label="Subáreas">
      {items.map((subarea) => {
        const related = areaProcesses.filter((process) => process.subareaCode === subarea.code);
        return <article className="card subarea-card" id={subarea.code} key={subarea.code}>
          <div className="subarea-card-head">
            <div className="subarea-icon" style={{ background: area.color }}><GitBranch size={18}/></div>
            <div><span className="detail-code">{subarea.code}</span><h2>{subarea.name}</h2></div>
            <span className={`source-label ${subarea.source === "Drive" ? "source-drive" : ""}`}>{subarea.source}</span>
          </div>
          <p className="subarea-description">{subarea.description}</p>
          <div className="subarea-meta"><span>Responsable</span><strong>{subarea.owner}</strong><span>Procesos vinculados</span><strong>{related.length}</strong></div>
          <div className="mini-flow-header"><strong>Flujograma de la subárea</strong><button className="text-button" onClick={() => setActiveFlowchart(subarea)}><Pencil size={13}/> Editar visualmente</button></div>
          <div className="mini-flow"><div className="mini-flow-terminal">Inicio</div>{subarea.flow.map((step, index) => <div className="mini-flow-step" key={`${subarea.code}-${step}`}><ArrowRight size={14}/><strong>{step}</strong>{index === subarea.flow.length - 1 && <><ArrowRight size={14}/><div className="mini-flow-terminal end">Fin</div></>}</div>)}</div>
          <div className="subarea-footer"><span>{related.length ? related.map((process) => process.code).join(" · ") : "Lista para vincular procesos"}</span><div><button className="button button-secondary" onClick={() => setActiveFlowchart(subarea)}><GitBranch size={14}/> Abrir lienzo</button><Link className="button button-ghost" href={`/procesos?area=${area.code}&subarea=${subarea.code}`}>Ver procesos <ArrowRight size={14}/></Link></div></div>
        </article>;
      })}
    </section>
    {activeFlowchart && <FlowchartEditor area={area} subarea={activeFlowchart} onClose={() => setActiveFlowchart(null)}/>}
  </>;
}
