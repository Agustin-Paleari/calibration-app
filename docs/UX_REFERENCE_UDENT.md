# Calibration Hub — UX handoff para Codex
## Referencia: µDENT Beta 1

> Objetivo: usar µDENT como referencia de flujo/UX, NO copiar su código ni replicar visualmente la marca.
> Mantener la arquitectura y lógica de Calibration Hub; rediseñar la experiencia para que sea más guiada,
> visual y simple.

---

## 1. Qué vimos en µDENT

La referencia organiza la experiencia en un flujo muy simple:

1. **Paso 1 · Medición**
   - encabezado claro;
   - visor 3D;
   - botones `Troquel`, `Pin`, `Restablecer`;
   - medidas nominales siempre visibles;
   - inputs de medición;
   - botón principal para calcular.

2. **Paso 2 · Resultado**
   - compensaciones calculadas visibles inmediatamente.

3. **Paso 3 · Registro**
   - selección de máquina;
   - selección de resina;
   - resultado funcional Pin–Troquel;
   - notas;
   - guardar calibración.

4. **Historial**
   - filtros por máquina y resina;
   - exportación CSV.

5. **Guía**
   - procedimiento explicado en pasos cortos;
   - descarga de archivos STL;
   - instrucciones de impresión, postprocesado, medición y registro.

6. **Configuración**
   - gestión de máquinas y resinas.

### Ajuste funcional Pin–Troquel observado
La referencia usa cinco estados:

- Muy flojo
- Flojo
- Correcto
- Ajustado
- No ingresa

Esta granularidad es mejor que un booleano.

---

# 2. Qué NO debemos copiar

No copiar:
- nombre/branding µDENT;
- textos literales largos;
- CSS, assets, STL o código de la referencia;
- layout pixel-perfect.

Sí usar como inspiración:
- jerarquía;
- flujo paso a paso;
- poca carga cognitiva;
- visor + medición juntos;
- resultado inmediato;
- guía integrada;
- ajuste funcional granular.

---

# 3. Producto que estamos construyendo

Calibration Hub es distinto porque tiene:

- base central;
- catálogo aprobado de impresoras;
- catálogo aprobado de resinas;
- sugerencias de catálogo pendientes de revisión;
- administración/fusión de aliases;
- resultados públicos;
- algoritmo específico para CHITUBOX;
- acumulación futura de evidencia experimental.

La UX nueva debe ocultar complejidad sin eliminar estas capacidades.

---

# 4. Pantallas principales v0.3

## 4.1 Home

Objetivo:
- dos acciones principales;
- evitar un dashboard técnico como primera pantalla.

Hero:

```text
Calibration Hub

Calibrá tu combinación de impresora y resina
y construí una base de parámetros confiables.

[ NUEVA CALIBRACIÓN ]  [ CONSULTAR PARÁMETROS ]
```

Luego:

```text
Buscar parámetros

Marca impresora [ Phrozen ▼ ]
Modelo          [ Sonic Mini 8K S ▼ ]
Marca resina    [ Phrozen ▼ ]
Resina          [ Aqua 8K ▼ ]

[ VER RESULTADOS ]
```

Después:
- calibraciones públicas recientes;
- combinaciones con más evidencia;
- acceso a Guía.

---

## 4.2 Nueva calibración / Preparación

Selector encadenado ya existente:

```text
IMPRESORA

Marca
[ Phrozen ▼ ]

Modelo
[ Sonic Mini 8K S ▼ ]

¿No está tu impresora?
[ Agregar otra ]
```

Resina:

```text
RESINA

Marca
[ Phrozen ▼ ]

Resina
[ Aqua 8K Resin ▼ ]

¿No está tu resina?
[ Agregar otra ]
```

Si el usuario agrega una entrada manual:
- crear `PENDING`;
- permitir calibrar;
- NO publicar resultado;
- conservar texto original;
- permitir posterior corrección/fusión admin.

