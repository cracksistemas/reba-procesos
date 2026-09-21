import { NextResponse } from "next/server";
import { getSessionUser, isAdmin, jsonError } from "@/lib/server/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return jsonError("Inicia sesión para continuar.", 401);
  return NextResponse.json({ ...user, isAdmin: isAdmin(user) });
}
