import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isLocalAuthConfigured, LOCAL_AUTH_COOKIE, LOCAL_AUTH_PAYLOAD } from "@/lib/local-auth";

async function localSessionIsValid(request: NextRequest) {
  const secret = process.env.LOCAL_AUTH_SECRET;
  const session = request.cookies.get(LOCAL_AUTH_COOKIE)?.value;
  if (!secret || !session) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(LOCAL_AUTH_PAYLOAD));
  const expected = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  if (expected.length !== session.length) return false;
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) difference |= expected.charCodeAt(index) ^ session.charCodeAt(index);
  return difference === 0;
}

// Exige sesión de Supabase en todo el portal. Sin variables de Supabase el
// despliegue queda en modo piloto y no se bloquea ninguna ruta.
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const { pathname } = request.nextUrl;
  const isPublic = pathname === "/ingreso" || pathname.startsWith("/auth/");

  // Local access intentionally takes precedence when Supabase is unavailable or restricted.
  if (isLocalAuthConfigured()) {
    const localUser = await localSessionIsValid(request);
    if (!localUser && !isPublic) {
      const target = request.nextUrl.clone(); target.pathname = "/ingreso"; target.search = "";
      return NextResponse.redirect(target);
    }
    if (localUser && pathname === "/ingreso") {
      const target = request.nextUrl.clone(); target.pathname = "/"; target.search = "";
      return NextResponse.redirect(target);
    }
    return NextResponse.next({ request });
  }

  if (!url || !key) {
    if (isPublic) return NextResponse.next({ request });
    const target = request.nextUrl.clone(); target.pathname = "/ingreso"; target.search = "";
    return NextResponse.redirect(target);
  }

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