Mostrar además:
- altura de capa;
- calibrado por;
- paso de exposición.

El paso de A NO debe mostrarse como configurable.
Internamente queda fijo en 0.025 mm.

CTA:

`COMENZAR CALIBRACIÓN`

---

# 5. Flujo de calibración

Usar una barra/progreso persistente:

```text
1 PREPARAR   2 MEDIR   3 RESULTADO   4 REPETIR / FINALIZAR
```

No mostrar nombres internos como "state machine" o códigos de recomendación.

La app internamente sigue sabiendo si está en:
- fase de exposición;
- fase dimensional;
- calibrada;
- finalizada.

---

# 6. Pantalla MEDIR

Desktop:

```text
┌──────────────────────────────┬──────────────────────────────┐
│                              │                              │
│          VISOR 3D            │   MEDICIONES                 │
│                              │                              │
│  rotar / zoom                │   X nominal 12.000 mm        │
│                              │   X medido [             ]   │
│ [MODELO] [PIN] [RESET]       │                              │
│                              │   Y nominal 10.000 mm        │
│                              │   Y medido [             ]   │
│                              │                              │
└──────────────────────────────┴──────────────────────────────┘
```

Mobile:
- visor primero;
- mediciones debajo;
- CTA fijo abajo si es útil.

## Visor
Inicialmente puede implementarse:
1. placeholder visual propio;
2. después Three.js / `<model-viewer>` si tenemos STL/GLB.

No bloquear v0.3 por no tener todavía el modelo 3D definitivo.

Debe poder mostrar:
- pieza;
- pin;
- reset cámara.

Ideal futuro:
- marcadores X/Y;
- animación visual de cómo medir.

---

# 7. Inputs numéricos

Reglas actuales que deben conservarse:

- aceptar valores grandes;
- hasta 3 decimales operativos;
- cálculos internos pueden tener más precisión;
- toda recomendación se redondea `ROUND_HALF_UP` a 3 decimales;
- aceptar punto o coma si es posible;
- no generar valores precargados con más de 3 decimales.

Nominales actuales:

- X = 12.000 mm
- Y = 10.000 mm

Tolerancia fija:
- ±0.025 mm
- ±25 µm

---

# 8. Ajuste del pin

Cambiar de los 3 estados actuales a 5 estados UX:

1. Muy flojo
2. Flojo
3. Correcto
4. Ajustado
5. No ingresa

Visualmente usar botones grandes/radio cards, no un `<select>`.

Ejemplo:

```text
AJUSTE DEL PIN

[ Muy flojo ] [ Flojo ] [ Correcto ] [ Ajustado ] [ No ingresa ]
```

### Mapeo lógico — FASE DE EXPOSICIÓN

Con soportes correctos:

- **Muy flojo**
  - subir exposición;
  - sugerir un cambio mayor que para "Flojo" si decidimos parametrizarlo.

- **Flojo**
  - subir exposición un paso.

- **Correcto**
  - bloquear exposición;
  - pasar a fase dimensional.

- **Ajustado**
  - bajar exposición un paso.

- **No ingresa**
  - bajar exposición un paso.

Regla importante:
mientras buscamos exposición NO modificar escala, A ni B.

### Mapeo lógico — FASE DIMENSIONAL

La exposición ya está bloqueada.

- Muy flojo → aumentar A para achicar interior; considerar 2 pasos.
- Flojo → aumentar A un paso.
- Correcto → evaluar X/Y.
- Ajustado → disminuir A un paso.
- No ingresa → disminuir A; considerar mayor corrección si se desea.

Convención CHITUBOX:
- A mayor → interior menor.
- A menor → interior mayor.

Paso interno recomendado de A:
- 0.025 mm.

Antes de implementar "2 pasos" para extremos, mantenerlo configurable en código
o usar inicialmente 0.025 para todos y dejar TODO explícito.

---

# 9. Soportes

Mantener 3 estados:

- Correctos
- Separación parcial
- Pieza caída / separada

