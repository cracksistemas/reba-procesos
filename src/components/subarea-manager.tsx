"use client";

import Link from "next/link";
import { FormEvent, useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { ArrowRight, CheckCircle2, GitBranch, Layers, LayoutGrid, ListChecks, Plus, Save, Search, X } from "lucide-react";
import { FlowchartEditor } from "@/components/flowchart-editor";
import { StatusBadge } from "@/components/status-badge";
import { mergeSubareas, type Area, type Process, type ProcessType, type Subarea } from "@/lib/data";
import { getFlowcharts } from "@/lib/flowcharts";
import { saveProcess, useProcesses } from "@/lib/process-store";

type SubareaManagerProps = { area: Area; initialSubareas: Subarea[]; areaProcesses: Process[] };

const splitLines = (value: string) => value
  .split(/[\n,>→]+/)
  .map((step) => step.trim())
  .filter(Boolean)
  .slice(0, 10);

export function SubareaManager({ area, initialSubareas, areaProcesses }: SubareaManagerProps) {
  const storageKey = `reba-subareas-${area.code}`;
  const [activeTab, setActiveTab] = useState<"subareas" | "processes">("subareas");
  const [showSubareaForm, setShowSubareaForm] = useState(false);
  const [showProcessForm, setShowProcessForm] = useState(false);
  const [selectedSubareaCode, setSelectedSubareaCode] = useState<string>("");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [customCanvas, setCustomCanvas] = useState<Subarea | null>(null);

  // Subareas persistence
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

  const nextSubareaCode = () => {
    const max = items.reduce((current, item) => {
      const match = item.code.match(/-S(\d+)$/);
      return Math.max(current, match ? Number(match[1]) : 0);
    }, 0);
    return `${area.code}-S${String(max + 1).padStart(2, "0")}`;
  };

  // Processes persistence and reactive hook
  const allProcesses = useProcesses(areaProcesses);
  const currentAreaProcesses = useMemo(
    () => allProcesses.filter((p) => p.areaCode === area.code || p.subareaCode.startsWith(`${area.code}-`) || p.area === area.name),
    [allProcesses, area.code, area.name]
  );

  const handleSubareaSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const owner = String(form.get("owner") ?? "").trim();
    const description = String(form.get("description") ?? "").trim();
    const flow = splitLines(String(form.get("flow") ?? ""));
    if (!name || !owner || !description || flow.length < 2) {
      setError("Completa los datos e incluye al menos dos etapas del flujograma.");
      return;
    }
    const code = nextSubareaCode();
    persist([...items, { code, areaCode: area.code, name, owner, description, flow, source: "Usuario" }]);
    event.currentTarget.reset();
    setError("");
    setShowSubareaForm(false);
    setNotice(`${code} · ${name} se añadió correctamente.`);
    window.setTimeout(() => setNotice(""), 4500);
  };

  const handleProcessSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const targetSubCode = String(form.get("subareaCode") ?? "").trim() || items[0]?.code;
    const targetSub = items.find((s) => s.code === targetSubCode) || items[0];
    const name = String(form.get("name") ?? "").trim();
    const type = (form.get("type") as ProcessType) || "Proceso";
    const owner = String(form.get("owner") ?? "").trim() || targetSub?.owner || area.owner;
    const criticality = (form.get("criticality") as "Baja" | "Media" | "Alta") || "Media";
    const objective = String(form.get("objective") ?? "").trim();
    const tasks = splitLines(String(form.get("tasks") ?? ""));

    if (!name || !targetSub) {
      setError("Completa el nombre y selecciona la subárea correspondiente.");
      return;
    }

    const saved = saveProcess(
      {
        name,
        type,
        area: area.name,
        areaCode: area.code,
        subareaCode: targetSub.code,
        subarea: targetSub.name,
        owner,
        criticality,
        status: "Borrador",
        objective,
        tasks: tasks.length > 0 ? tasks : undefined,
      },
      allProcesses
    );

    event.currentTarget.reset();
    setError("");
    setShowProcessForm(false);
    setNotice(`${saved.code} · ${saved.name} se agregó con éxito a ${targetSub.name}.`);
    window.setTimeout(() => setNotice(""), 4500);
  };

  const documentedFlows = items.reduce((total, subarea) => {
    const imported = getFlowcharts(subarea.code).length;
    const related = currentAreaProcesses.filter((process) => process.subareaCode === subarea.code).length;
    return total + Math.max(1, imported + related);
  }, 0);

  const filteredProcesses = useMemo(() => {
    if (!query.trim()) return currentAreaProcesses;
    const q = query.toLowerCase();
    return currentAreaProcesses.filter(
      (p) => `${p.code} ${p.name} ${p.owner} ${p.subarea} ${p.objective}`.toLowerCase().includes(q)
    );
  }, [currentAreaProcesses, query]);

  return <>
    <div className="page-heading area-detail-heading">
      <div>
        <div className="breadcrumb"><Link href="/biblioteca">Biblioteca</Link> / <Link href="/areas">Áreas</Link> / <span>{area.code}</span></div>
        <p className="eyebrow">Área institucional · Gestión de estructura y flujos</p>
        <h1>{area.name}</h1>
        <p>{area.description} Administra sus subáreas, múltiples tareas y procesos operativos.</p>
      </div>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <button
          className="button button-secondary"
          onClick={() => { setShowSubareaForm((curr) => !curr); setShowProcessForm(false); }}
        >
          {showSubareaForm ? <X size={16}/> : <Plus size={16}/>} {showSubareaForm ? "Cancelar" : "Nueva subárea"}
        </button>
        <button
          className="button button-primary"
          onClick={() => {
            setSelectedSubareaCode(items[0]?.code ?? "");
            setShowProcessForm((curr) => !curr);
            setShowSubareaForm(false);
          }}
        >
          {showProcessForm ? <X size={16}/> : <Plus size={16}/>} {showProcessForm ? "Cancelar" : "Añadir proceso / tarea"}
        </button>
      </div>
    </div>

    {notice && <div className="pilot-banner" role="status"><CheckCircle2 size={17}/><span>{notice} <strong>Guardado con éxito en este navegador.</strong></span></div>}
    {error && <div className="form-error" role="alert">{error}</div>}

    {/* Form: New Subarea */}
    {showSubareaForm && <form className="card subarea-form" onSubmit={handleSubareaSubmit}>
      <div className="card-header">
        <div>
          <h2>Añadir subárea a {area.name}</h2>
          <p>Se creará como {nextSubareaCode()} dentro de {area.name}.</p>
        </div>
      </div>
      <div className="form-grid">
        <label><span>Nombre de la subárea</span><input name="name" required placeholder="Ej. Talento humano / Adquisiciones" /></label>
        <label><span>Responsable</span><input name="owner" required placeholder="Cargo o nombre del responsable" /></label>
        <label className="form-span"><span>Descripción</span><textarea name="description" required rows={2} placeholder="Qué gestiona esta subárea" /></label>
        <label className="form-span"><span>Etapas del flujograma base (una por línea)</span><textarea name="flow" required rows={4} placeholder={"Recibir solicitud\nValidar información\nEjecutar actividad\nCerrar atención"} /></label>
      </div>
      <div className="form-actions">
        <button type="button" className="button button-secondary" onClick={() => setShowSubareaForm(false)}>Cancelar</button>
        <button className="button button-primary" type="submit"><Save size={15}/> Guardar subárea</button>
      </div>
    </form>}

    {/* Form: New Process or Task */}
    {showProcessForm && <form className="card subarea-form" onSubmit={handleProcessSubmit}>
      <div className="card-header">
        <div>
          <h2>Añadir proceso o tarea al área {area.name}</h2>
          <p>Crea una nueva tarea o proceso y asígnalo a una de sus subáreas con sus etapas operativas.</p>
        </div>
      </div>
      <div className="form-grid">
        <label>
          <span>Subárea destino</span>
          <select
            name="subareaCode"
            value={selectedSubareaCode || (items[0]?.code ?? "")}
            onChange={(e) => setSelectedSubareaCode(e.target.value)}
            required
          >
            {items.map((sub) => (
              <option key={sub.code} value={sub.code}>{sub.code} · {sub.name}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Tipo de elemento</span>
          <select name="type" defaultValue="Proceso">
            <option value="Proceso">Proceso (Flujo institucional)</option>
            <option value="Tarea">Tarea (Actividad operativa específica)</option>
          </select>
        </label>
        <label>
          <span>Nombre del proceso o tarea</span>
          <input name="name" required placeholder="Ej. Control de caja chica / Elaboración de reportes" />
        </label>
        <label>
          <span>Responsable</span>
          <input name="owner" placeholder="Nombre o cargo responsable" defaultValue={items.find((s) => s.code === selectedSubareaCode)?.owner ?? area.owner} />
        </label>
        <label>
          <span>Criticidad</span>
          <select name="criticality" defaultValue="Media">
            <option value="Baja">Baja</option>
            <option value="Media">Media</option>
            <option value="Alta">Alta</option>
          </select>
        </label>
        <label>
          <span>Objetivo</span>
          <input name="objective" placeholder="Propósito del proceso o tarea" />
        </label>
        <label className="form-span">
          <span>Tareas o etapas del flujo (una por línea)</span>
          <textarea
            name="tasks"
            rows={4}
            placeholder={"Paso 1: Recepción del requerimiento\nPaso 2: Validación y control previo\nPaso 3: Ejecución de la tarea\nPaso 4: Conformidad y registro"}
          />
        </label>
      </div>
      <div className="form-actions">
        <button type="button" className="button button-secondary" onClick={() => setShowProcessForm(false)}>Cancelar</button>
        <button className="button button-primary" type="submit"><Save size={15}/> Guardar proceso / tarea</button>
      </div>
    </form>}

    <section className="area-directory-summary" aria-label={`Resumen de ${area.name}`}>
      <div><strong>{items.length}</strong><span>Subáreas</span></div>
      <div><strong>{documentedFlows}</strong><span>Procesos y programas</span></div>
      <div><strong>{currentAreaProcesses.length}</strong><span>Registros activos</span></div>
      <div><strong>{area.owner}</strong><span>Responsable del área</span></div>
    </section>

    {/* Navigation tabs */}
    <div className="tabs" role="tablist" aria-label="Vistas del área" style={{ marginBottom: "20px" }}>
      <button
        className={`tab ${activeTab === "subareas" ? "active" : ""}`}
        onClick={() => setActiveTab("subareas")}
        role="tab"
        aria-selected={activeTab === "subareas"}
      >
        <LayoutGrid size={15}/> Subáreas ({items.length})
      </button>
      <button
        className={`tab ${activeTab === "processes" ? "active" : ""}`}
        onClick={() => setActiveTab("processes")}
        role="tab"
        aria-selected={activeTab === "processes"}
      >
        <Layers size={15}/> Procesos y tareas del área ({currentAreaProcesses.length})
      </button>
    </div>

    {activeTab === "subareas" ? <>
      <div className="directory-heading">
        <div><h2>Subáreas de {area.name}</h2><p>Selecciona una subárea para ver sus procesos, tareas y flujogramas.</p></div>
        <span>{items.length} disponibles</span>
      </div>

      <section className="subarea-grid subarea-directory-grid" aria-label="Subáreas">
        {items.map((subarea) => {
          const related = currentAreaProcesses.filter((process) => process.subareaCode === subarea.code);
          const imported = getFlowcharts(subarea.code);
          const total = Math.max(1, imported.length + related.length);
          const isCustom = subarea.source === "Usuario";

          return <article className="card subarea-browser-card" key={subarea.code}>
            <div className="subarea-card-head">
              <div className="subarea-icon" style={{ background: area.color }}><GitBranch size={18}/></div>
              <div><span className="detail-code">{subarea.code}</span><h2>{subarea.name}</h2></div>
              <span className={`source-label ${subarea.source === "Drive" ? "source-drive" : ""}`}>{subarea.source}</span>
            </div>
            <p className="subarea-description">{subarea.description}</p>
            <div className="subarea-card-facts">
              <span><strong>{total}</strong>{total === 1 ? " proceso o tarea" : " procesos y tareas"}</span>
              <span>Madurez documental: <strong>{subarea.source === "Drive" ? "Documentada" : "En construcción"}</strong></span>
            </div>
            <div className="subarea-browser-footer">
              <span>Responsable<br/><strong>{subarea.owner}</strong></span>
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  className="button button-ghost"
                  title="Añadir proceso o tarea a esta subárea"
                  onClick={() => {
                    setSelectedSubareaCode(subarea.code);
                    setShowProcessForm(true);
                    setShowSubareaForm(false);
                    window.scrollTo({ top: 120, behavior: "smooth" });
                  }}
                >
                  <Plus size={14}/> Tarea/Proceso
                </button>
                {isCustom
                  ? <button className="button button-ghost" onClick={() => setCustomCanvas(subarea)}>Abrir lienzo <ArrowRight size={14}/></button>
                  : <Link className="button button-ghost" href={`/areas/${area.code}/${subarea.code}`}>Ver subárea <ArrowRight size={14}/></Link>}
              </div>
            </div>
          </article>;
        })}
      </section>
    </> : <>
      <div className="filter-bar" style={{ marginBottom: "16px" }}>
        <label className="search-input">
          <Search size={17}/>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar procesos o tareas en esta área por código, nombre o responsable…"
          />
        </label>
      </div>

      <div className="card table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Proceso / Tarea</th>
              <th>Subárea</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>Versión</th>
              <th>Responsable</th>
              <th aria-label="Acciones"/>
            </tr>
          </thead>
          <tbody>
            {filteredProcesses.map((item) => (
              <tr key={item.code}>
                <td>
                  <Link className="table-code" href={`/areas/${area.code}/${item.subareaCode}?flujo=${item.code}`}>
                    {item.code}
                  </Link>
                </td>
                <td>
                  <span className="table-primary">{item.name}</span>
                  <span className="table-secondary">{item.objective}</span>
                </td>
                <td>
                  <span>{item.subarea}</span>
                  <span className="table-secondary">{item.subareaCode}</span>
                </td>
                <td>
                  <span className="status draft" style={{ fontSize: "10px" }}>{item.type ?? "Proceso"}</span>
                </td>
                <td><StatusBadge status={item.status}/></td>
                <td>v{item.version}</td>
                <td>{item.owner}</td>
                <td className="table-actions">
                  <Link
                    className="icon-button"
                    href={`/areas/${area.code}/${item.subareaCode}?flujo=${item.code}`}
                    aria-label={`Abrir ${item.name}`}
                    title="Abrir en subárea"
                  >
                    <ArrowRight size={16}/>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredProcesses.length === 0 && (
          <div className="empty-state">
            <strong>No se encontraron procesos ni tareas</strong>
            <p>Usa el botón superior "Añadir proceso / tarea" para crear el primero en esta área.</p>
          </div>
        )}
      </div>
    </>}

    {customCanvas && <FlowchartEditor area={area} subarea={customCanvas} onClose={() => setCustomCanvas(null)}/>}
  </>;
}
