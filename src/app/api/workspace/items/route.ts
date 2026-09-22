import { NextResponse } from "next/server";
import { userTransaction } from "@/lib/server/db";
import { canEditArea, getSessionUser, jsonError } from "@/lib/server/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return jsonError("Inicia sesión para continuar.", 401);
  const rows = await userTransaction(user.id, async (client) => (await client.query("select * from public.get_workspace_items()")).rows);
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("Inicia sesión para guardar este cambio.", 401);
  const item = await request.json().catch(() => null);
  if (!item || typeof item !== "object") return jsonError("Solicitud inválida.", 400);
  // Crear o editar exige rol de edición en el área; leer basta con verla.
  const areaCode = String((item as { area_code?: unknown }).area_code ?? "");
  if (!canEditArea(user, areaCode)) return jsonError("No tienes permiso para editar esta área.", 403);
  try {
    await userTransaction(user.id, (client) => client.query("select public.save_workspace_item($1::jsonb)", [JSON.stringify(item)]));
    return NextResponse.json({ ok: true });
  } catch (error) {
    const denied = (error as { code?: string }).code === "42501";
    return jsonError(denied ? "No tienes permiso para editar esta área." : (error as Error).message, denied ? 403 : 400);
  }
}
