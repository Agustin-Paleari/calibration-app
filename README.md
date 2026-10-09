# Calibration Hub

Aplicación local para registrar, comparar y analizar calibraciones de impresoras 3D de resina. React 19, TypeScript, Vite y Tailwind CSS 4. Sin login ni servicios pagos. La web guarda datos locales; el repositorio también incluye una base relacional SQLite y herramientas para reunir respaldos sin sobrescribir calibraciones de otros orígenes.

## Ejecutar

Requiere Node.js 22.13 o superior y npm; se recomienda Node.js 24 LTS.

```sh
npm ci
npm run dev
```

Vite escucha en el puerto 5173. Abrí la dirección que informa el comando en tu navegador local.

```sh
npm run build    # TypeScript y compilación de producción
npm run preview  # Servir la compilación
npm test         # Pruebas unitarias de cálculos y almacenamiento
```

Para pruebas de navegador:

```sh
npx playwright install chromium
npm run test:e2e
```

En este entorno cloud Chromium ya está instalado; no necesita descarga:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
```

## Vista previa en el navegador

Abrí el proyecto en StackBlitz:

https://stackblitz.com/fork/github/Agustin-Paleari/calibration-app?startScript=dev

El archivo `.stackblitzrc` inicia `npm run dev`. Esperá a que se instalen las dependencias y aparezca la vista previa. Si StackBlitz solicita acceso al repositorio, conectá tu cuenta de GitHub desde su interfaz. Un fork ya abierto no se actualiza automáticamente con cambios de GitHub: exportá tus datos y abrí una importación nueva para ver la última versión. Los datos se guardan en el navegador y origen de esa vista previa; no se transfieren automáticamente a una publicación futura.

## Versión autónoma descargable

`docs/Calibration-Hub.html` incluye la aplicación, estilos, íconos y tipografías en un archivo. Descargalo desde GitHub con **Download raw file** y abrilo en un navegador de escritorio. No requiere npm ni un despliegue. Las políticas de algunos navegadores administrados pueden impedir abrir archivos locales; en ese caso utilizá la vista previa de StackBlitz.

Se genera con `npm run build:standalone`. La prueba `tests/standalone.spec.ts` verifica el flujo de registro, análisis, finalización y recarga con el HTML autónomo y sin descargar recursos externos. En este entorno la política de Chromium bloquea `file://`; la prueba entrega el mismo archivo mediante una ruta interceptada del navegador, por lo que la apertura local del archivo no fue verificada aquí.

## Flujo

1. Pulsá **Nueva calibración**. En el mismo formulario, elegí una impresora y una resina guardadas, o agregalas con desplegables. No hace falta visitar los catálogos.
2. Marca y modelo identifican el equipo; fabricante, resina y color identifican el material. Los nombres personalizados de equipo y calibración son opcionales. Los nombres de resinas ofrecidos son referencias de catálogo, no perfiles de exposición certificados.
3. Al comenzar, se guardan equipo, material y calibración juntos y se abre directamente el primer ensayo. Cancelar el formulario no crea registros parciales.
4. Introducí exposición normal y altura de capa. Para el primer ensayo usá el valor recomendado por el fabricante para tu modelo y capa; no hay una exposición universal inventada. Después, medí X/Y del bloque y seleccioná un único resultado de encastre del pin (correcto, ajustado o suelto), junto con el estado de los soportes. No se pide medir el pin ni el hueco.
5. Fecha, observaciones y ajustes realmente aplicados en CHITUBOX están en secciones desplegables. Guardá y analizá para ver precisión y el próximo paso sugerido.
6. **Preparar próximo ensayo** conserva parámetros y ajustes, prepara los parámetros del mecanismo propuesto para el próximo paso y limpia mediciones, encastre, soportes y observaciones. El historial permanece intacto.
7. Compará ensayos anteriores. **Finalizar calibración** se habilita solo cuando el último ensayo cumple todos los criterios. Podés reabrir una calibración para continuar.
8. Las calibraciones finalizadas aparecen en **Recetas guardadas**. Filtrá por impresora, resina y capa, consultá trazabilidad y repeticiones, y usá una receta como punto de partida sin copiar resultados. Dos calibraciones con distintas exposiciones para la misma combinación aparecen por separado.

La navegación principal tiene **Vista general**, **Calibraciones** y **Recetas guardadas**. Impresoras y resinas siguen disponibles en el desplegable **Catálogo**, pero no son pasos obligatorios del flujo. Los registros antiguos que contienen dos resultados de encastre se conservan e identifican como registros anteriores; los ensayos nuevos registran un único encastre. Los respaldos existentes siguen siendo compatibles.

## Interfaz guiada (v1.2)

El inicio destaca **Continuar calibración** cuando existe un proceso pendiente. En una instalación nueva muestra una única acción principal y tres pasos, sin estadísticas vacías. El formulario reúne datos de impresión y mediciones en dos bloques, con contador de datos completos, ejemplos de formato y un esquema de X/Y. Los ajustes opcionales se conservan en desplegables.

Al guardar, el foco y la vista pasan al resultado. La sugerencia y sus acciones aparecen primero: **Preparar próximo ensayo** si falta aprobar algún criterio, o **Finalizar calibración** y **Repetir para comprobar** cuando está aprobado. Los criterios pendientes se indican explícitamente. Al consultar un ensayo histórico aparece un aviso y **Volver al último ensayo**; las acciones del próximo ensayo se ofrecen en el último resultado.

