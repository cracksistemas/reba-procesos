"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { Area, Subarea } from "@/lib/data";

type StructureNameOverrides = { areas: Record<string, string>; subareas: Record<string, string> };

const storageKey = "reba-structure-name-overrides";
const empty: StructureNameOverrides = { areas: {}, subareas: {} };

function read(value: string | null): StructureNameOverrides {
  if (!value) return empty;
  try {
    const parsed = JSON.parse(value) as Partial<StructureNameOverrides>;
    return { areas: parsed.areas ?? {}, subareas: parsed.subareas ?? {} };
  } catch { return empty; }
}

export function useStructureNameOverrides() {
  const subscribe = useCallback((onStoreChange: () => void) => {
    const onStorage = (event: StorageEvent) => { if (!event.key || event.key === storageKey) onStoreChange(); };
    window.addEventListener("storage", onStorage); window.addEventListener(storageKey, onStoreChange);
    return () => { window.removeEventListener("storage", onStorage); window.removeEventListener(storageKey, onStoreChange); };
  }, []);
  const getSnapshot = useCallback(() => window.localStorage.getItem(storageKey), []);
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => null);
  const overrides = read(raw);
  const persist = (next: StructureNameOverrides) => { window.localStorage.setItem(storageKey, JSON.stringify(next)); window.dispatchEvent(new Event(storageKey)); };
  return {
    overrides,
    renameArea: (code: string, name: string) => persist({ ...overrides, areas: { ...overrides.areas, [code]: name.trim() } }),
    renameSubarea: (code: string, name: string) => persist({ ...overrides, subareas: { ...overrides.subareas, [code]: name.trim() } }),
  };
}

export function displayArea(area: Area, overrides: StructureNameOverrides): Area {
  return overrides.areas[area.code] ? { ...area, name: overrides.areas[area.code] } : area;
}

export function displaySubarea(subarea: Subarea, overrides: StructureNameOverrides): Subarea {
  return overrides.subareas[subarea.code] ? { ...subarea, name: overrides.subareas[subarea.code] } : subarea;
}
