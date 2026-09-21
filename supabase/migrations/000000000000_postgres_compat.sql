-- REBA PROCESOS · Compatibilidad con PostgreSQL sin Supabase
-- Crea lo mínimo que las migraciones siguientes esperan de Supabase: los roles
-- anon/authenticated/service_role, la tabla auth.users y la función auth.uid().
-- En un proyecto Supabase real todo esto ya existe y el archivo no cambia nada.

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
end;
$$;

create schema if not exists auth;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  encrypted_password text not null default '',
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  last_sign_in_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists users_email_lower_key on auth.users (lower(email));

-- La aplicación fija app.user_id por transacción; las políticas RLS y las
-- funciones de guardado lo leen igual que leían el JWT de Supabase.
do $$
begin
  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'auth' and p.proname = 'uid'
  ) then
    execute $f$
      create function auth.uid() returns uuid language sql stable as
      'select nullif(current_setting(''app.user_id'', true), '''')::uuid'
    $f$;
  end if;
end;
$$;

grant usage on schema auth to authenticated;
grant execute on function auth.uid() to authenticated;

-- Supabase concede estos permisos por defecto; en PostgreSQL hay que declararlos.
grant usage on schema public to authenticated;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant usage, select on sequences to authenticated;
alter default privileges in schema public grant execute on functions to authenticated;