En móvil, los controles de entrada tienen más espacio y X/Y se muestran juntos. Los estados visibles se expresan en español; la biblioteca permite iniciar una calibración desde su estado vacío y limpiar filtros cuando no hay coincidencias. La interfaz no cambia la identidad de las calibraciones ni fusiona resultados.

## Arquitectura

- `src/domain/`: tipos, referencia centralizada, análisis, validación y reglas de recomendación. Funciones independientes de React, con pruebas.
- `src/data/`: catálogo inicial y contrato `Repository` con implementación `localStorage` versionada. Una futura implementación remota puede reemplazar ese adaptador; identidad y permisos se incorporarán en esa capa.
- `src/components/`: componentes compartidos, catálogo, formulario unificado de inicio, campos reutilizables de equipo/material, gráficos y detalle de calibración.
- `src/App.tsx`: navegación local, coordinación de datos, dashboard y respaldo/restauración.
- `src/styles.css`: Tailwind, identidad visual, diseño responsive y estados de interacción. Tipografías empaquetadas localmente, sin solicitudes a Google Fonts.
- `database/001_initial.sql`: esquema relacional SQLite con catálogo, orígenes, equipos físicos, protocolos, calibraciones, ensayos inmutables, candidatos y eventos de revisión.
- `scripts/database.ts`, `data-import.ts`, `data-profiles.ts`: archivo transaccional de respaldos y consulta de cada perfil por separado.
- `tests/`: pruebas Playwright de los flujos reales y pruebas de integración contra SQLite.

## Reglas de análisis

La referencia está centralizada en `src/domain/calibration.ts`:

- X nominal: 12 mm; Y nominal: 10 mm.
- La pieza es un bloque de 12 × 10 mm con un único alojamiento central y un pin separado. Solo se mide el bloque en X e Y; el pin se evalúa cualitativamente por su encastre.
- Tolerancia inclusiva: ±0,050 mm. No se evalúan números previamente redondeados.
- Finalización: X e Y en tolerancia, encastre del pin correcto y soportes estables.
- Desviación: medido − nominal (mm).
- Diferencia relativa: desviación ÷ nominal × 100 (%).
- Escala total sugerida: nominal ÷ medido × escala aplicada (%).
- Corrección externa geométrica adicional por pared: (nominal − medido) ÷ 2.
- A modifica el contorno interno. El encastre cualitativo no permite calcular un valor numérico de A; esta versión explica el ajuste sin exigir medidas del pin o del hueco. La función geométrica genérica de corrección interna queda separada para futuras extensiones.

Las sugerencias de exposición usan un paso editable, inicialmente **0,100 s**, y son hipótesis para ensayos, no reglas científicas validadas. Los soportes fallidos impiden sugerir otra reducción; si el encastre y los soportes están bien, se conserva exposición para trabajar dimensiones. No combinar escala y compensaciones en un mismo ensayo.

Los cálculos de A/B expresan desplazamientos geométricos adicionales por pared. **No garantizan el signo ni el valor final de un parámetro para todas las versiones de CHITUBOX**. Revisar documentación y vista previa del slicer, y verificar el ajuste en una nueva impresión.

## Datos y limitaciones de la versión actual

Los registros persisten en `localStorage` del navegador/origen actual. No se sincronizan entre equipos ni navegadores. Borrar datos del sitio elimina los registros; utilizá **Exportar respaldo** regularmente. La restauración valida estructura, referencias, mediciones y criterios de finalización, y requiere confirmar antes de reemplazar los datos actuales. Si los datos locales están dañados, la aplicación permite descargar una copia y restaurar un respaldo válido sin sobrescribir el original automáticamente.

El catálogo incluye Phrozen, Anycubic, Elegoo, Creality y nombres del proyecto anterior. PioCreat / Aidis comparten una familia; PioNext se conserva como marca separada. Todo modelo agregado permanece **pendiente de validación administrativa**; no existe una aprobación simulada.

No se incluye autenticación, base de datos remota, administración de aprobaciones, integración automática con CHITUBOX ni temperatura de resina. Los borradores de formularios no se guardan hasta **Guardar y analizar**. Esas capacidades pueden agregarse posteriormente; no se necesitan para el flujo local actual.

## Base relacional y conservación de resultados

La combinación modelo + resina + color + capa es un filtro; **no es una clave única de calibración**. Si dos orígenes aportan 2,400 s y 2,800 s, SQLite guarda y devuelve ambos candidatos, cada uno con su origen e historial. Reimportar el mismo respaldo no duplica ensayos. Alterar un ensayo archivado rechaza el lote entero; no se pierden observaciones anteriores. Nada se borra por discrepar de otra calibración.

El frontend sigue usando almacenamiento local. La API multiusuario, autenticación y moderación central todavía no están conectadas. La SQLite incluida puede reunir los respaldos ahora, y es una base concreta para esa etapa; no implica que los datos ya estén sincronizados en internet.

[Arquitectura y comandos de importación/consulta](docs/data-architecture.md). [Fuentes consultadas, comparación con el proyecto anterior y límites de las recomendaciones](docs/research.md).
