export const LOCAL_AUTH_COOKIE = "reba_local_session";
export const LOCAL_AUTH_PAYLOAD = "reba-procesos-local-admin-v1";

export function getLocalAuthConfig() {
  const password = process.env.LOCAL_AUTH_PASSWORD;
  // Reuses the existing private Vercel repair secret only to sign the session.
  // It is never returned to the browser and is not the login password.
  const secret = process.env.LOCAL_AUTH_SECRET ?? process.env.ADMIN_REPAIR_TOKEN;
  return {
    email: (process.env.LOCAL_AUTH_EMAIL ?? "admin@rebagliatidiplomados.com").trim().toLowerCase(),
    password,
    secret,
  };
}

export function isLocalAuthConfigured() {
  const { password, secret } = getLocalAuthConfig();
  return Boolean(password && secret);
}
