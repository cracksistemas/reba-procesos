import "server-only";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { Pool, type PoolClient } from "pg";

const globalStore = globalThis as unknown as { rebaPool?: Pool; rebaMigrated?: Promise<void> };

export function isDatabaseConfigured() { return Boolean(process.env.DATABASE_URL); }

function pool() {
  if (!process.env.DATABASE_URL) throw new Error("Falta la variable DATABASE_URL.");
  globalStore.rebaPool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: 10 });
  return globalStore.rebaPool;
}

// Aplica en orden los .sql de supabase/migrations que aún no estén registrados.
// El candado evita que dos instancias migren a la vez.
async function migrate() {
  const directory = path.join(process.cwd(), "supabase", "migrations");
  const files = (await readdir(directory)).filter((file) => file.endsWith(".sql")).sort();
  const client = await pool().connect();
  try {
    await client.query("select pg_advisory_lock(727322)");
    await client.query("create table if not exists public.schema_migrations (name text primary key, applied_at timestamptz not null default now())");
    const applied = new Set((await client.query<{ name: string }>("select name from public.schema_migrations")).rows.map((row) => row.name));
    for (const file of files) {
      if (applied.has(file)) continue;
      try { await client.query(await readFile(path.join(directory, file), "utf8")); }
      catch (error) { await client.query("rollback").catch(() => undefined); throw new Error(`Migración ${file}: ${(error as Error).message}`); }
      await client.query("insert into public.schema_migrations(name) values ($1)", [file]);
    }
    // El usuario de la app debe poder asumir el rol sobre el que aplican las políticas RLS.
    const [{ can_set: canSet }] = (await client.query<{ can_set: boolean }>("select rolsuper or pg_has_role(current_user, 'authenticated', 'SET') as can_set from pg_roles where rolname = current_user")).rows;
    if (!canSet) await client.query("grant authenticated to current_user").catch(() => { throw new Error("El usuario de DATABASE_URL no puede asumir el rol authenticated. Conéctate como dueño de la base o ejecuta: grant authenticated to <usuario>."); });
  } finally {
    await client.query("select pg_advisory_unlock(727322)").catch(() => undefined);
    client.release();
  }
}

export function ensureMigrated() {
  globalStore.rebaMigrated ??= migrate().catch((error) => { globalStore.rebaMigrated = undefined; throw error; });
  return globalStore.rebaMigrated;
}

// Consultas administrativas: la app ya validó el rol, se ejecutan como dueño de la base.
export async function adminQuery<T extends Record<string, unknown>>(text: string, values: unknown[] = []) {
  await ensureMigrated();
  return (await pool().query<T>(text, values)).rows;
}

export async function adminTransaction<T>(work: (client: PoolClient) => Promise<T>) {
  await ensureMigrated();
  const client = await pool().connect();
  try {
    await client.query("begin");
    const result = await work(client);
    await client.query("commit");
    return result;
  } catch (error) { await client.query("rollback").catch(() => undefined); throw error; }
  finally { client.release(); }
}

// Consultas de un usuario: mismo contexto que daba Supabase (rol authenticated + auth.uid()),
// de modo que las políticas RLS y las funciones de guardado deciden los permisos.
export async function userTransaction<T>(userId: string, work: (client: PoolClient) => Promise<T>) {
  return adminTransaction(async (client) => {
    await client.query("select set_config('app.user_id', $1, true)", [userId]);
    await client.query("set local role authenticated");
    return work(client);
  });
}
