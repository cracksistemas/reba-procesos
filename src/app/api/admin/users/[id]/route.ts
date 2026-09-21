import { NextResponse } from "next/server";
import { adminTransaction } from "@/lib/server/db";
import { hashPassword, MIN_PASSWORD_LENGTH } from "@/lib/server/passwords";
import { getSessionUser, isAdmin, jsonError } from "@/lib/server/session";
import { normalizeEmail, parseAssignments, replaceAssignments } from "@/lib/server/users";

// Edita nombre, correo, estado, contraseña y roles. Los usuarios no se eliminan:
// se desactivan, porque el historial de procesos y diagramas los referencia.
export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/users/[id]">) {
  const admin = await getSessionUser();
  if (!isAdmin(admin)) return jsonError("Solo los administradores pueden gestionar usuarios.", 403);
  const { id } = await ctx.params;
  const body = await request.json().catch(() => null) as { email?: unknown; password?: unknown; fullName?: unknown; isActive?: unknown; assignments?: unknown } | null;
  if (!body) return jsonError("Solicitud inválida.", 400);

  const email = body.email === undefined ? null : normalizeEmail(body.email);
  if (email !== null && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return jsonError("Ingresa un correo válido.", 400);
  const password = typeof body.password === "string" && body.password ? body.password : null;
  if (password && password.length < MIN_PASSWORD_LENGTH) return jsonError(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`, 400);
  const assignments = body.assignments === undefined ? null : parseAssignments(body.assignments);
  if (id === admin!.id && (body.isActive === false || (assignments && !assignments.some((item) => item.role === "superadmin" || item.role === "process_admin")))) {
    return jsonError("No puedes desactivarte ni quitarte el rol de administrador a ti mismo.", 400);
  }

  try {
    const found = await adminTransaction(async (client) => {
      const exists = await client.query("select 1 from auth.users where id = $1 for update", [id]);
      if (!exists.rowCount) return false;
      if (email !== null) { await client.query("update auth.users set email = $2, updated_at = now() where id = $1", [id, email]); await client.query("update public.profiles set email = $2 where id = $1", [id, email]); }
      if (password) await client.query("update auth.users set encrypted_password = $2, updated_at = now() where id = $1", [id, await hashPassword(password)]);
      if (typeof body.fullName === "string") await client.query("update public.profiles set full_name = $2 where id = $1", [id, body.fullName.trim()]);
      if (typeof body.isActive === "boolean") await client.query("update public.profiles set is_active = $2 where id = $1", [id, body.isActive]);
      if (assignments) await replaceAssignments(client, id, assignments, admin!.id);
      return true;
    });
    return found ? NextResponse.json({ ok: true }) : jsonError("Usuario no encontrado.", 404);
  } catch (error) {
    const duplicate = (error as { code?: string }).code === "23505";
    return jsonError(duplicate ? "Ya existe un usuario con ese correo." : (error as Error).message, duplicate ? 409 : 400);
  }
}
