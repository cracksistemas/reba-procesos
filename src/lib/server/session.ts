import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { adminQuery } from "@/lib/server/db";
import { createSessionToken, readSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/session-token";

export type SessionUser = { id: string; email: string; fullName: string; roles: string[] };

export const ADMIN_ROLES = ["superadmin", "process_admin"];

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await readSessionToken((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return null;
  const [row] = await adminQuery<{ id: string; email: string; full_name: string; roles: string[] }>(
    `select p.id, p.email, p.full_name, coalesce(array_agg(distinct r.code) filter (where r.code is not null), '{}') as roles
     from public.profiles p left join public.user_roles ur on ur.user_id = p.id left join public.roles r on r.id = ur.role_id
     where p.id = $1 and p.is_active group by p.id`, [session.uid]);
  return row ? { id: row.id, email: row.email, fullName: row.full_name, roles: row.roles } : null;
}

export function isAdmin(user: SessionUser | null) { return Boolean(user?.roles.some((role) => ADMIN_ROLES.includes(role))); }

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
