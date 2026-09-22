"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Clock3, GitBranch, LayoutGrid, Network, Search, Star } from "lucide-react";
import { areas as allAreas, getSubareas, processes, subareas as allSubareas } from "@/lib/data";
import { canSeeArea, useSession } from "@/lib/session-context";
import { flowcharts, getAreaFlowcharts, getFlowchartVersion } from "@/lib/flowcharts";
import { useProcesses } from "@/lib/process-store";

type LibraryMode = "areas" | "map";

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function ProcessLibrary({ initialQuery = "" }: { initialQuery?: string }) {
  const { user } = useSession();
  const areas = useMemo(() => allAreas.filter((area) => canSeeArea(user, area.code)), [user]);
  const subareas = useMemo(() => allSubareas.filter((item) => canSeeArea(user, item.areaCode)), [user]);
  const allProcesses = useProcesses(processes).filter((item) => canSeeArea(user, item.areaCode ?? item.subareaCode.slice(0, 3)));
  const [mode, setMode] = useState<LibraryMode>("areas");
  const [query, setQuery] = useState(initialQuery);
  const term = normalize(query.trim());

  const results = useMemo(() => {
    if (!term) return null;
    const matches = (value: string) => normalize(value).includes(term);
    return {
      areas: areas.filter((area) => matches(`${area.code} ${area.name} ${area.description} ${area.owner}`)),
      subareas: subareas.filter((item) => {
        const area = areas.find((candidate) => candidate.code === item.areaCode);
        return matches(`${item.code} ${item.name} ${item.description} ${item.owner} ${area?.name ?? ""}`);
      }),
      processes: allProcesses.filter((item) => matches(`${item.code} ${item.name} ${item.area} ${item.subarea} ${item.owner} ${item.objective}`)),
      flows: flowcharts.filter((item) => canSeeArea(user, item.subareaCode.slice(0, 3))).filter((item) => { const area = areas.find((candidate) => item.subareaCode.startsWith(`${candidate.code}-`)); return matches(`${item.code} ${item.title} ${item.description} ${item.owner} ${item.subareaName} ${area?.name ?? ""}`); }),
    };
  }, [term, allProcesses, areas, subareas, user]);

  const resultCount = results ? results.areas.length + results.subareas.length + results.processes.length + results.flows.length : 0;

  return <>
    <div className="library-toolbar card">
      <label className="library-search"><Search size={18}/><input autoFocus={Boolean(initialQuery)} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Código, nombre, área, subárea, responsable o palabra clave" aria-label="Buscar en la biblioteca"/></label>
      <div className="library-mode" role="tablist" aria-label="Modo de exploración">
        <button className={mode === "areas" ? "active" : ""} onClick={() => setMode("areas")} role="tab" aria-selected={mode === "areas"}><LayoutGrid size={16}/> Por áreas</button>
        <button className={mode === "map" ? "active" : ""} onClick={() => setMode("map")} role="tab" aria-selected={mode === "map"}><Network size={16}/> Por mapa</button>
      </div>
    </div>

    {results ? <section className="library-results" aria-live="polite">
      <div className="directory-heading"><div><h2>Resultados de búsqueda</h2><p>Cada resultado conserva su contexto dentro de la jerarquía institucional.</p></div><span>{resultCount} coincidencias</span></div>
      {resultCount === 0 ? <div className="card library-empty"><Search size={24}/><strong>No encontramos coincidencias</strong><span>Prueba con otro código, responsable o palabra clave.</span></div> : <div className="library-result-groups">
        {results.areas.length > 0 && <ResultGroup title="Áreas" count={results.areas.length}>{results.areas.map((area) => <ResultLink key={area.code} href={`/areas/${area.code}`} code={area.code} title={area.name} context={`Biblioteca / ${area.name}`} meta={`${getSubareas(area.code).length} subáreas · Responsable: ${area.owner}`}/>)}</ResultGroup>}
        {results.subareas.length > 0 && <ResultGroup title="Subáreas" count={results.subareas.length}>{results.subareas.map((item) => { const area = areas.find((candidate) => candidate.code === item.areaCode)!; return <ResultLink key={item.code} href={`/areas/${area.code}/${item.code}`} code={item.code} title={item.name} context={`Biblioteca / ${area.name} / ${item.name}`} meta={`Responsable: ${item.owner}`}/>; })}</ResultGroup>}
        {results.processes.length > 0 && <ResultGroup title="Procesos" count={results.processes.length}>{results.processes.map((item) => <ResultLink key={item.code} href={`/procesos/${item.code}`} code={item.code} title={item.name} context={`Biblioteca / ${item.area} / ${item.subarea}`} meta={`${item.status} · v${item.version} · ${item.owner}`}/>)}</ResultGroup>}
        {results.flows.length > 0 && <ResultGroup title="Flujogramas y programas" count={results.flows.length}>{results.flows.map((item) => { const area = areas.find((candidate) => item.subareaCode.startsWith(`${candidate.code}-`))!; return <ResultLink key={item.code} href={`/areas/${area.code}/${item.subareaCode}?flujo=${item.code}`} code={item.code} title={item.title} context={`Biblioteca / ${area.name} / ${item.subareaName}`} meta={`Documentado · v${getFlowchartVersion(item)} · ${item.owner}`}/>; })}</ResultGroup>}
      </div>}
    </section> : mode === "areas" ? <>
      <div className="directory-heading"><div><h2>Explorar por áreas</h2><p>Primero elige un área; luego verás únicamente sus subáreas.</p></div><span>{areas.length} áreas</span></div>
      <section className="area-grid library-area-grid" aria-label="Áreas institucionales">
        {areas.map((area) => {
          const areaSubareas = getSubareas(area.code);
          const importedCount = getAreaFlowcharts(area.code).length;
          const flowCount = importedCount || allProcesses.filter((item) => item.area === area.name || item.areaCode === area.code).length;
          return <Link href={`/areas/${area.code}`} className="card area-card" key={area.code}>
            <div className="area-card-top"><div className="area-symbol" style={{ background: area.color }}>{area.code}</div><ArrowRight size={17}/></div>
            <h2>{area.name}</h2><p>{area.description}</p>
            <div className="area-stats"><div><strong>{areaSubareas.length}</strong><span>Subáreas</span></div><div><strong>{flowCount}</strong><span>Procesos</span></div></div>
            <div className="area-owner"><GitBranch size={12}/> Responsable: {area.owner}</div>
          </Link>;
        })}
      </section>
    </> : <section className="library-map-view card">
      <div className="library-map-intro"><Network size={22}/><div><h2>Mapa institucional</h2><p>La misma biblioteca organizada por procesos estratégicos, misionales y de soporte.</p></div><Link className="button button-primary" href="/mapa">Abrir mapa completo <ArrowRight size={15}/></Link></div>
      <div className="library-map-lanes">
        <div><span>Estratégicos</span><strong>Planeamiento y gobierno</strong><small>Gerencia</small></div>
        <div><span>Misionales</span><strong>Captación, formación y atención</strong><small>Marketing · Comercial · Académica · Recepción</small></div>
        <div><span>Soporte</span><strong>Recursos, plataformas y operación</strong><small>Finanzas · Logística · Sistemas</small></div>
      </div>
    </section>}

    {!results && <section className="library-shortcuts" aria-label="Accesos personales">
      <div className="card"><Clock3 size={18}/><div><strong>Vistos recientemente</strong><span>Retoma los procesos consultados</span></div><Link href="/procesos/MKT-P02">Community Manager <ArrowRight size={13}/></Link></div>
      <div className="card"><Star size={18}/><div><strong>Favoritos</strong><span>Accesos frecuentes del usuario</span></div><Link href="/procesos/COM-P01">Gestión de leads <ArrowRight size={13}/></Link></div>
    </section>}
  </>;
}

function ResultGroup({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return <section className="card library-result-group"><header><h3>{title}</h3><span>{count}</span></header><div>{children}</div></section>;
}

function ResultLink({ href, code, title, context, meta }: { href: string; code: string; title: string; context: string; meta: string }) {
  return <Link href={href} className="library-result-row"><span className="library-result-code">{code}</span><div><small>{context}</small><strong>{title}</strong><span>{meta}</span></div><ArrowRight size={15}/></Link>;
}
