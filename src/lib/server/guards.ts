import "server-only";
import { notFound } from "next/navigation";
import { canAccessArea, getSessionUser } from "@/lib/server/session";

// Las páginas de un área devuelven 404 a quien no tiene acceso, para no
// revelar siquiera que existe. Las páginas son dinámicas porque dependen de la sesión.
export async function requireAreaAccess(areaCode: string) {
  const user = await getSessionUser();
  if (!user || !canAccessArea(user, areaCode)) notFound();
  return user;
}
