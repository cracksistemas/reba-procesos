import "server-only";
import type { PoolClient } from "pg";
import { hashPassword, MIN_PASSWORD_LENGTH } from "@/lib/server/passwords";

export type RoleAssignment = { role: string; area: string | null };

export function normalizeEmail(value: unknown) { return typeof value === "string" ? value.trim().toLowerCase() : ""; }

export function validateCredentials(email: string, password: string) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Ingresa un correo válido.";
  if (password.length < MIN_PASSWORD_LENGTH) return `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  return null;
}

export function parseAssignments(value: unknown): RoleAssignment[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const entry = item as { role?: unknown; area?: unknown };
    if (typeof entry?.role !== "string" || !entry.role) return [];
    return [{ role: entry.role, area: typeof entry.area === "string" && entry.area ? entry.area : null }];
  });
}

// El trigger handle_new_auth_user crea el perfil a partir de la fila de auth.users.
export async function createUser(client: PoolClient, input: { email: string; password: string; fullName: string }) {
  const { rows } = await client.query<{ id: string }>(
    "insert into auth.users(email, encrypted_password, raw_user_meta_data) values ($1, $2, jsonb_build_object('full_name', $3::text)) returning id",
    [input.email, await hashPassword(input.password), input.fullName]);
  return rows[0].id;
}

export async function replaceAssignments(client: PoolClient, userId: string, assignments: RoleAssignment[], grantedBy: string | null) {
  await client.query("delete from public.user_roles where user_id = $1", [userId]);
  for (const { role, area } of assignments) {
    const result = await client.query(
      `insert into public.user_roles(user_id, role_id, area_id, granted_by)
       select $1, r.id, a.id, $4 from public.roles r left join public.areas a on a.code = $3
       where r.code = $2 and ($3::text is null or a.id is not null)
       on conflict do nothing`, [userId, role, area, grantedBy]);
    if (result.rowCount === 0) {
      const known = await client.query("select 1 from public.roles where code = $1", [role]);
      if (known.rowCount === 0) throw new Error(`Rol desconocido: ${role}`);
    }
  }
}
