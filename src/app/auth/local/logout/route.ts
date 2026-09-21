import { NextResponse } from "next/server";
import { LOCAL_AUTH_COOKIE } from "@/lib/local-auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(LOCAL_AUTH_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0, sameSite: "lax" });
  return response;
}
