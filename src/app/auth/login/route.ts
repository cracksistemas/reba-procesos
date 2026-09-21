import { NextResponse } from "next/server";
import { adminQuery, isDatabaseConfigured } from "@/lib/server/db";
import { verifyPassword } from "@/lib/server/passwords";
import { attachSession, jsonError } from "@/lib/server/session";
import { normalizeEmail } from "@/lib/server/users";

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) return jsonError("La base de datos aún no está configurada (DATABASE_URL).", 503);
  const body = await request.json().catch(() => null) as { email?: unknown; password?: unknown } | null;
  const email = normalizeEmail(body?.email); const password = typeof body?.password === "string" ? body.password : "";

  const [user] = await adminQuery<{ id: string; encrypted_password: string; is_active: boolean }>(
    "select u.id, u.encrypted_password, coalesce(p.is_active, true) as is_active from auth.users u left join public.profiles p on p.id = u.id where lower(u.email) = $1", [email]);
  if (!user || !(await verifyPassword(password, user.encrypted_password))) return jsonError("Correo o contraseña incorrectos.", 401);
  if (!user.is_active) return jsonError("Tu usuario está desactivado. Contacta al administrador.", 403);

  await adminQuery("update auth.users set last_sign_in_at = now() where id = $1", [user.id]);
  return attachSession(NextResponse.json({ ok: true }), request, user.id);
}
