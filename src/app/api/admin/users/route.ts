import { NextResponse } from "next/server";
import { adminQuery, adminTransaction } from "@/lib/server/db";
import { getSessionUser, isSuperadmin, jsonError } from "@/lib/server/session";
import { createUser, normalizeEmail, parseAssignments, replaceAssignments, validateCredentials } from "@/lib/server/users";

export async function GET() {
  const admin = await getSessionUser();
  if (!isSuperadmin(admin)) return jsonError("Solo el superadministrador puede gestionar usuarios.", 403);
  const [users, roles, areas] = await Promise.all([
    adminQuery(
      `select p.id, p.email, p.full_name as "fullName", p.is_active as "isActive", u.last_sign_in_at as "lastSignInAt",
        coalesce(json_agg(json_build_object('role', r.code, 'area', a.code) order by r.code, a.code) filter (where r.code is not null), '[]') as assignments
       from public.profiles p join auth.users u on u.id = p.id
       left join public.user_roles ur on ur.user_id = p.id left join public.roles r on r.id = ur.role_id left join public.areas a on a.id = ur.area_id
       group by p.id, u.last_sign_in_at order by p.is_active desc, lower(p.email)`),
    adminQuery("select code, name, description from public.roles order by created_at, code"),
    adminQuery("select code, name from public.areas where is_active order by name"),
  ]);
  return NextResponse.json({ users, roles, areas, currentUserId: admin!.id });
}

export async function POST(request: Request) {
  const admin = await getSessionUser();
  if (!isSuperadmin(admin)) return jsonError("Solo el superadministrador puede gestionar usuarios.", 403);
  const body = await request.json().catch(() => null) as { email?: unknown; password?: unknown; fullName?: unknown; assignments?: unknown } | null;
  const email = normalizeEmail(body?.email); const password = typeof body?.password === "string" ? body.password : "";
  const fullName = typeof body?.fullName === "string" ? body.fullName.trim() : "";
  const invalid = validateCredentials(email, password);
  if (invalid) return jsonError(invalid, 400);
  try {
    const id = await adminTransaction(async (client) => {
      const userId = await createUser(client, { email, password, fullName });
      await replaceAssignments(client, userId, parseAssignments(body?.assignments), admin!.id);
      return userId;
    });
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    const duplicate = (error as { code?: string }).code === "23505";
    return jsonError(duplicate ? "Ya existe un usuario con ese correo." : (error as Error).message, duplicate ? 409 : 400);
  }
}
