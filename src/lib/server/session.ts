import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { adminQuery } from "@/lib/server/db";
import { createSessionToken, readSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/session-token";

export type RoleAssignment = { role: string; area: string | null };
export type SessionUser = { id: string; email: string; fullName: string; roles: string[]; assignments: RoleAssignment[] };

export const ADMIN_ROLES = ["superadmin", "process_admin"];

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await readSessionToken((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return null;
  const [row] = await adminQuery<{ id: string; email: string; full_name: string; assignments: RoleAssignment[] }>(
    `select p.id, p.email, p.full_name,
       coalesce(json_agg(json_build_object('role', r.code, 'area', a.code)) filter (where r.code is not null), '[]') as assignments
     from public.profiles p left join public.user_roles ur on ur.user_id = p.id left join public.roles r on r.id = ur.role_id left join public.areas a on a.id = ur.area_id
     where p.id = $1 and p.is_active group by p.id`, [session.uid]);
  if (!row) return null;
  return { id: row.id, email: row.email, fullName: row.full_name, roles: [...new Set(row.assignments.map((item) => item.role))], assignments: row.assignments };
}

// Roles globales: ven y editan todas las áreas.
export function isAdmin(user: SessionUser | null) { return Boolean(user?.roles.some((role) => ADMIN_ROLES.includes(role))); }
// Solo el superadministrador gestiona cuentas y roles.
export function isSuperadmin(user: SessionUser | null) { return Boolean(user?.roles.includes("superadmin")); }
export const EDITOR_ROLES = ["area_owner", "editor"];

// Áreas visibles para el usuario; null significa todas (rol global o rol sin área).
export function allowedAreas(user: SessionUser): string[] | null {
  if (isAdmin(user) || user.assignments.some((item) => item.area === null)) return null;
  return [...new Set(user.assignments.flatMap((item) => item.area ? [item.area] : []))];
}
export function canAccessArea(user: SessionUser, areaCode: string) {
  const areas = allowedAreas(user);
  return areas === null || areas.includes(areaCode.toUpperCase());
}
export function canEditArea(user: SessionUser, areaCode: string) {
  return isAdmin(user) || user.assignments.some((item) => EDITOR_ROLES.includes(item.role) && (item.area === null || item.area === areaCode.toUpperCase()));
}

// La cookie solo lleva Secure si el portal se sirve por HTTPS; en la red local va por HTTP.
export async function attachSession(response: NextResponse, request: Request, userId: string) {
  const secure = new URL(request.url).protocol === "https:" || request.headers.get("x-forwarded-proto") === "https";
  response.cookies.set(SESSION_COOKIE, await createSessionToken(userId), { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: SESSION_MAX_AGE });
  return response;
}

export function clearSession(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  return response;
}

export function jsonError(message: string, status: number) { return NextResponse.json({ message }, { status }); }