UI como radio cards.

Un ensayo dimensional con soportes fallidos:
- no usarlo para calcular escala/A/B;
- recomendar repetir estable.

---

# 10. Resultado como modal

Después de `ANALIZAR RESULTADO`, mostrar modal grande.

Ejemplo:

```text
RESULTADO

Escala Y fuera de tolerancia

Medido             10.500 mm
Nominal             10.000 mm
Error               +0.500 mm
Error relativo      +5.00 %

Escala actual       100.000 %
Escala calculada     95.238 %

Cambiar solamente Scale Y.

[ PREPARAR PRÓXIMO ENSAYO ]
[ CERRAR ]
```

Regla:
`scale_new = scale_current × nominal / measured`

NO limitar arbitrariamente a ±1 punto porcentual.

Mostrar:
- nominal;
- medido;
- error mm;
- error µm;
- error %;
- valor actual;
- valor recomendado;
- qué variables mantener sin cambios.

---

# 11. Popup de datos extremos

Antes de guardar valores inusuales:

```text
REVISAR MEDICIÓN

X: 211.000 mm vs 12.000 mm
+199.000 mm / +1658.3 %

Y: 16.000 mm vs 10.000 mm
+6.000 mm / +60.0 %

El ensayo todavía no fue guardado.

[ GUARDAR IGUAL ]
[ CORREGIR DATOS ]
```

No perder lo ingresado al cerrar/corregir.

---

# 12. Preparar próximo ensayo

Al tocar:

`PREPARAR PRÓXIMO ENSAYO`

debe:
- precargar SOLO parámetros recomendados;
- conservar los parámetros que no cambian;
- borrar resultados:
  - X;
  - Y;
  - pin;
  - soportes;
  - notas;
- permanecer en la pantalla de nuevo ensayo;
- jamás volver a Home/Dashboard.

---

# 13. Resultado calibrado

Condición actual:

- soportes correctos;
- pin funcional `Correcto`;
- |error X| <= 0.025 mm;
- |error Y| <= 0.025 mm.

Mostrar:

```text
✓ CALIBRACIÓN LOGRADA

Exposure    2.450 s
Scale X     99.850 %
Scale Y    100.100 %
A           -0.075 mm
B           -0.025 mm

X error     +12 µm
Y error     -8 µm

[ FINALIZAR ]
```

Finalizar:
- congela la receta;
- mantiene historial.

---

# 14. Base pública

Una calibración `CALIBRATED` o `FINALIZED` puede ser visible públicamente SOLO si:

- impresora `APPROVED`;
- resina `APPROVED`.

Si alguno está pendiente:
- calibración se conserva;
- mostrar banner privado/operativo;
- NO aparecer en base pública.

Public result card:

```text
Phrozen Sonic Mini 8K S
Splint Tough
0.05 mm

Exposure   2.450 s
SX         99.850 %
SY         100.100 %
A         -0.075
B         -0.025

Calibrado por Agustín
```

---

# 15. Catálogo y moderación

Estados:

- APPROVED
- PENDING
- REJECTED / MERGED

Una sugerencia manual debe conservar:
- texto original del usuario;
- texto canónico editable;
- canonical target opcional.

Ejemplo:

```text
Usuario escribió:
Mika / Pro 10

Admin corrige:
Mica / Pro 10
```

Si ya existe:

```text
Mika Pro10
→ canonical:
Mica Pro 10
→ MERGE
```

Al fusionar:
- reasignar calibraciones;
- reasignar perfiles;
- desactivar alias incorrecto;
- conservar submitted_* para auditoría.

---

# 16. Aliases OEM

Preparar el modelo de catálogo para OEM/alias.

Caso prioritario:
- PioCreat
- Aidis (Argentina)

Una misma máquina física puede necesitar:

```text
Fabricante canónico: PioCreat
Marca comercial: Aidis
Mercado: Argentina
```

No implementar esto como duplicados independientes sin relación.

