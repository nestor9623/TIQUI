# Fase 0 - Backlog de Ejecucion Priorizado

## 1. Objetivo operativo
Convertir la especificacion de paridad en tareas implementables para Sprint A y B.

## 2. Backlog Sprint A (fundaciones)

### A1. Consolidar tokens globales
Descripcion:
- Extender tokens semanticos para cubrir 100% de shell y shared UI.

Aceptacion:
- Sidebar, navbar y ui-button/ui-card/ui-input sin colores hardcodeados.
- Build verde.

### A2. Sistema motion base
Descripcion:
- Crear variables de duracion/easing y utilidades de animacion.

Aceptacion:
- Dropdown, hover card y collapse sidebar usan mismos timings.

### A3. Table shell reusable
Descripcion:
- Componente shared para tabla con estados empty/loading/hover.

Aceptacion:
- Reportes e incidencias consumen el nuevo shell.

### A4. Dropdown reusable
Descripcion:
- Extraer dropdown del navbar a componente shared.

Aceptacion:
- Cierre por outside click, escape key y focus inicial.

### A5. Baseline visual tests
Descripcion:
- Agregar snapshots visuales por breakpoint para shell.

Aceptacion:
- Snapshots 1440/1280/1024/768/390 en CI local.

## 3. Backlog Sprint B (shell exacto)

### B1. Sidebar parity fina
Descripcion:
- Ajustar ancho, densidad, iconografias, padding y active styles.

Aceptacion:
- Checklist shell >= 95% visual parity.

### B2. Navbar parity fina
Descripcion:
- Ajustar alturas, tipografia, spacing y transiciones de menu.

Aceptacion:
- Paridad de estados hover/active/focus en controles.

### B3. Content shell parity
Descripcion:
- Ajustar fondos, gradientes, overlays y contenedor interno.

Aceptacion:
- Sin layout shift al colapsar sidebar o abrir overlays.

### B4. Dark mode total en shell
Descripcion:
- Validar contraste y consistencia en nav, cards y dropdowns.

Aceptacion:
- Cumple WCAG AA en textos y botones del shell.

### B5. QA de interaccion cross-device
Descripcion:
- Pruebas manuales desktop/tablet/mobile.

Aceptacion:
- Sin bloqueos de navegacion ni overlays colgados.

## 4. Backlog extendido (Sprint C en adelante)
- C1 Dashboard parity completa.
- C2 Reportes parity completa.
- C3 Fichajes parity completa.
- D1 Calendario parity completa.
- D2 Incidencias/Admin parity completa.
- E1 Auth parity + timeout modal.
- E2 Hardening accesibilidad + performance.

## 5. Riesgos y mitigacion en ejecucion
- Riesgo: deuda de estilos legacy en features.
  - Mitigacion: migracion por vertical slice con checklist.
- Riesgo: ruptura de UX por cambios globales.
  - Mitigacion: feature flags por seccion + snapshots.
- Riesgo: inconsistencias de tema.
  - Mitigacion: linter/regla interna para no hardcodear color.

## 6. Criterios de cierre de Fase 0
- Los 4 artefactos de Fase 0 existen y estan aprobados.
- Sprint A y B tienen tareas listas con criterios de aceptacion.
- Dependencias y riesgos estan identificados.
