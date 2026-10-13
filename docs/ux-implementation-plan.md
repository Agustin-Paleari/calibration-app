# Handoff µDENT: revisión y plan de implementación

Referencia entregada por el usuario: [UX_REFERENCE_UDENT.md](UX_REFERENCE_UDENT.md). Se conserva como documento de referencia; describe tanto ideas de UX como un backend que no está en este repositorio. La implementación usa textos y componentes propios de Calibration Hub.

## Estado inspeccionado

- **Arquitectura:** React 19, TypeScript y Vite. `App.tsx` coordina navegación, persistencia y respaldo; los componentes contienen los formularios y las vistas. No hay `manage.py`, servidor Django, templates Django, Django Admin ni PostgreSQL conectado.
- **Modelos:** `Store` versión 1 contiene modelos de impresora, equipos físicos, resinas y calibraciones. Cada calibración tiene identidad propia, historial de ensayos, método, contexto y origen de una receta reutilizada. `sourceId` identifica un origen de datos; no autentica a una persona.
- **Persistencia y migraciones:** la web usa `localStorage` y restauración JSON validada. `withCurrentCatalog` actualiza el catálogo sin eliminar modelos pendientes. `database/001_initial.sql` y `scripts/database.ts` archivan respaldos en SQLite, con transacciones, ensayos inmutables y versiones de protocolo. No hay migraciones Django. El archivo SQLite no se consulta desde el frontend.
- **Calibración:** bloque X = 12 mm, Y = 10 mm, un hueco y un pin cualitativo. Tolerancia inclusiva actual ±0,050 mm. Exposición funcional estable antes del ajuste dimensional; soportes fallidos impiden ajustar dimensiones. Escalado proporcional exacto sobre la escala aplicada. A/B dependen de una convención de CHITUBOX confirmada. Método y versión de motor se conservan por ensayo.
- **Pantallas:** inicio, preparación unificada, ensayo/análisis/historial, biblioteca local de recetas finalizadas, catálogo y guía. No existe base pública ni una página de moderación.
- **Catálogo:** modelos manuales `pending`; resinas sin estado administrativo. PioCreat/Aidis comparten una familia, pero no hay entidades OEM/alias, auditoría `submitted_*`, ni fusión administrativa. Los eventos de revisión de candidatos en SQLite no equivalen a un admin de catálogo.

## Comparación con los criterios del handoff

| Criterio                                | Estado antes de esta etapa                | Alcance / siguiente etapa                                       |
| --------------------------------------- | ----------------------------------------- | --------------------------------------------------------------- |
| Home sin dashboard técnico              | Progreso y métricas de laboratorio        | Fase A: hero con calibrar/consultar, buscador y actividad local |
| Marca→modelo / marca→resina             | Implementado en preparación               | Conservar y usar también en búsqueda                            |
| Entradas manuales PENDING               | Modelo sí; resina no                      | Fase C: estados y auditoría en ambos catálogos                  |
| Progreso por pasos                      | Componente de tres pasos                  | Fase A: cuatro pasos reutilizables                              |
| Medición X/Y protagonista               | Formulario con esquema propio             | Fase B: workspace de medición                                   |
| Pin con cinco estados                   | Tres estados, más datos legacy            | Fase B: schema versionado y compatibilidad                      |
| Soportes con tres estados               | Implementado con desplegable              | Fase B: radio cards                                             |
| Analizar abre modal                     | Resultado en la misma vista               | Fase B: modal accesible conservando historial                   |
| Error en mm, µm, % y corrección         | mm/% y ajustes existentes                 | Fase B: presentación completa                                   |
| Fórmula exacta de escala                | Implementada, sin límite de ±1 punto      | Conservar y verificar con tests                                 |
| Redondeo a tres decimales               | `q3`; formato a tres decimales            | Revisar ROUND_HALF_UP, especialmente negativos, en Fase B       |
| Próximo ensayo permanece en calibración | Implementado                              | Conservar                                                       |
| Historial conserva resultados           | Implementado, archivo SQLite inmutable    | Conservar; no fusionar calibraciones                            |
| Aprobadas aparecen públicamente         | No hay API/base pública conectada         | Fase C/backend: definir publicación y permisos                  |
| PENDING no se publica                   | No existe publicación                     | Fase C/backend: regla de elegibilidad real                      |
| Admin corrige/fusiona catálogo          | No implementado                           | Fase C: identidades canónicas y merge auditado                  |
| Desktop y mobile                        | Implementado                              | Fase A: revisar nueva navegación, guía y búsqueda               |
| SQLite migra sin pérdida                | Archivo de esquema v1, importador probado | Fase A sin cambios de schema; migración explícita en B/C        |

## Compatibilidad y diferencias a resolver

