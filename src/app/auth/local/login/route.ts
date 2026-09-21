import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getLocalAuthConfig, isLocalAuthConfigured, LOCAL_AUTH_COOKIE, LOCAL_AUTH_PAYLOAD } from "@/lib/local-auth";

function sameValue(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function sessionValue(secret: string) {
  return createHmac("sha256", secret).update(LOCAL_AUTH_PAYLOAD).digest("base64url");
}

export async function POST(request: Request) {
  if (!isLocalAuthConfigured()) {
    return NextResponse.json({ message: "El acceso local aún no está configurado en Vercel." }, { status: 503 });
  }

  const body = await request.json().catch(() => null) as { email?: unknown; password?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const { email: allowedEmail, password: allowedPassword, secret } = getLocalAuthConfig();

  if (!allowedPassword || !secret || !sameValue(email, allowedEmail) || !sameValue(password, allowedPassword)) {
    return NextResponse.json({ message: "Correo o contraseña incorrectos." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(LOCAL_AUTH_COOKIE, sessionValue(secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
