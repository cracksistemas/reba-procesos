export const LOCAL_AUTH_COOKIE = "reba_local_session";
export const LOCAL_AUTH_PAYLOAD = "reba-procesos-local-admin-v1";

export function isLocalAuthConfigured() {
  return Boolean(
    process.env.LOCAL_AUTH_EMAIL &&
    process.env.LOCAL_AUTH_PASSWORD &&
    process.env.LOCAL_AUTH_SECRET,
  );
}