1. **Tolerancia:** el handoff pide ±0,025 mm, pero el protocolo actual y los ensayos archivados usan ±0,050 mm. Cambiar una constante reinterpretaría resultados finalizados y podría rechazar respaldos. La Fase A muestra el valor actual desde `REFERENCE`. Una tolerancia nueva necesita protocolo nuevo, snapshots y una política explícita para registros anteriores.
2. **Backend:** mantener Django solo es posible si se entrega el proyecto Django mencionado. No se reemplaza el frontend ni se inventa un backend durante una etapa de UX. PostgreSQL requeriría adaptar el esquema SQLite (`STRICT`, triggers, tipos y migraciones), además de construir API y moderación.
3. **Cinco encastres:** actualmente tipos, validador JSON, recomendaciones y constraint SQL admiten tres valores. La ampliación requiere compatibilidad con esos tres y con `pin7/pin5`, nunca reinterpretar silenciosamente observaciones antiguas.
4. **A fijo y redondeo:** hoy el paso de A es editable. Fijarlo o cambiar `q3` modifica recomendaciones y corresponde a una versión nueva del método/motor, no al CSS.
5. **Resultados públicos:** una receta local finalizada no representa una publicación ni una aprobación independiente. En la Fase A, búsqueda y actividad se identifican como locales. No se inventan autores, usuarios o evidencia comunitaria.
6. **STL:** el ZIP contiene documentos, sin modelo propio descargable. La guía explica la pieza disponible y señala que el STL todavía no está incluido. No se descargan ni reutilizan assets de µDENT.
7. **Rutas:** esta web y el HTML autónomo navegan por vistas locales. La guía es una vista accesible desde el header; no se crea un `/guia/` de Django ni se exige reconfigurar el hosting. Rutas compartibles pueden añadirse después con una estrategia compatible con el HTML autónomo.
8. **Independencia de registros:** modelo + resina + capa siguen siendo filtros, nunca claves únicas. La búsqueda muestra todas las calibraciones coincidentes, incluso con exposiciones distintas.

## Commits y etapas

1. **Revisión:** guardar referencia, comparación, riesgos y plan (este documento).
2. **Fase A — shell y búsqueda:** header Calibrar / Parámetros / Guía, acceso a historial y herramientas de taller; inicio con dos acciones, búsqueda encadenada, recuperación de pendientes y actividad local. Estilos azul/índigo, superficies blancas y gris claro.
3. **Fase A — guía y progreso:** guía visual de siete pasos, componente de cuatro pasos accesible, adaptación móvil y verificación del HTML autónomo. Sin cambios de algoritmo, schema, moderación ni formatos de respaldo.
4. **Fase B — medición/análisis:** workspace, cinco encastres, radio cards de soportes, modal de resultado y revisión de medidas extremas. Antes, resolver protocolo de tolerancia y migración de encastres; versionar método y snapshots.
5. **Fase C — catálogo/backend:** estados de resina/modelo, originales enviados, merge auditado y aliases OEM. Definir backend real y conectar publicación con elegibilidad administrativa.
6. **Fase D — visor:** primero visual propio; integrar modelo propio y controles reales cuando esté disponible. No presentar una ilustración como visor 3D interactivo.

## Verificación de Fase A

Checks apropiados a este repositorio: `npm test`, `npm run build:standalone`, Playwright con Chromium y revisión visual desktop/mobile. La suite SQLite verifica importación transaccional y conservación de dos exposiciones para una combinación. `python manage.py check` no aplica porque no existe un proyecto Django. No se modifica ninguna migración en esta etapa.

## Entrega de Fase A (v1.3)

La versión continúa la numeración del repo (v1.2 → v1.3); implementa la Fase A del hito llamado v0.3 en el handoff. Se separaron los componentes `AppHeader`, `Home`, `ParameterSearch` y `Guide`, y se integró la nueva interfaz en un commit posterior. Los estilos de esta etapa están en `src/styles/ux-shell.css`, después de la base de componentes.

- Home con dos acciones, búsqueda encadenada, recuperación de una calibración pendiente y últimas recetas locales. Sin estadísticas vacías ni evidencia pública simulada.
- Header Calibrar / Parámetros / Guía, acceso a Historial y menú Mi taller con catálogo, exportación y restauración.
- Progreso reutilizable de cuatro etapas, visible al desplazarse. Al guardar, el título enfocado queda debajo del progreso, sin quedar tapado. Repetir regresa a Medir dentro de la calibración.
- Guía visual de siete pasos, referencia propia y unidades mm/µm. El valor de tolerancia se toma del protocolo actual y la falta del STL se informa claramente.
- Navegación accesible en móvil, cierre del menú con Escape, devolución del foco al cerrar la preparación y exclusión de campos ocultos del recorrido de Tab en el modal.

Verificación realizada: **53 tests unitarios/SQLite**, **24 tests Playwright**, TypeScript, compilación de producción y regeneración/prueba del HTML autónomo. Revisión visual en escritorio y móvil. Las pruebas incluyen dos equipos del mismo modelo y material con exposiciones 2,500 s y 2,800 s: ambos aparecen en la búsqueda; consultar y limpiar filtros no altera sus datos. Las pruebas también conservan los casos de encastres legacy, modelos pendientes, respaldos válidos/corruptos y ensayo siguiente con resultados vacíos.

`src/domain`, `src/data`, `database` y los scripts de importación conservan su implementación anterior. No se reinterpretan resultados ni se modifican formatos de respaldo o schema. Para Fase B se mantiene pendiente el diseño de protocolo/migración para ±0,025 mm y cinco encastres; para Fase C, confirmar el backend real y construir moderación/publicación. La ilustración actual es propia y estática, sin controles de cámara simulados.
