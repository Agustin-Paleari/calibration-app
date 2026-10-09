# Datos de calibración: conservación y comparación

La aplicación funciona en el navegador, sin login ni servicio remoto. Además del respaldo JSON, el repositorio incluye una base relacional SQLite ejecutable y un importador transaccional. El SQL no es un boceto: se crea y se prueba con SQLite real en `tests/data/database.test.ts`. No hay todavía una conexión del frontend a un servidor compartido ni una identificación de personas verificada.

## Una combinación identifica una búsqueda, no un resultado único

Dos autores que calibran el mismo modelo, producto de resina, color y altura de capa pueden obtener exposiciones diferentes. Se conservan **dos calibraciones y dos perfiles candidatos**. No hay una restricción UNIQUE sobre impresora + resina + capa, ni sobre exposición. Tampoco se elige automáticamente un ganador, se promedian resultados o se elimina una discrepancia.

| Entidad             | Identidad                               | Qué se puede compartir                                           |
| ------------------- | --------------------------------------- | ---------------------------------------------------------------- |
| Modelo de impresora | marca y nombre normalizados             | El modelo comercial                                              |
| Producto de resina  | fabricante, nombre y color normalizados | El producto, sin mezclar colores                                 |
| Equipo físico       | origen + ID local de equipo             | Nunca se fusionan equipos de orígenes distintos                  |
| Calibración         | origen + ID local de calibración        | Cada proceso conserva sus propios ensayos                        |
| Ensayo              | origen + ID local de ensayo             | Observación inmutable, incluso si comparte parámetros con otra   |
| Perfil candidato    | origen + ID de calibración              | Un resultado de ese proceso; no un perfil universal del producto |

`sourceId` es un identificador persistente del origen de los datos. No es el nombre de una persona ni prueba de autoría. Una futura API debe vincularlo con una identidad autenticada y permisos, sin permitir que el cliente suplante a otro autor.

La normalización actual utiliza Unicode NFKC, espacios y mayúsculas/minúsculas. No fusiona alias comerciales por semejanza, ni productos que contienen formulaciones distintas. Resolver alias necesita una revisión explícita de catálogo.

## Estructura real

`database/001_initial.sql` crea tablas STRICT, claves foráneas, CHECK de unidades/estados, índices y versión de esquema:

- `sources`, `printer_models`, `printer_units`, `resin_products`: origen, catálogo y equipos físicos.
- `protocols`: referencia nominal y criterio dimensional. El protocolo actual de un pin y el histórico de dos encastres están separados.
- `calibrations`, `trials`: proceso y observaciones originales, secuencia, exposición, capa, X/Y, encastre, soportes, escala/A/B, fecha y notas. Cada ensayo nuevo conserva además el método y la versión del motor de recomendaciones vigentes al guardarlo.
- Los ensayos también registran instrumento, momento de medición, slicer/versión, lote, lavado y curado cuando se conocen. Los valores desconocidos se conservan como NULL/unknown.
- `candidate_profiles`: receta local que pasó los criterios; comienza como `unreviewed`. Cada combinación admite tantos candidatos como calibraciones independientes existan.
- `ingestion_batches`: respaldo recibido, fecha y digest, para trazabilidad y reimportación.
- `review_events`: espacio relacional para decisiones y evidencia de revisores; no hay un servicio administrativo ni aprobaciones simuladas.

El JSON original de cada ensayo y respaldo también se conserva. Se trata de un archivo de observaciones: no se borran registros porque desaparezcan del próximo respaldo. Reabrir una calibración inactiva su candidato vigente y conserva sus ensayos.

## Importar y consultar en un entorno de desarrollo

Node.js **22.13 o superior**, preferiblemente 24 LTS, y `npm ci`. El importador usa `node:sqlite` y `tsx`; no necesita un servicio externo. En algunas versiones de Node, SQLite emite un aviso de API experimental. Estos comandos son herramientas de mantenimiento del repositorio, no instrucciones que necesite ejecutar un usuario de la web.

Exportá el respaldo desde la aplicación y ejecutá:

```sh
npm run data:import -- /ruta/respaldo-persona-a.json
npm run data:import -- /ruta/respaldo-persona-b.json
npm run data:profiles -- .data/calibrations.sqlite
```

La última consulta devuelve una fila por candidato activo, con origen, calibración, modelo, resina, color, capa y exposición. Si A obtuvo 2,400 s y B obtuvo 2,800 s, aparecen ambas filas. El importador comparte el parser y los criterios de aprobación con la aplicación.

Se puede seleccionar otro archivo mediante `--db /ruta/base.sqlite`. Para un respaldo antiguo que carece de `sourceId`, agregá `--source identificador-estable-del-origen`. Conservá ese identificador en cada importación del mismo origen; no se inventa uno diferente en cada lote.

## Protección frente a pérdida y duplicación

La reimportación idéntica se reconoce por origen y digest. Al llegar un respaldo actualizado, se agregan los nuevos ensayos. Un ID de ensayo existente con datos diferentes, otro orden u otra calibración **rechaza el lote entero**, sin modificaciones parciales. Un trigger también impide UPDATE directo de ensayos archivados. Una corrección debe ser una nueva observación con nuevo ID y una nota que indique qué corrige; el respaldo original sigue disponible.

Los respaldos truncados no pueden reemplazar el resultado más reciente de una calibración. Renombrar un equipo o proceso no altera las mediciones; cambiar silenciosamente modelo, resina o fecha original de una calibración no se admite.

La biblioteca local muestra cada calibración finalizada por separado y permite usar sus parámetros como punto de partida de una nueva calibración. La nueva tiene **cero ensayos**, estado en progreso y un vínculo de procedencia. No se copian medidas ni se la declara aprobada.

## Calidad y próxima etapa comercial

Aprobar ±0,050 mm en X/Y, encastre y soportes es un resultado local. No demuestra reproducibilidad entre impresoras ni revisión independiente. La biblioteca muestra repeticiones aprobadas con los mismos parámetros y procedimiento, además de los datos de trazabilidad faltantes. No existen perfiles públicos inventados ni exposiciones iniciales atribuidas a fabricantes sin evidencia.

Para una plataforma compartida todavía hacen falta: API autenticada, almacenamiento persistente del servidor, autorización del propietario y administrador, interfaz de moderación, decisiones auditadas de archivo/eliminación, revisión de catálogo y vinculación de archivos de referencia a una versión/hash real. La receta registra los parámetros de calibración; no reemplaza un perfil completo del slicer con sus soportes, movimientos y ajustes de base.

La eliminación en la web actual afecta exclusivamente los datos locales y pide confirmación. El importador no borra automáticamente los registros centrales ni otros autores. La futura moderación debe mostrar registros divergentes y permitir que el administrador tome una decisión explícita, conservando la razón y la evidencia.

No se suben datos del usuario, bases SQLite ni respaldos al repositorio. `.data/` y archivos SQLite están ignorados. La copia de seguridad del archivo de base y su retención serán responsabilidad del servicio cuando se despliegue.
