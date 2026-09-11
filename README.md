# REBA Procesos

Portal de gestión, consulta, revisión y aprobación de procesos para Rebagliati Diplomados.

La solución sigue una arquitectura híbrida:

- **Next.js + Vercel:** experiencia web, rutas y despliegue.
- **Supabase:** autenticación, metadatos, RLS, aprobaciones y auditoría.
- **Google Drive:** repositorio documental y archivos maestros.
- **diagrams.net:** edición visual de los flujogramas `.drawio`.

El HTML puede publicarse, pero no es la fuente editable. Cada proceso debe mantener un solo archivo maestro `.drawio`.

## Estado del proyecto

El repositorio incluye un MVP funcional en modo piloto y la infraestructura necesaria para conectar Supabase. Los datos visibles en la interfaz son registros piloto basados en las áreas y referencias de la carpeta Drive compartida; deben validarse con los dueños antes de considerarse oficiales.

Módulos implementados:

- ingreso por enlace mágico de Supabase;
- dashboard gerencial;
- catálogo con búsqueda y filtros;
- áreas y mapa institucional;
- ficha de proceso con resumen, diagrama, documentos, KPI e historial;
- flujo piloto para enviar a revisión, observar y aprobar;
- cola de revisiones;
- indicadores;
- índice documental de Drive;
- administración de roles e integraciones;
- diseño responsive y accesible;
- esquema PostgreSQL, RLS, auditoría e inmutabilidad de versiones aprobadas.

## Inicio local

Requisitos: Node.js 20 o superior.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abre `http://localhost:3000`. Si no se define la clave pública de Supabase, `/ingreso` ofrece acceso al modo piloto.

## Variables de entorno

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_GOOGLE_DRIVE_ROOT_FOLDER_ID
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
```

No agregues `service_role` a variables públicas ni al navegador. La autorización debe verificarse en base de datos mediante RLS.

## Supabase

El esquema está en [`supabase/migrations/202609100001_initial_schema.sql`](supabase/migrations/202609100001_initial_schema.sql). Incluye perfiles, áreas, roles, procesos, versiones, participantes, documentos, comentarios, KPI, aprobaciones y auditoría.

```bash
npx supabase link --project-ref jqhechsdraqpdfyddaaz
npx supabase db push
```

Antes de producción:

1. Crea usuarios en Supabase Auth.
2. Crea sus perfiles y asignaciones de rol.
3. Ejecuta pruebas de RLS para cada rol.
4. Configura las URL de redirección de Auth para preview y production.
5. Mantén las claves secretas solo en el servidor.

## Google Drive y diagrams.net

La carpeta raíz identificada es:

```text
https://drive.google.com/drive/folders/1YoIFfdcoQn107r0juIKyQk6fhaQWkT1H
```

El MVP abre la carpeta institucional. En la siguiente fase, cada registro debe guardar `drawio_file_id` y `approved_pdf_file_id` para abrir el archivo exacto. La integración embebida de diagrams.net puede añadirse cuando el flujo de apertura directa esté validado.

La plantilla institucional está en [`docs/gobierno/03_plantilla_reba_procesos.drawio`](docs/gobierno/03_plantilla_reba_procesos.drawio).

## Artefactos de gobierno

- `docs/gobierno/01_catalogo_procesos.xlsx`
- `docs/gobierno/02_matriz_roles_permisos.xlsx`
- `docs/gobierno/03_plantilla_reba_procesos.drawio`
- `docs/gobierno/04_wireframe_reba_procesos.md`

## Rutas

| Ruta | Uso |
|---|---|
| `/ingreso` | Autenticación |
| `/` | Dashboard |
| `/procesos` | Catálogo |
| `/procesos/[code]` | Ficha del proceso |
| `/areas` | Áreas |
| `/mapa` | Mapa institucional |
| `/revisiones` | Cola de revisión |
| `/indicadores` | Indicadores de gobierno |
| `/documentos` | Índice documental |
| `/administracion` | Configuración |

## Verificación

```bash
npm run lint
npm run typecheck
npm run build
```

## Despliegue

Conecta el repositorio a Vercel, configura las variables por ambiente y usa el flujo `branch → Pull Request → Preview → QA → main → Production`. La base de datos y los archivos no deben depender del filesystem de Vercel.

## Pendientes organizacionales

El software no reemplaza las decisiones de gobierno. Antes del lanzamiento oficial se deben confirmar áreas, dueños, aprobadores, nomenclatura, permisos de Drive, procesos piloto y responsables de respaldo.
