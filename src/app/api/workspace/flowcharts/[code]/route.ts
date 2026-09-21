import { NextResponse } from "next/server";
import { userTransaction } from "@/lib/server/db";
import { getSessionUser, jsonError } from "@/lib/server/session";

export async function GET(_request: Request, ctx: RouteContext<"/api/workspace/flowcharts/[code]">) {
  const user = await getSessionUser();
  if (!user) return jsonError("Inicia sesión para continuar.", 401);
  const { code } = await ctx.params;
  const rows = await userTransaction(user.id, async (client) => (await client.query<{ snapshot: unknown }>("select public.get_flowchart_document($1) as snapshot", [code])).rows);
  return NextResponse.json({ snapshot: rows[0]?.snapshot ?? null });
}

export async function PUT(request: Request, ctx: RouteContext<"/api/workspace/flowcharts/[code]">) {
  const user = await getSessionUser();
  if (!user) return jsonError("Inicia sesión para guardar este cambio.", 401);
  const { code } = await ctx.params;
  const body = await request.json().catch(() => null) as { areaCode?: string; subareaCode?: string; title?: string; description?: string; snapshot?: unknown } | null;
  if (!body?.snapshot || typeof body.snapshot !== "object") return jsonError("Solicitud inválida.", 400);
  try {
    await userTransaction(user.id, (client) => client.query(
      "select public.save_flowchart_document($1, $2, $3, $4, $5, $6::jsonb, $7)",
      [code, body.areaCode ?? "", body.subareaCode ?? "", body.title ?? "", body.description ?? "", JSON.stringify(body.snapshot), "Edición visual desde REBA Procesos"]));
    return NextResponse.json({ ok: true });
  } catch (error) {
    const denied = (error as { code?: string }).code === "42501";
    return jsonError(denied ? "No tienes permiso para editar esta área." : (error as Error).message, denied ? 403 : 400);
  }
}
