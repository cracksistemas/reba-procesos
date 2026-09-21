// Firma y verificación de la cookie de sesión. Usa Web Crypto para servir tanto
// al proxy como a las rutas del servidor. Formato: <payload base64url>.<firma>.
export const SESSION_COOKIE = "reba_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export type SessionPayload = { uid: string; exp: number };

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array) { return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, ""); }
function fromBase64Url(value: string) { return Uint8Array.from(atob(value.replace(/-/g, "+").replace(/_/g, "/")), (char) => char.charCodeAt(0)); }

// SESSION_SECRET es opcional: la contraseña aleatoria dentro de DATABASE_URL ya
// es un secreto estable del despliegue y basta para derivar la clave de firma.
async function signingKey() {
  const source = process.env.SESSION_SECRET || process.env.DATABASE_URL;
  if (!source) return null;
  const material = await crypto.subtle.digest("SHA-256", encoder.encode(`reba-procesos-session:${source}`));
  return crypto.subtle.importKey("raw", material, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function createSessionToken(uid: string) {
  const key = await signingKey();
  if (!key) throw new Error("Falta la variable DATABASE_URL.");
  const payload = toBase64Url(encoder.encode(JSON.stringify({ uid, exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE } satisfies SessionPayload)));
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(payload)));
  return `${payload}.${toBase64Url(signature)}`;
}

export async function readSessionToken(token: string | undefined): Promise<SessionPayload | null> {
  const [payload, signature] = token?.split(".") ?? [];
  const key = await signingKey();
  if (!payload || !signature || !key) return null;
  try {
    if (!(await crypto.subtle.verify("HMAC", key, fromBase64Url(signature), encoder.encode(payload)))) return null;
    const data = JSON.parse(new TextDecoder().decode(fromBase64Url(payload))) as SessionPayload;
    return typeof data.uid === "string" && data.exp > Date.now() / 1000 ? data : null;
  } catch { return null; }
}
