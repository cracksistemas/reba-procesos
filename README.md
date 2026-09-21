# REBA Procesos

Portal de gestión, consulta, revisión y aprobación de procesos para Rebagliati Diplomados.

La solución sigue una arquitectura híbrida:

- **Next.js + Vercel:** experiencia web, rutas y despliegue.
- **PostgreSQL:** usuarios, roles, metadatos, RLS, aprobaciones y auditoría.
- **Google Drive:** repositorio documental y archivos maestros.
- **Editor visual REBA sobre XYFlow (MIT):** lienzo integrado con arrastre, conexiones, zoom, minimapa, selección múltiple y autoajuste de cada figura al largo de su texto.
- **Marketing v3.0:** 17 flujogramas operativos importados desde el HTML institucional, agrupados en 8 subáreas y conservados como 155 nodos y 163 conexiones editables.

El HTML puede publicarse, pero no es la fuente editable. Cada proceso debe mantener un solo archivo maestro `.drawio`.

## Estado del proyecto

El repositorio incluye un MVP funcional en modo piloto y la infraestructura necesaria para conectar Supabase. Los datos visibles en la interfaz son registros piloto basados en las áreas y referencias de la carpeta Drive compartida; deben validarse con los dueños antes de considerarse oficiales.

Módulos implementados:

- ingreso con correo y contraseña, y gestión de usuarios y roles;
- dashboard gerencial;
- catálogo con búsqueda y filtros;
- áreas, subáreas y mapa institucional;
- creación de subáreas y edición visual de sus flujogramas en modo piloto;
- biblioteca de flujogramas agrupada por área, con búsqueda y acceso directo al lienzo;
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
DATABASE_URL                              # obligatorio: postgres://usuario:clave@host:5432/base
SESSION_SECRET                            # opcional: si falta, la firma de sesión se deriva de DATABASE_URL
NEXT_PUBLIC_GOOGLE_DRIVE_ROOT_FOLDER_ID
```

## Base de datos y usuarios

El portal usa un PostgreSQL propio (un solo contenedor); ya no depende de Supabase.

- Al arrancar aplica solo, en orden, los `.sql` de [`supabase/migrations`](supabase/migrations) y los registra en `public.schema_migrations`.
- `000000000000_postgres_compat.sql` crea lo que las migraciones esperaban de Supabase (`auth.users`, `auth.uid()` y el rol `authenticated`), por lo que las políticas RLS siguen decidiendo los permisos.
- Con la base vacía, `/ingreso` pide crear al primer superadministrador. Los demás usuarios, contraseñas y roles por área se gestionan en `/administracion`.
- Los usuarios no se eliminan: se desactivan, porque el historial los referencia.

## Google Drive y edición visual

La carpeta raíz identificada es:

```text
https://drive.google.com/drive/folders/1YoIFfdcoQn107r0juIKyQk6fhaQWkT1H
```

El MVP abre la carpeta institucional y ofrece un lienzo propio inspirado en Miro, construido sobre `@xyflow/react`, para editar los flujos como JSON estructurado. El formato anterior guardado en el navegador se migra automáticamente. En la siguiente fase, cada registro debe guardar `approved_pdf_file_id`; la importación o exportación `.drawio` puede añadirse como interoperabilidad opcional.

La plantilla institucional está en [`docs/gobierno/03_plantilla_reba_procesos.drawio`](docs/gobierno/03_plantilla_reba_procesos.drawio).

La conversión reproducible del paquete de Marketing se encuentra en [`scripts/import-marketing-flows.ps1`](scripts/import-marketing-flows.ps1). El HTML se usa como fuente de importación; los diagramas operativos del portal viven en JSON estructurado.

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
| `/areas` | Áreas y resumen de subáreas |
| `/areas/[code]` | Subáreas, responsables y flujogramas del área |
| `/flujogramas` | Biblioteca agrupada y editor visual de flujogramas |
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
