import { NextResponse } from "next/server";
import { adminTransaction, isDatabaseConfigured } from "@/lib/server/db";
import { attachSession, jsonError } from "@/lib/server/session";
import { createUser, normalizeEmail, replaceAssignments, validateCredentials } from "@/lib/server/users";

// Crea el primer superadministrador. Solo funciona mientras no exista ningún usuario.
export async function POST(request: Request) {
  if (!isDatabaseConfigured()) return jsonError("La base de datos aún no está configurada (DATABASE_URL).", 503);
  const body = await request.json().catch(() => null) as { email?: unknown; password?: unknown; fullName?: unknown } | null;
  const email = normalizeEmail(body?.email); const password = typeof body?.password === "string" ? body.password : "";
  const fullName = typeof body?.fullName === "string" ? body.fullName.trim() : "";
  const invalid = validateCredentials(email, password);
  if (invalid) return jsonError(invalid, 400);

  const userId = await adminTransaction(async (client) => {
    await client.query("lock table auth.users in exclusive mode");
    const existing = await client.query("select 1 from auth.users limit 1");
    if (existing.rowCount) return null;
    const id = await createUser(client, { email, password, fullName });
    await replaceAssignments(client, id, [{ role: "superadmin", area: null }], null);
    return id;
  });
  if (!userId) return jsonError("El portal ya tiene un administrador. Inicia sesión.", 409);
  return attachSession(NextResponse.json({ ok: true }), request, userId);
}
