import { NextResponse } from "next/server";
import { allowedAreas, getSessionUser, isAdmin, isSuperadmin, jsonError } from "@/lib/server/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return jsonError("Inicia sesión para continuar.", 401);
  return NextResponse.json({ ...user, isAdmin: isAdmin(user), isSuperadmin: isSuperadmin(user), allowedAreas: allowedAreas(user) });
}
