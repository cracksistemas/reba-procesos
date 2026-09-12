# REBA Procesos

Portal de gestión, consulta, revisión y aprobación de procesos para Rebagliati Diplomados.

La solución sigue una arquitectura híbrida:

- **Next.js + Vercel:** experiencia web, rutas y despliegue.
- **Supabase:** autenticación, metadatos, RLS, aprobaciones y auditoría.
- **Google Drive:** repositorio documental y archivos maestros.
- **Editor visual REBA sobre XYFlow (MIT):** lienzo integrado con arrastre, conexiones, zoom, minimapa, selección múltiple y cuadros de actividad, decisión, evidencia, inicio y fin.
- **Marketing v3.0:** 17 flujogramas operativos importados desde el HTML institucional, agrupados en 8 subáreas y conservados como 155 nodos y 163 conexiones editables.

El HTML puede publicarse, pero no es la fuente editable. Cada proceso debe mantener un solo archivo maestro `.drawio`.

## Estado del proyecto

El repositorio incluye un MVP funcional en modo piloto y la infraestructura necesaria para conectar Supabase. Los datos visibles en la interfaz son registros piloto basados en las áreas y referencias de la carpeta Drive compartida; deben validarse con los dueños antes de considerarse oficiales.

Módulos implementados:

- ingreso por enlace mágico de Supabase;
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
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_GOOGLE_DRIVE_ROOT_FOLDER_ID
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
```

No agregues `service_role` a variables públicas ni al navegador. La autorización debe verificarse en base de datos mediante RLS.

## Supabase

El esquema está en [`supabase/migrations`](supabase/migrations). Incluye perfiles, áreas, subáreas con flujogramas, roles, procesos, versiones, participantes, documentos, comentarios, KPI, aprobaciones y auditoría.

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
