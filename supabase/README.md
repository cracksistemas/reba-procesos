# Supabase

1. Vincula el proyecto: `npx supabase link --project-ref jqhechsdraqpdfyddaaz`.
2. Revisa la migración en `migrations/202609100001_initial_schema.sql`.
3. Aplica con `npx supabase db push`.
4. Crea el primer usuario en Auth y asigna un registro en `profiles` y `user_roles`.
5. Configura en Vercel únicamente `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` para el cliente. La clave `service_role` no debe exponerse.

Las políticas RLS cubren lectura, edición por área, revisión, aprobación y protección de versiones aprobadas. Antes de producción deben ejecutarse pruebas de permisos con usuarios de cada rol.
