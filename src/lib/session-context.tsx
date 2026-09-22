"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { areas as allAreas, type Area } from "@/lib/data";

export type SessionInfo = {
  id: string; email: string; fullName: string; roles: string[];
  assignments: { role: string; area: string | null }[];
  isAdmin: boolean; isSuperadmin: boolean;
  // null = todas las áreas.
  allowedAreas: string[] | null;
};

type SessionState = { user: SessionInfo | null; loaded: boolean };

const SessionContext = createContext<SessionState>({ user: null, loaded: false });

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [state, setState] = useState<SessionState>({ user: null, loaded: false });
  useEffect(() => {
    if (pathname === "/ingreso") return;
    let active = true;
    fetch("/api/me").then((response) => response.ok ? response.json() : null)
      .then((user: SessionInfo | null) => { if (active) setState({ user, loaded: true }); })
      .catch(() => { if (active) setState({ user: null, loaded: true }); });
    return () => { active = false; };
  }, [pathname]);
  return <SessionContext.Provider value={state}>{children}</SessionContext.Provider>;
}

export function useSession() { return useContext(SessionContext); }

const EDITOR_ROLES = ["area_owner", "editor"];

export function canSeeArea(user: SessionInfo | null, areaCode: string) {
  if (!user) return true;
  return user.allowedAreas === null || user.allowedAreas.includes(areaCode.toUpperCase());
}

export function canEditArea(user: SessionInfo | null, areaCode: string) {
  if (!user) return false;
  return user.isAdmin || user.assignments.some((item) => EDITOR_ROLES.includes(item.role) && (item.area === null || item.area === areaCode.toUpperCase()));
}

// Áreas que el usuario puede ver. Mientras la sesión carga devuelve la lista completa.
export function useVisibleAreas(): Area[] {
  const { user } = useSession();
  return allAreas.filter((area) => canSeeArea(user, area.code));
}

export function useCanEdit(areaCode: string) {
  const { user, loaded } = useSession();
  return loaded && canEditArea(user, areaCode);
}
