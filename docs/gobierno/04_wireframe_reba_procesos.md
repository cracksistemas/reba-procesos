# Wireframe REBA Procesos

El prototipo funcional del portal reemplaza un wireframe estático: cada ruta representa una pantalla validable.

| Ruta | Pantalla | Objetivo |
|---|---|---|
| `/ingreso` | Acceso | Autenticación por correo institucional |
| `/` | Dashboard | Resumen, pendientes, avance y actividad |
| `/procesos` | Catálogo | Buscar y filtrar procesos |
| `/procesos/[code]` | Ficha | Resumen, diagrama, documentos, KPI e historial |
| `/areas` | Áreas | Responsables y madurez documental |
| `/mapa` | Mapa institucional | Procesos estratégicos, misionales y soporte |
| `/revisiones` | Cola de revisión | Observar o aprobar versiones |
| `/indicadores` | Gobierno | Cobertura, tiempos y brechas |
| `/documentos` | Índice documental | Enlaces hacia Drive |
| `/administracion` | Administración | Roles, flujos e integraciones |

## Reglas de interfaz

- Lectura como modo predeterminado.
- Acciones de edición solo para roles autorizados.
- Estados visibles con texto y color.
- Navegación adaptable para escritorio, tableta y móvil.
- Mensajes de error en lenguaje operativo.
- Confirmación únicamente para aprobar, obsoletar, eliminar o descartar cambios.
