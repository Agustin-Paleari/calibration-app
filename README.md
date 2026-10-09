# Calibration Hub

Aplicación local para registrar, comparar y analizar calibraciones de impresoras 3D de resina. React 19, TypeScript, Vite y Tailwind CSS 4. Sin login, servidores de datos ni servicios pagos.

## Ejecutar

Requiere Node.js 22 o superior y npm.

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

https://stackblitz.com/github/Agustin-Paleari/calibration-app/tree/main?startScript=dev

El archivo `.stackblitzrc` inicia `npm run dev`. Esperá a que se instalen las dependencias y aparezca la vista previa. Si StackBlitz solicita acceso al repositorio, conectá tu cuenta de GitHub desde su interfaz. Los datos se guardan en el navegador y origen de esa vista previa; no se transfieren automáticamente a una publicación futura.

## Flujo

1. Registrá tu equipo en **Impresoras** y el material en **Resinas**.
2. Creá una calibración para esa combinación de impresora y resina.
3. Introducí exposición normal, altura de capa, fecha, mediciones X/Y, resultado de ambos pines y soportes.
4. Registrá los valores realmente aplicados de escala X/Y y compensación A/B en CHITUBOX, junto con observaciones.
5. Guardá y analizá. Consultá desviaciones en mm, diferencias en %, criterios y sugerencias explicadas.
6. **Preparar próximo ensayo** conserva los parámetros y ajustes, propone la exposición del próximo paso y limpia mediciones, encastres, soportes y observaciones. El historial permanece intacto.
7. Compará gráficos y ensayos anteriores. **Finalizar calibración** se habilita solo cuando el último ensayo cumple todos los criterios. Podés reabrir una calibración para continuar.

## Arquitectura

- `src/domain/`: tipos, referencia centralizada, análisis, validación y reglas de recomendación. Funciones independientes de React, con pruebas.
- `src/data/`: catálogo inicial y contrato `Repository` con implementación `localStorage` versionada. Una futura implementación remota puede reemplazar ese adaptador; identidad y permisos se incorporarán en esa capa.
- `src/components/`: componentes compartidos, catálogo, formularios, gráficos y detalle de calibración.
- `src/App.tsx`: navegación local, coordinación de datos, dashboard y respaldo/restauración.
- `src/styles.css`: Tailwind, identidad visual, diseño responsive y estados de interacción. Tipografías empaquetadas localmente, sin solicitudes a Google Fonts.
- `tests/`: pruebas Playwright de los flujos reales.

## Reglas de análisis

La referencia está centralizada en `src/domain/calibration.ts`:

- X nominal: 12 mm; Y nominal: 10 mm.
- Pines: 7 y 5 mm; alojamientos: 7,10 y 5,10 mm.
- Tolerancia inclusiva: ±0,050 mm. No se evalúan números previamente redondeados.
- Finalización: X e Y en tolerancia, ambos pines correctos y soportes estables.
- Desviación: medido − nominal (mm).
- Diferencia relativa: desviación ÷ nominal × 100 (%).
- Escala total sugerida: nominal ÷ medido × escala aplicada (%).
- Corrección externa geométrica adicional por pared: (nominal − medido) ÷ 2.
- Corrección interna: requiere medir el alojamiento; el encastre cualitativo no permite inferir A.

Las sugerencias de exposición de ±5 % son hipótesis para ensayos, no reglas científicas validadas. Los soportes fallidos impiden sugerir otra reducción; ante señales opuestas entre pines se conserva exposición para repetir. Si los pines y soportes están bien, se conserva exposición para trabajar dimensiones. No combinar escala y compensaciones en un mismo ensayo.

Los cálculos de A/B expresan desplazamientos geométricos adicionales por pared. **No garantizan el signo ni el valor final de un parámetro para todas las versiones de CHITUBOX**. Revisar documentación y vista previa del slicer, y verificar el ajuste en una nueva impresión.

## Datos y limitaciones de la primera versión

Los registros persisten en `localStorage` del navegador/origen actual. No se sincronizan entre equipos ni navegadores. Borrar datos del sitio elimina los registros; utilizá **Exportar respaldo** regularmente. La restauración valida estructura, referencias, mediciones y criterios de finalización, y requiere confirmar antes de reemplazar los datos actuales. Si los datos locales están dañados, la aplicación permite descargar una copia y restaurar un respaldo válido sin sobrescribir el original automáticamente.

El catálogo incluye Phrozen, Anycubic, Elegoo y Creality. PioCreat / Aidis comparten una familia, con incorporación de modelos personalizados sin inventar modelos iniciales. Todo modelo agregado permanece **pendiente de validación administrativa**; no existe una aprobación simulada.

No se incluye autenticación, base de datos remota, administración de aprobaciones, integración automática con CHITUBOX ni temperatura de resina. Los borradores de formularios no se guardan hasta **Guardar y analizar**. Esas capacidades pueden agregarse posteriormente; no se necesitan para el flujo local actual.
