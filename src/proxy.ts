import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Exige sesión de Supabase en todo el portal. Sin variables de Supabase el
// despliegue queda en modo piloto y no se bloquea ninguna ruta.
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, { cookies: {
    getAll() { return request.cookies.getAll(); },
    setAll(items) {
      items.forEach(({ name, value }) => request.cookies.set(name, value));
      response = NextResponse.next({ request });
      items.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
    },
  } });

  const { data } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;
  const isPublic = pathname === "/ingreso" || pathname.startsWith("/auth/");

  if (!data.user && !isPublic) {
    const target = request.nextUrl.clone(); target.pathname = "/ingreso"; target.search = "";
    return NextResponse.redirect(target);
  }
  if (data.user && pathname === "/ingreso") {
    const target = request.nextUrl.clone(); target.pathname = "/"; target.search = "";
    return NextResponse.redirect(target);
  }
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"] };
