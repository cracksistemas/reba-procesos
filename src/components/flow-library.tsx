"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { ArrowRight, GitBranch, Layers3, LayoutGrid, Search } from "lucide-react";
import { FlowchartEditor } from "@/components/flowchart-editor";
import { mergeSubareas, type Area, type Subarea } from "@/lib/data";
import { flowcharts, type Flowchart } from "@/lib/flowcharts";

type ActiveFlow = { area: Area; subarea: Subarea; flowchart?: Flowchart };

function readStoredSubareas(value: string | null) {
  if (!value) return [];
  try {
    const items = JSON.parse(value) as Subarea[];
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

function FlowCard({ subarea, flowchart, onOpen }: { subarea: Subarea; flowchart?: Flowchart; onOpen: () => void }) {
  const code = flowchart?.code ?? subarea.code;
  const title = flowchart?.title ?? subarea.name;
  const description = flowchart?.description ?? subarea.description;
  const preview = flowchart
    ? flowchart.nodes.filter((node) => !["start", "end", "evidence"].includes(node.kind)).slice(0, 3).map((node) => node.label)
    : subarea.flow.slice(0, 3);
  const hiddenSteps = flowchart ? Math.max(0, flowchart.nodes.length - preview.length - 2) : Math.max(0, subarea.flow.length - preview.length);

  return <article className="flow-library-card">
    <div className="flow-library-card-title"><GitBranch size={17}/><div><span>{code}</span><h3 title={title}>{title}</h3></div></div>
    <p>{description}</p>
    <div className="flow-preview-modern">
      <span className="preview-terminal">Inicio</span>
      {preview.map((step, index) => <span className="preview-activity" key={`${code}-${index}`}>{step}</span>)}
      {hiddenSteps > 0 && <span className="preview-more">+{hiddenSteps}</span>}
      <span className="preview-terminal end">Fin</span>
    </div>
    <div className="flow-library-card-foot"><span>Responsable: {flowchart?.owner ?? subarea.owner}</span><button className="text-button" onClick={onOpen}>Abrir lienzo <ArrowRight size={14}/></button></div>
  </article>;
}

export function FlowLibrary({ areas, initialSubareas }: { areas: Area[]; initialSubareas: Subarea[] }) {
  const storageKeys = useMemo(() => areas.map((area) => `reba-subareas-${area.code}`), [areas]);
  const subscribe = useCallback((onStoreChange: () => void) => {
    const handleStorage = (event: StorageEvent) => {
      if (!event.key || storageKeys.includes(event.key)) onStoreChange();
    };
    window.addEventListener("storage", handleStorage);
    storageKeys.forEach((key) => window.addEventListener(key, onStoreChange));
    return () => {
      window.removeEventListener("storage", handleStorage);
      storageKeys.forEach((key) => window.removeEventListener(key, onStoreChange));
    };
  }, [storageKeys]);
  const getSnapshot = useCallback(() => JSON.stringify(storageKeys.map((key) => window.localStorage.getItem(key))), [storageKeys]);
  const storedBundle = useSyncExternalStore(subscribe, getSnapshot, () => "[]");
  const allSubareas = useMemo(() => {
    const storedValues = JSON.parse(storedBundle) as Array<string | null>;
    return mergeSubareas(initialSubareas, storedValues.flatMap(readStoredSubareas));
  }, [initialSubareas, storedBundle]);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<ActiveFlow | null>(null);
  const normalizedQuery = query.trim().toLocaleLowerCase("es");
  const totalFlowcharts = flowcharts.length;

  return <>
    <div className="page-heading">
      <div><p className="eyebrow">Biblioteca visual</p><h1>Flujogramas por área</h1><p>Explora la estructura completa y edita cada flujo en un lienzo visual.</p></div>
      <div className="flow-library-count"><LayoutGrid size={17}/><strong>{totalFlowcharts}</strong><span>flujogramas</span></div>
    </div>
    <div className="filter-bar flow-library-filter">
      <label className="search-input"><Search size={17}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar área, subárea, flujo o responsable…"/></label>
      <nav className="area-jump" aria-label="Ir a un área">{areas.map((area) => <a href={`#flows-${area.code}`} key={area.code}>{area.code}</a>)}</nav>
    </div>

    <div className="flow-area-stack">
      {areas.map((area) => {
        const configuredSubareas = allSubareas.filter((subarea) => subarea.areaCode === area.code);
        const areaSubareas = configuredSubareas.length ? configuredSubareas : [{ code: area.code, areaCode: area.code, name: area.name, description: area.description, owner: area.owner, flow: [], source: "Drive" as const }];
        const visibleGroups = areaSubareas.map((subarea) => {
          const imported = flowcharts.filter((flowchart) => flowchart.subareaCode === subarea.code);
          const matchingFlows = imported.filter((flowchart) => !normalizedQuery || `${area.name} ${subarea.name} ${subarea.owner} ${flowchart.title} ${flowchart.description}`.toLocaleLowerCase("es").includes(normalizedQuery));
          const subareaMatches = !normalizedQuery || `${area.name} ${subarea.name} ${subarea.owner} ${subarea.description}`.toLocaleLowerCase("es").includes(normalizedQuery);
          return { subarea, flowcharts: imported.length ? matchingFlows : subareaMatches ? [undefined] : [] };
        }).filter((group) => group.flowcharts.length);
        if (!visibleGroups.length) return null;
        const areaFlowCount = visibleGroups.reduce((total, group) => total + group.flowcharts.length, 0);
        const isMarketing = area.code === "MKT";
        return <section className="card flow-area-section" id={`flows-${area.code}`} key={area.code}>
          <header className="flow-area-head" style={{ borderLeftColor: area.color }}>
            <div className="area-symbol" style={{ background: area.color }}>{area.code}</div>
            <div><span>Área</span><h2>{area.name}</h2><p>{area.description}</p></div>
            <strong>{areaFlowCount} flujogramas</strong>
          </header>
          {isMarketing ? <div className="marketing-flow-groups">
            {visibleGroups.map(({ subarea, flowcharts }) => <section className="marketing-flow-group" key={subarea.code}>
              <header><div className="marketing-subarea-icon"><Layers3 size={16}/></div><div><span>{subarea.code} · Subárea</span><h3>{subarea.name}</h3><p>{subarea.description}</p></div><strong>{flowcharts.length} {flowcharts.length === 1 ? "flujo" : "flujos"}</strong></header>
              <div className="flow-library-grid">{flowcharts.map((flowchart) => <FlowCard key={flowchart?.code ?? subarea.code} subarea={subarea} flowchart={flowchart} onOpen={() => setActive({ area, subarea, flowchart })}/>)}</div>
            </section>)}
          </div> : <div className="flow-library-grid">
            {visibleGroups.flatMap(({ subarea, flowcharts }) => flowcharts.map((flowchart) => <FlowCard key={flowchart?.code ?? subarea.code} subarea={subarea} flowchart={flowchart} onOpen={() => setActive({ area, subarea, flowchart })}/>))}
          </div>}
        </section>;
      })}
    </div>
    {active && <FlowchartEditor area={active.area} subarea={active.subarea} flowchart={active.flowchart} onClose={() => setActive(null)}/>} 
  </>;
}
