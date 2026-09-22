"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Plus, Save, Search, X } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { areas as allAreas, processes as defaultProcesses, subareas as allDefaultSubareas, type ProcessType } from "@/lib/data";
import { canSeeArea, useSession } from "@/lib/session-context";
import { saveProcess, useProcesses } from "@/lib/process-store";

const splitTasks = (value: string) => value
  .split(/[\n,>→]+/)
  .map((step) => step.trim())
  .filter(Boolean);

export function ProcessCatalog({ initialArea = "Todas", initialSubarea = "Todas" }: { initialArea?: string; initialSubarea?: string }) {
  const { user } = useSession();
  const areas = useMemo(() => allAreas.filter((item) => canSeeArea(user, item.code)), [user]);
  const defaultSubareas = useMemo(() => allDefaultSubareas.filter((item) => canSeeArea(user, item.areaCode)), [user]);
  const allProcesses = useProcesses(defaultProcesses);
  const [query, setQuery] = useState("");
  const [area, setArea] = useState(initialArea);
  const [subarea, setSubarea] = useState(initialSubarea);
  const [typeFilter, setTypeFilter] = useState("Todos");
  const [status, setStatus] = useState("Todos");

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [formAreaCode, setFormAreaCode] = useState(areas[0]?.code ?? "COM");
  const [formSubareaCode, setFormSubareaCode] = useState(defaultSubareas[0]?.code ?? "");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const availableFormSubareas = useMemo(
    () => defaultSubareas.filter((item) => item.areaCode === formAreaCode),
    [defaultSubareas, formAreaCode]
  );

  const subareaOptions = useMemo(
    () => defaultSubareas.filter((item) => area === "Todas" || item.areaCode === area),
    [defaultSubareas, area]
  );

  const filtered = useMemo(() => allProcesses.filter((item) => {
    const haystack = `${item.code} ${item.name} ${item.owner} ${item.area} ${item.subarea} ${item.objective}`.toLowerCase();
    const matchesQuery = !query || haystack.includes(query.toLowerCase());
    const matchesArea = area === "Todas" || item.areaCode === area || item.subareaCode.startsWith(`${area}-`);
    const matchesSubarea = subarea === "Todas" || item.subareaCode.toLowerCase() === subarea.toLowerCase();
    const matchesType = typeFilter === "Todos" || (typeFilter === "Tareas" ? item.type === "Tarea" || item.code.includes("-T") : item.type !== "Tarea" && !item.code.includes("-T"));
    const matchesStatus = status === "Todos" || item.status === status;
    return matchesQuery && matchesArea && matchesSubarea && matchesType && matchesStatus;
  }), [allProcesses, query, area, subarea, typeFilter, status]);

  const handleCreateProcess = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const type = (form.get("type") as ProcessType) || "Proceso";
    const selectedArea = areas.find((a) => a.code === formAreaCode);
    const selectedSub = defaultSubareas.find((s) => s.code === formSubareaCode) || availableFormSubareas[0];
    const owner = String(form.get("owner") ?? "").trim() || selectedSub?.owner || selectedArea?.owner || "";
    const criticality = (form.get("criticality") as "Baja" | "Media" | "Alta") || "Media";
    const objective = String(form.get("objective") ?? "").trim();
    const tasks = splitTasks(String(form.get("tasks") ?? ""));

    if (!name || !selectedArea || !selectedSub) {
      setError("Completa los campos requeridos para registrar el proceso o tarea.");
      return;
    }

    const saved = saveProcess(
      {
        name,
        type,
        area: selectedArea.name,
        areaCode: selectedArea.code,
        subareaCode: selectedSub.code,
        subarea: selectedSub.name,
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
    setShowForm(false);
    setNotice(`${saved.code} · ${saved.name} se registró con éxito en ${selectedArea.name} / ${selectedSub.name}.`);
    window.setTimeout(() => setNotice(""), 4500);
  };

  return <>
    <div className="page-heading">
      <div>
        <p className="eyebrow">Catálogo institucional</p>
        <h1>Procesos y tareas</h1>
        <p>Encuentra la versión vigente, su área, subárea, dueño y estado de aprobación.</p>
      </div>
      <button className="button button-primary" onClick={() => setShowForm((current) => !current)}>
        {showForm ? <X size={16}/> : <Plus size={16}/>} {showForm ? "Cancelar" : "Crear proceso o tarea"}
      </button>
    </div>

    {notice && <div className="pilot-banner" role="status"><CheckCircle2 size={17}/><span>{notice} <strong>Guardado con éxito.</strong></span></div>}
    {error && <div className="form-error" role="alert">{error}</div>}

    {showForm && <form className="card subarea-form" onSubmit={handleCreateProcess}>
      <div className="card-header">
        <div>
          <h2>Crear nuevo proceso o tarea</h2>
          <p>Selecciona el área y subárea correspondientes y define las etapas o tareas operativas.</p>
        </div>
      </div>
      <div className="form-grid">
        <label>
          <span>Área institucional</span>
          <select
            value={formAreaCode}
            onChange={(e) => {
              setFormAreaCode(e.target.value);
              const subs = defaultSubareas.filter((s) => s.areaCode === e.target.value);
              if (subs.length > 0) setFormSubareaCode(subs[0].code);
            }}
            required
          >
            {areas.map((a) => <option key={a.code} value={a.code}>{a.name} ({a.code})</option>)}
          </select>
        </label>
        <label>
          <span>Subárea</span>
          <select
            value={formSubareaCode}
            onChange={(e) => setFormSubareaCode(e.target.value)}
            required
          >
            {availableFormSubareas.map((s) => <option key={s.code} value={s.code}>{s.name} ({s.code})</option>)}
          </select>
        </label>
        <label>
          <span>Tipo de registro</span>
          <select name="type" defaultValue="Proceso">
            <option value="Proceso">Proceso institucional</option>
            <option value="Tarea">Tarea operativa específica</option>
          </select>
        </label>
        <label>
          <span>Nombre</span>
          <input name="name" required placeholder="Ej. Calificación de prospectos / Emisión de constancias" />
        </label>
        <label>
          <span>Responsable</span>
          <input name="owner" placeholder="Nombre o cargo responsable" defaultValue={availableFormSubareas.find((s) => s.code === formSubareaCode)?.owner} />
        </label>
        <label>
          <span>Criticidad</span>
          <select name="criticality" defaultValue="Media">
            <option value="Baja">Baja</option>
            <option value="Media">Media</option>
            <option value="Alta">Alta</option>
          </select>
        </label>
        <label className="form-span">
          <span>Objetivo y alcance</span>
          <textarea name="objective" rows={2} placeholder="Descripción del proceso o tarea, alcance y resultados esperados." />
        </label>
        <label className="form-span">
          <span>Tareas o etapas del flujo (una por línea)</span>
          <textarea
            name="tasks"
            rows={4}
            placeholder={"Paso 1: Identificación y recepción\nPaso 2: Evaluación preliminar\nPaso 3: Ejecución de la acción\nPaso 4: Archivo y reporte"}
          />
        </label>
      </div>
      <div className="form-actions">
        <button type="button" className="button button-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
        <button className="button button-primary" type="submit"><Save size={15}/> Guardar en catálogo</button>
      </div>
    </form>}

    <div className="filter-bar">
      <label className="search-input">
        <Search size={17}/>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por código, proceso, tarea o responsable" aria-label="Buscar procesos"/>
      </label>
      <select className="filter-select" value={area} onChange={(event) => { setArea(event.target.value); setSubarea("Todas"); }} aria-label="Filtrar por área">
        <option value="Todas">Todas las áreas</option>
        {areas.map((item) => <option value={item.code} key={item.code}>{item.name}</option>)}
      </select>
      <select className="filter-select filter-select-wide" value={subarea} onChange={(event) => setSubarea(event.target.value)} aria-label="Filtrar por subárea">
        <option value="Todas">Todas las subáreas</option>
        {subareaOptions.map((item) => <option value={item.code} key={item.code}>{item.name}</option>)}
      </select>
      <select className="filter-select" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} aria-label="Filtrar por tipo">
        <option value="Todos">Todos los tipos</option>
        <option value="Procesos">Solo Procesos</option>
        <option value="Tareas">Solo Tareas</option>
      </select>
      <select className="filter-select" value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filtrar por estado">
        <option value="Todos">Todos los estados</option>
        <option value="Borrador">Borrador</option>
        <option value="En revisión">En revisión</option>
        <option value="Observado">Observado</option>
        <option value="Aprobado">Aprobado</option>
      </select>
    </div>

    <div className="card table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Proceso / Tarea</th>
            <th>Área / subárea</th>
            <th>Tipo</th>
            <th>Estado</th>
            <th>Versión</th>
            <th>Actualizado</th>
            <th aria-label="Acciones"/>
          </tr>
        </thead>
        <tbody>
          {filtered.map((item) => (
            <tr key={item.code}>
              <td>
                <Link className="table-code" href={`/areas/${item.areaCode || item.subareaCode.slice(0, 3)}/${item.subareaCode}?flujo=${item.code}`}>
                  {item.code}
                </Link>
              </td>
              <td>
                <span className="table-primary">{item.name}</span>
                <span className="table-secondary">{item.owner} · Criticidad {item.criticality.toLowerCase()}</span>
              </td>
              <td>
                {item.area}
                <span className="table-secondary">{item.subarea}</span>
              </td>
              <td>
                <span className="status draft" style={{ fontSize: "10px" }}>{item.type ?? (item.code.includes("-T") ? "Tarea" : "Proceso")}</span>
              </td>
              <td><StatusBadge status={item.status}/></td>
              <td>v{item.version}</td>
              <td>{item.updated}</td>
              <td className="table-actions">
                <Link
                  className="icon-button"
                  href={`/areas/${item.areaCode || item.subareaCode.slice(0, 3)}/${item.subareaCode}?flujo=${item.code}`}
                  aria-label={`Abrir ${item.name}`}
                  title="Abrir flujograma y ficha"
                >
                  <ArrowRight size={16}/>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {filtered.length === 0 && (
        <div className="empty-state">
          <strong>No encontramos procesos ni tareas</strong>
          <p>Prueba con otro término o usa el botón &quot;Crear proceso o tarea&quot; para agregar uno nuevo.</p>
        </div>
      )}
    </div>
  </>;
}
