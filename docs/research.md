# Investigación y decisiones del método

Consulta realizada el 9 de octubre de 2026. Este documento separa evidencia consultada, decisiones del producto y reglas exploratorias. No se ejecutó el código de los repositorios de investigación ni la aplicación Django del ZIP.

## Fuentes primarias que sí se pudieron leer

1. **PrusaSlicer**, commit `30ef59195e0f3ee6f270b185bb5f9fb5f349f81f`, [ConfigDefsSLA.cpp](https://github.com/prusa3d/PrusaSlicer/blob/30ef59195e0f3ee6f270b185bb5f9fb5f349f81f/src/slic3r-domain/src/Slic3r/Domain/ConfigDefsSLA.cpp). Define correcciones relativas X/Y, corrección absoluta en milímetros, exposición normal e inicial como campos diferentes. Esto respalda separar porcentaje, desplazamiento geométrico y tiempo; no valida el significado de A/B en CHITUBOX.
2. Mismo commit, [SLAPrintSteps.cpp](https://github.com/prusa3d/PrusaSlicer/blob/30ef59195e0f3ee6f270b185bb5f9fb5f349f81f/src/libslic3r/src/libslic3r/SLAPrintSteps.cpp), función `apply_printer_corrections`. Aplica offset planar a polígonos y trata la compensación de pie de elefante en las primeras capas por separado. Un tamaño exterior incorrecto no debe atribuirse automáticamente a exposición ni confundirse con un ajuste de base.
3. **Firmware SLA de Prusa**, commit `410b115cd4d00f857bf6c3d2653be9c0489d7220`, [slafw/configs/project.py](https://gitlab.com/prusa3d/sl1/sla-fw/-/blob/410b115cd4d00f857bf6c3d2653be9c0489d7220/slafw/configs/project.py). Define `expTime`, `expTimeFirst`, `layerHeight`, `calibrateRegions`, `calibrateTime` y tiempos exactos de calibración. Confirma que exposición, altura de capa, primeras capas y experimentos con varios tiempos son condiciones diferentes de un proyecto real.
4. Mismo commit, [slafw/project/project.py](https://gitlab.com/prusa3d/sl1/sla-fw/-/blob/410b115cd4d00f857bf6c3d2653be9c0489d7220/slafw/project/project.py), lectura de configuración y tiempos de transición; [test_resin_calibration.py](https://gitlab.com/prusa3d/sl1/sla-fw/-/blob/410b115cd4d00f857bf6c3d2653be9c0489d7220/slafw/tests/unittests/test_resin_calibration.py) y [resin_calibration.py](https://gitlab.com/prusa3d/sl1/sla-fw/-/blob/410b115cd4d00f857bf6c3d2653be9c0489d7220/slafw/image/resin_calibration.py). Hay un mecanismo real de regiones de calibración y observación comparativa. No se copiaron sus tiempos predeterminados: corresponden a otras impresoras y configuraciones.

Estas fuentes son implementaciones de fabricantes/desarrolladores, no ensayos científicos de la pieza particular del usuario. No prueban que un determinado encastre permita calcular una exposición óptima para cualquier resina.

## Fuentes bloqueadas y lo que queda por verificar

Se intentó consultar AmeraLabs, el centro de ayuda de Phrozen y documentación de CHITUBOX. La política de red del entorno devolvió `403 / Domain not allowed`. No se presentan como documentación leída. Antes de convertir el método en una recomendación comercial validada, hace falta consultar la documentación de la versión concreta de CHITUBOX y comprobar A/B sobre geometría conocida y vista previa del slicer.

No se pudo verificar una exposición recomendada por fabricante para cada combinación del catálogo. El formulario inicial por eso no inventa un valor universal: pide el tiempo normal recomendado para el equipo y la capa. Los nombres del catálogo son referencias, no recetas certificadas.

## Qué se tomó del proyecto anterior

El archivo `Calibration_Hub_v0.2.2.4_round_recommendations.zip` aportado por el usuario se inspeccionó como referencia de diseño y lógica. Se retomaron:

- Separar exposición funcional y ajuste dimensional.
- Proponer un siguiente ensayo con un solo mecanismo modificado.
- Usar pasos editables, inicialmente 0,100 s para exposición y 0,025 mm para A exploratoria, con redondeo a tres decimales.
- Conservar exposición cuando ya dio buen encastre y soportes estables.
- Preparar parámetros del siguiente ensayo y guardar la receta final.
- Ampliar nombres de catálogos, conservando los registros y modelos personalizados pendientes.

No se adoptó su tolerancia de ±0,025 mm: se conserva **±0,050 mm**, establecida por el usuario para esta aplicación. Tampoco se añadieron medidas del pin ni del alojamiento: solo X/Y del bloque de 12 × 10 mm y un resultado de encastre del único pin.

## Reglas implementadas y sus límites

La aprobación de dimensiones es aritmética: se evalúan medidas sin redondear, con tolerancia inclusiva. Una escala calculada usa `nominal / medido × escala aplicada`; un desplazamiento exterior adicional por pared usa `(nominal − medido) / 2`.

En cambio, pasar de un encastre cualitativo a un cambio de exposición es **una hipótesis experimental**. Los pasos de 0,100 s y 0,025 mm son valores iniciales editables tomados del prototipo anterior, no una recomendación universal extraída de literatura. Los umbrales para priorizar escalado o B también son heurísticos; con una sola pieza no se demuestra causalmente si el error es proporcional, constante, del eje o del posprocesado.

Los soportes fallidos o parcialmente separados impiden pasar a corrección dimensional. Una reducción que rompe los soportes puede volver a la última exposición estable de ensayos compatibles. No se supone que todos los fallos se arreglen aumentando exposición: se indica revisar soportes y orientación.

Las comparaciones de exposición se restringen al mismo protocolo, altura de capa y procedimiento registrado. El momento de medición, lote, lavado y curado se preservan por ensayo. Valores desconocidos siguen siendo desconocidos. Un registro histórico de dos encastres no se convierte en uno de un pin ni se usa para afirmar que una receta actual fue verificada.

A numérica solo se propone si el usuario confirma en su slicer la convención indicada; proviene de un paso experimental, no de un diámetro inferido. B numérica también requiere esa confirmación y mantiene escalas y A. La aplicación muestra un mecanismo de cambio por ensayo y pide una impresión nueva para comprobarlo.

**Cumplir criterios locales no equivale a revisión independiente o reproducibilidad comercial.** La biblioteca conserva todas las recetas divergentes y muestra cuántas impresiones propias aprobaron con esos parámetros y procedimiento. La base separa observaciones originales, candidatos y eventos de revisión.