Diseñar en próxima fase:
- Manufacturer / canonical product
- Brand / marketed alias
- market/region opcional

---

# 17. Guía integrada

Agregar sección `/guia/`.

Contenido visual en 7 pasos:

1. Descargar patrón.
2. Imprimir sin escalar.
3. Lavar/secar/curar.
4. Medir X/Y.
5. Probar pin.
6. Registrar soportes.
7. Seguir recomendación.

Luego podremos agregar descarga de nuestros propios STL.

---

# 18. Navegación propuesta

Header:

```text
Calibration Hub
[ Calibrar ] [ Parámetros ] [ Guía ]
```

Evitar navegación técnica.

En mobile podría existir nav inferior:

```text
Calibrar | Historial | Guía | Parámetros
```

si mejora la UX.

---

# 19. Estilo visual

Dirección:
- limpio;
- clínico/técnico;
- mucho aire;
- cards grandes;
- superficies blancas;
- fondo gris muy claro;
- acento azul/índigo;
- verdes solo para estados exitosos;
- warning ámbar;
- tipografía system/Inter;
- bordes suaves;
- responsive.

No copiar el diseño exacto de µDENT.

Prioridad:
1. claridad;
2. jerarquía;
3. velocidad;
4. usable en tablet/teléfono en laboratorio/taller.

---

# 20. Arquitectura que NO debe romperse

Stack:
- Django
- PostgreSQL-ready
- SQLite local
- Django Admin
- sin login para usuario común
- UUID por calibración

Mantener:
- migraciones existentes;
- catálogo aprobado/pendiente;
- admin merge;
- base pública;
- algoritmo CHITUBOX;
- exact scale formula;
- q3 redondeo;
- popup confirmaciones.

No reescribir backend desde cero si no es necesario.

---

# 21. Orden de implementación sugerido

## Fase A — UX shell
- Home nueva.
- Header.
- Guía.
- Progress stepper.
- CSS responsive.

## Fase B — calibración
- Measurement workspace.
- Pin 5 estados.
- Soportes cards.
- Modal resultado.
- Preparar siguiente.

## Fase C — catálogo
- Mantener marca→modelo.
- Mantener marca→resina.
- mejorar PENDING.
- aliases OEM posteriormente.

## Fase D — visor
- placeholder primero;
- GLB/Three.js después.

---

# 22. Acceptance criteria v0.3

La v0.3 está lista para probar cuando:

- [ ] Home ya no parece un dashboard técnico.
- [ ] Nueva calibración usa marca→modelo / marca→resina.
- [ ] Se puede agregar equipo/resina no listada como PENDING.
- [ ] Flujo muestra progreso por pasos.
- [ ] La medición X/Y es la pantalla protagonista.
- [ ] Pin tiene 5 estados.
- [ ] Soportes tienen 3 estados.
- [ ] Analizar abre modal de resultado.
- [ ] Error dimensional muestra mm, µm, % y corrección.
- [ ] Escala usa fórmula exacta.
- [ ] Recomendaciones se redondean a 3 decimales.
- [ ] Preparar siguiente no cambia de pantalla.
- [ ] Resultados anteriores quedan en historial.
- [ ] Calibrated/Finalized con catálogo aprobado aparece públicamente.
- [ ] Catálogo PENDING no se publica.
- [ ] Admin puede corregir/fusionar catálogo.
- [ ] App funciona desktop + mobile.
- [ ] Base SQLite existente migra sin perder datos.

---

# 23. Nota para Codex

Antes de modificar código:

1. leer este documento;
2. inspeccionar modelos, forms, services, views, templates, migrations y CSS actuales;
3. no asumir que la UX actual representa la lógica final;
4. mantener compatibilidad de DB;
5. hacer cambios por commits pequeños;
6. ejecutar migrations/tests/check;
7. no borrar funciones existentes sin justificar;
8. reportar cualquier contradicción entre esta especificación y el código actual.

La prioridad es UX sin regresiones de lógica.
