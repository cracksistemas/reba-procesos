"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { ArrowRight, GitBranch, LayoutGrid, Search } from "lucide-react";
import { FlowchartEditor } from "@/components/flowchart-editor";
import type { Area, Subarea } from "@/lib/data";

function readStoredSubareas(value: string | null) {
  if (!value) return [];
  try {
    const items = JSON.parse(value) as Subarea[];
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
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
    const byCode = new Map(initialSubareas.map((subarea) => [subarea.code, subarea]));
    const storedValues = JSON.parse(storedBundle) as Array<string | null>;
    storedValues.forEach((value) => readStoredSubareas(value).forEach((subarea) => byCode.set(subarea.code, subarea)));
    return Array.from(byCode.values());
  }, [initialSubareas, storedBundle]);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<{ area: Area; subarea: Subarea } | null>(null);
  const normalizedQuery = query.trim().toLocaleLowerCase("es");

  return <>
    <div className="page-heading">
      <div><p className="eyebrow">Biblioteca visual</p><h1>Flujogramas por área</h1><p>Explora la estructura completa y edita cada flujo en un lienzo visual.</p></div>
      <div className="flow-library-count"><LayoutGrid size={17}/><strong>{allSubareas.length}</strong><span>flujogramas</span></div>
    </div>
    <div className="filter-bar flow-library-filter">
      <label className="search-input"><Search size={17}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar área, subárea o responsable…"/></label>
      <nav className="area-jump" aria-label="Ir a un área">{areas.map((area) => <a href={`#flows-${area.code}`} key={area.code}>{area.code}</a>)}</nav>
    </div>

    <div className="flow-area-stack">
      {areas.map((area) => {
        const items = allSubareas.filter((subarea) => subarea.areaCode === area.code && (!normalizedQuery || `${area.name} ${subarea.name} ${subarea.owner}`.toLocaleLowerCase("es").includes(normalizedQuery)));
        if (!items.length) return null;
        return <section className="card flow-area-section" id={`flows-${area.code}`} key={area.code}>
          <header className="flow-area-head" style={{ borderLeftColor: area.color }}>
            <div className="area-symbol" style={{ background: area.color }}>{area.code}</div>
            <div><span>Área</span><h2>{area.name}</h2><p>{area.description}</p></div>
            <strong>{items.length} flujogramas</strong>
          </header>
          <div className="flow-library-grid">
            {items.map((subarea) => <article className="flow-library-card" key={subarea.code}>
              <div className="flow-library-card-title"><GitBranch size={17}/><div><span>{subarea.code}</span><h3>{subarea.name}</h3></div></div>
              <p>{subarea.description}</p>
              <div className="flow-preview-modern">
                <span className="preview-terminal">Inicio</span>
                {subarea.flow.slice(0, 3).map((step) => <span className="preview-activity" key={`${subarea.code}-${step}`}>{step}</span>)}
                {subarea.flow.length > 3 && <span className="preview-more">+{subarea.flow.length - 3}</span>}
                <span className="preview-terminal end">Fin</span>
              </div>
              <div className="flow-library-card-foot"><span>Responsable: {subarea.owner}</span><button className="text-button" onClick={() => setActive({ area, subarea })}>Abrir lienzo <ArrowRight size={14}/></button></div>
            </article>)}
          </div>
        </section>;
      })}
    </div>
    {active && <FlowchartEditor area={active.area} subarea={active.subarea} onClose={() => setActive(null)}/>}
  </>;
}
