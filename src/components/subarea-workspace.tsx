"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, Download, FileText, GitBranch, LayoutGrid, ListChecks, Pencil, Plus, Save, ShieldCheck, UserRound, X } from "lucide-react";
import { FlowchartEditor } from "@/components/flowchart-editor";
import type { Area, Process, ProcessType, Subarea } from "@/lib/data";
import { getFlowchartVersion, type Flowchart } from "@/lib/flowcharts";
import { processToFlowchart, saveProcess, useProcesses } from "@/lib/process-store";

type SubareaWorkspaceProps = {
  area: Area;
  subarea: Subarea;
  siblings: Subarea[];
  flowcharts: Flowchart[];
  linkedProcesses: Process[];
  flowCounts: Record<string, number>;
  initialFlowCode?: string;
};

const viewerTabs = ["Diagrama", "Ficha", "KPI", "Documentos", "Historial"] as const;
type ViewerTab = typeof viewerTabs[number];

const splitTasks = (value: string) => value
  .split(/[\n,>→]+/)
  .map((step) => step.trim())
  .filter(Boolean);

export function SubareaWorkspace({ area, subarea, siblings, flowcharts, linkedProcesses, initialFlowCode }: SubareaWorkspaceProps) {
  const allProcesses = useProcesses(linkedProcesses);
  const subareaProcesses = useMemo(
    () => allProcesses.filter((p) => p.subareaCode.toLowerCase() === subarea.code.toLowerCase()),
    [allProcesses, subarea.code]
  );

  // Synthesize flowcharts for linked processes that don't have an imported JSON flowchart
  const unifiedFlowcharts = useMemo(() => {
    const existingCodes = new Set(flowcharts.map((f) => f.code.toLowerCase()));
    const synthesized: Flowchart[] = [];

    subareaProcesses.forEach((proc) => {
      if (!existingCodes.has(proc.code.toLowerCase())) {
        synthesized.push(processToFlowchart(proc));
        existingCodes.add(proc.code.toLowerCase());
      }
    });

    return [...flowcharts, ...synthesized];
  }, [flowcharts, subareaProcesses]);

  const initial = initialFlowCode && unifiedFlowcharts.some((item) => item.code === initialFlowCode) ? initialFlowCode : null;
  const [activeCode, setActiveCode] = useState<string | null>(initial);
  const [tab, setTab] = useState<ViewerTab>("Diagrama");
  const [editing, setEditing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const activeFlow = useMemo(
    () => unifiedFlowcharts.find((flowchart) => flowchart.code === activeCode) ?? null,
    [activeCode, unifiedFlowcharts]
  );

  const activeProcess = useMemo(
    () => subareaProcesses.find((p) => p.code === activeCode) ?? null,
    [activeCode, subareaProcesses]
  );

  const totalEntries = unifiedFlowcharts.length || 1;
  const activeVersion = activeFlow ? getFlowchartVersion(activeFlow) : activeProcess?.version ?? "0.1";

  const openFlow = (code: string) => {
    setActiveCode(code);
    setTab("Diagrama");
    setEditing(false);
  };

  const handleAddProcess = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const type = (form.get("type") as ProcessType) || "Proceso";
    const owner = String(form.get("owner") ?? "").trim() || subarea.owner;
    const criticality = (form.get("criticality") as "Baja" | "Media" | "Alta") || "Media";
    const objective = String(form.get("objective") ?? "").trim();
    const tasks = splitTasks(String(form.get("tasks") ?? ""));

    if (!name) {
      setError("Indica el nombre del proceso o tarea.");
      return;
    }

    const saved = saveProcess(
      {
        name,
        type,
        area: area.name,
        areaCode: area.code,
        subareaCode: subarea.code,
        subarea: subarea.name,
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
    setShowAddForm(false);
    setNotice(`${saved.code} · ${saved.name} se agregó correctamente a ${subarea.name}.`);
    window.setTimeout(() => setNotice(""), 4500);
  };

  return <>
    <div className="subarea-workspace-heading">
      <div className="breadcrumb"><Link href="/biblioteca">Biblioteca</Link> / <Link href="/areas">Áreas</Link> / <Link href={`/areas/${area.code}`}>{area.name}</Link> / <span>{subarea.name}</span></div>
      <Link className="button button-secondary" href={`/areas/${area.code}`}><ArrowLeft size={14}/> Todas las subáreas</Link>
    </div>

    <section className="subarea-hero card">
      <div className="subarea-hero-mark" style={{ background: area.color }}><GitBranch size={23}/></div>
      <div><p className="eyebrow">{subarea.code} · Subárea de {area.name}</p><h1>{subarea.name}</h1><p>{subarea.description}</p></div>
      <div className="subarea-hero-facts"><span><UserRound size={14}/> {subarea.owner}</span><strong>{totalEntries} {totalEntries === 1 ? "proceso o tarea" : "procesos y tareas"}</strong></div>
    </section>

    {notice && <div className="pilot-banner" role="status"><CheckCircle2 size={17}/><span>{notice} <strong>Guardado con éxito.</strong></span></div>}
    {error && <div className="form-error" role="alert">{error}</div>}

    {showAddForm && <form className="card subarea-form" onSubmit={handleAddProcess}>
      <div className="card-header">
        <div>
          <h2>Añadir proceso o tarea a {subarea.name}</h2>
          <p>Se creará con codificación automática dentro de {subarea.code} y estará listo para consultar o editar su diagrama.</p>
        </div>
      </div>
      <div className="form-grid">
        <label>
          <span>Tipo de elemento</span>
          <select name="type" defaultValue="Proceso">
            <option value="Proceso">Proceso (Flujo estructurado institucional)</option>
            <option value="Tarea">Tarea (Actividad operativa específica)</option>
          </select>
        </label>
        <label>
          <span>Nombre del proceso o tarea</span>
          <input name="name" required placeholder="Ej. Control de inventario semanal / Conciliación de cuentas" />
        </label>
        <label>
          <span>Responsable</span>
          <input name="owner" defaultValue={subarea.owner} placeholder="Nombre o cargo del responsable" />
        </label>
        <label>
          <span>Criticidad</span>
          <select name="criticality" defaultValue="Media">
            <option value="Baja">Baja (Riesgo operativo menor)</option>
            <option value="Media">Media (Impacto departamental)</option>
            <option value="Alta">Alta (Crítico para la operación)</option>
          </select>
        </label>
        <label className="form-span">
          <span>Objetivo y alcance</span>
          <textarea name="objective" rows={2} placeholder="Propósito, resultado esperado y alcance del proceso o tarea." />
        </label>
        <label className="form-span">
          <span>Tareas o etapas del flujo (una por línea)</span>
          <textarea
            name="tasks"
            rows={4}
            placeholder={"Paso 1: Recepción de solicitud o necesidad\nPaso 2: Validación de datos y antecedentes\nPaso 3: Ejecución de la actividad técnica\nPaso 4: Registro de evidencia y cierre"}
          />
        </label>
      </div>
      <div className="form-actions">
        <button type="button" className="button button-secondary" onClick={() => setShowAddForm(false)}>Cancelar</button>
        <button className="button button-primary" type="submit"><Save size={15}/> Guardar en subárea</button>
      </div>
    </form>}

    {!activeCode ? <div className="subarea-directory-layout">
      <main>
        <div className="directory-heading">
          <div>
            <h2>Procesos y tareas de la subárea</h2>
            <p>Selecciona un elemento para abrir su ficha y su flujograma interactivo.</p>
          </div>
          <button className="button button-primary" onClick={() => setShowAddForm((curr) => !curr)}>
            {showAddForm ? <X size={15}/> : <Plus size={15}/>} {showAddForm ? "Cerrar formulario" : "Añadir proceso / tarea"}
          </button>
        </div>

        <section className="card process-directory-list" aria-label={`Procesos y tareas de ${subarea.name}`}>
          {unifiedFlowcharts.length > 0 ? unifiedFlowcharts.map((flowchart, index) => {
            const matchedProc = subareaProcesses.find((p) => p.code.toLowerCase() === flowchart.code.toLowerCase());
            const kindLabel = matchedProc?.type ?? (flowchart.code.includes("-T") ? "Tarea" : "Proceso");
            const stepCount = flowchart.nodes ? flowchart.nodes.filter((n) => n.kind !== "start" && n.kind !== "end").length : 0;

            return <button key={flowchart.code} className="process-directory-row" onClick={() => openFlow(flowchart.code)}>
              <span className="process-directory-index">{String(index + 1).padStart(2, "0")}</span>
              <div className="process-directory-main">
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <small>{flowchart.code}</small>
                  <span className="status draft" style={{ fontSize: "9px", padding: "2px 6px" }}>{kindLabel}</span>
                  {stepCount > 0 && <span style={{ fontSize: "10px", color: "#687386", display: "inline-flex", alignItems: "center", gap: "3px" }}><ListChecks size={12}/> {stepCount} {stepCount === 1 ? "etapa" : "etapas"}</span>}
                </div>
                <strong>{flowchart.title}</strong>
                <span>{flowchart.description}</span>
              </div>
              <div className="process-directory-meta">
                <span className="status approved">{matchedProc ? matchedProc.status : "Documentado"}</span>
                <span>v{getFlowchartVersion(flowchart)}</span>
                <span>{flowchart.owner}</span>
              </div>
              <ArrowRight size={16}/>
            </button>;
          }) : <button className="process-directory-row" onClick={() => setActiveCode(subarea.code)}>
            <span className="process-directory-index">01</span>
            <div className="process-directory-main">
              <small>{subarea.code}-F01</small>
              <strong>Flujograma general de {subarea.name}</strong>
              <span>{subarea.description}</span>
            </div>
            <div className="process-directory-meta">
              <span className="status draft">Base inicial</span>
              <span>v0.1</span>
              <span>{subarea.owner}</span>
            </div>
            <ArrowRight size={16}/>
          </button>}
        </section>
      </main>

      <aside className="card sibling-directory">
        <div className="workspace-nav-head">
          <LayoutGrid size={16}/>
          <div><strong>Otras subáreas</strong><span>{area.name}</span></div>
        </div>
        <nav className="workspace-subarea-list">
          {siblings.map((item) => {
            const itemProcesses = allProcesses.filter((p) => p.subareaCode.toLowerCase() === item.code.toLowerCase());
            const itemFlows = flowcharts.filter((f) => f.subareaCode.toLowerCase() === item.code.toLowerCase());
            const total = Math.max(1, itemFlows.length + itemProcesses.length);
            return <Link className={item.code === subarea.code ? "active" : ""} href={`/areas/${area.code}/${item.code}`} key={item.code}>
              <span className="workspace-nav-code">{item.code.replace(`${area.code}-`, "")}</span>
              <span><strong>{item.name}</strong><small>{total} {total === 1 ? "elemento" : "elementos"}</small></span>
              <ArrowRight size={13}/>
            </Link>;
          })}
        </nav>
      </aside>
    </div> : <section className="process-viewer">
      <div className="process-viewer-top card">
        <button className="icon-button viewer-back" onClick={() => { setActiveCode(null); setEditing(false); }} aria-label="Volver a la lista"><ArrowLeft size={18}/></button>
        <div>
          <div className="viewer-context">{area.name} / {subarea.name} / {activeFlow?.code ?? `${subarea.code}-F01`}</div>
          <h2>{activeFlow?.title ?? `Flujograma general de ${subarea.name}`}</h2>
          <p>{activeFlow?.description ?? subarea.description}</p>
        </div>
        <div className="viewer-metadata">
          <span><UserRound size={13}/> {activeFlow?.owner ?? subarea.owner}</span>
          <span><ShieldCheck size={13}/> {activeFlow ? (activeProcess ? activeProcess.status : "Documentado") : "Borrador"}</span>
          <span><Clock3 size={13}/> Versión {activeFlow ? activeVersion : "0.1"}</span>
        </div>
        <button className={`button ${editing ? "button-secondary" : "button-primary"}`} onClick={() => setEditing((current) => !current)}>
          {editing ? <X size={15}/> : <Pencil size={15}/>} {editing ? "Salir de edición" : "Editar"}
        </button>
      </div>

      {editing && <div className="editing-mode-banner"><Pencil size={15}/><span><strong>Modo edición.</strong> Estás trabajando sobre un borrador local en el lienzo; los cambios se guardan en este navegador.</span></div>}
      {!editing && <div className="tabs viewer-tabs" role="tablist" aria-label="Secciones del proceso">
        {viewerTabs.map((item) => <button key={item} className={`tab ${tab === item ? "active" : ""}`} onClick={() => setTab(item)} role="tab" aria-selected={tab === item}>{item}</button>)}
      </div>}

      <div className={!editing ? "card detail-panel viewer-panel" : "viewer-editor"}>
        {(editing || tab === "Diagrama") && <FlowchartEditor key={`${activeCode}-${editing ? "edit" : "read"}`} area={area} subarea={subarea} flowchart={activeFlow ?? undefined} embedded readOnly={!editing}/>}
        {!editing && tab === "Ficha" && <div className="summary-grid">
          <div>
            <section className="summary-section">
              <h3>Objetivo</h3>
              <p>{activeFlow?.description ?? subarea.description}</p>
            </section>
            <section className="summary-section">
              <h3>Alcance</h3>
              <p>{activeProcess?.scope ?? "Desde el inicio documentado hasta el cierre del flujo, incluyendo decisiones, retornos, responsables y evidencias representadas."}</p>
            </section>
            <section className="summary-section">
              <h3>Vista lineal de tareas y etapas</h3>
              <ol className="linear-flow">
                {(activeFlow?.nodes ?? []).map((node) => <li key={node.id}><strong>{node.role || "Actividad"}</strong><span>{node.label}</span></li>)}
              </ol>
            </section>
          </div>
          <aside className="facts">
            <div className="fact"><span>Área</span><strong>{area.name}</strong></div>
            <div className="fact"><span>Subárea</span><strong>{subarea.name}</strong></div>
            <div className="fact"><span>Tipo</span><strong>{activeProcess?.type ?? "Proceso"}</strong></div>
            <div className="fact"><span>Responsable</span><strong>{activeFlow?.owner ?? subarea.owner}</strong></div>
            <div className="fact"><span>Criticidad</span><strong>{activeProcess?.criticality ?? "Media"}</strong></div>
            <div className="fact"><span>Nivel</span><strong>N2 · Operativo</strong></div>
          </aside>
        </div>}
        {!editing && tab === "KPI" && <div className="viewer-placeholder"><CheckCircle2 size={24}/><h3>Indicadores vinculados</h3><p>Este flujo o tarea está preparado para asociar meta, frecuencia, fuente y responsable de cumplimiento.</p></div>}
        {!editing && tab === "Documentos" && <div className="viewer-placeholder"><FileText size={24}/><h3>Documentación relacionada</h3><p>Versión {activeVersion} registrada en el portal institucional.</p><button className="button button-secondary"><Download size={15}/> Descargar desde el diagrama</button></div>}
        {!editing && tab === "Historial" && <div className="activity-list viewer-history">
          <div className="activity-item"><strong>Versión {activeVersion} registrada</strong><span>{activeFlow?.owner ?? subarea.owner}</span></div>
          <div className="activity-item"><strong>Flujograma interactivo disponible</strong><span>Motor XYFlow con edición gráfica</span></div>
        </div>}
      </div>
    </section>}
  </>;
}
