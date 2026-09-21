import { NextResponse, type NextRequest } from "next/server";
import { readSessionToken, SESSION_COOKIE } from "@/lib/session-token";

// Exige sesión en todo el portal. Aquí solo se valida la firma y la vigencia de
// la cookie; las rutas del servidor comprueban además que el usuario siga activo.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = pathname === "/ingreso" || pathname.startsWith("/auth/");
  const session = await readSessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  if (!session && !isPublic) {
    if (pathname.startsWith("/api/")) return NextResponse.json({ message: "Inicia sesión para continuar." }, { status: 401 });
    const target = request.nextUrl.clone(); target.pathname = "/ingreso"; target.search = "";
    return NextResponse.redirect(target);
  }
  if (session && pathname === "/ingreso") {
    const target = request.nextUrl.clone(); target.pathname = "/"; target.search = "";
    return NextResponse.redirect(target);
  }
  return NextResponse.next({ request });
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"] };
