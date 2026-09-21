import { NextResponse } from "next/server";
import { adminQuery, isDatabaseConfigured } from "@/lib/server/db";

// Indica a /ingreso si debe ofrecer la creación del primer administrador.
export async function GET() {
  if (!isDatabaseConfigured()) return NextResponse.json({ configured: false, needsSetup: false });
  try {
    const [{ total }] = await adminQuery<{ total: number }>("select count(*)::int as total from auth.users");
    return NextResponse.json({ configured: true, needsSetup: total === 0 });
  } catch (error) {
    return NextResponse.json({ configured: true, needsSetup: false, message: (error as Error).message }, { status: 500 });
  }
}
