# Plan de Migracion Visual a Angular Tailwind (Angular 21)

## 1. Objetivo
Migrar la capa visual de TiquiApp hacia el estilo y patrones del proyecto `lannodev/angular-tailwind`, manteniendo:
- Dominio y arquitectura hexagonal actuales.
- Tipado fuerte en TypeScript (strict).
- Estado con Signals + Signals Store.
- Flujos de negocio existentes (fichajes, reportes, incidencias, auth, timeout de sesion).

## 2. Alcance funcional que NO se pierde
- Login y flujo de autenticacion con mocks.
- Modal de expiracion de sesion y extension/cierre.
- Layout principal con sidebar/navbar responsive.
- Dashboard principal (home) y dashboard admin.
- Secciones: fichajes, calendario, reportes, incidencias.
- Integracion con mocks actuales (`src/assets/mocks`).

## 3. Principios de arquitectura (obligatorios)
- UI desacoplada del dominio: no meter logica de negocio en componentes visuales.
- Casos de uso y puertos se mantienen en `core/application` y `core/domain`.
- Infra/mock se mantiene en `core/mock` y `core/infraestructure`.
- Components presentacionales puros + containers/facades.
- Signals Store para estado de UI y estado de pagina.

## 4. Estrategia de migracion
Migracion incremental por vertical slices (pantalla por pantalla), no big-bang.

### Fase 0: Baseline tecnico
1. Crear rama: `feature/ui-migration-angular-tailwind`.
2. Congelar cambios de negocio durante la migracion visual.
3. Definir snapshots visuales actuales para comparar regresiones.
4. Verificar build/test actuales como baseline.

### Fase 1: Foundations de UI
1. Integrar Tailwind en Angular 21 (sin romper estilos actuales).
2. Definir `tokens` de diseno (colores, spacing, radios, tipografia) mapeados a tu marca.
3. Crear capa de componentes base reutilizables (button, input, card, badge, modal-shell, table-shell).
4. Definir convenciones:
   - Tailwind para layout/utilidades.
   - SCSS con BEM solo cuando haya complejidad del componente.
   - Evitar mezcla caotica de clases utilitarias + SCSS sin criterio.

### Fase 2: Layout global
1. Migrar `layout` + `navbar` + `sidebar` + `mobile menu` al template de referencia.
2. Conectar menu dinamico con roles actuales (`admin/manager/employee`).
3. Preservar guards y rutas actuales.
4. Validar responsive (desktop/tablet/mobile).

### Fase 3: Auth UX
1. Migrar pagina de login a nuevo estilo (ya iniciada).
2. Migrar forgot-password y pantallas auth relacionadas.
3. Mantener exactamente la logica actual de `AuthService` y mocks.
4. Reintegrar modal de timeout con nueva libreria visual (dialog shell propio).

### Fase 4: Dashboard y secciones
1. Dashboard empleado (`home`): cards, actividad, resumen, quick actions.
2. Dashboard admin/manager: metricas, tabla de incidencias, overtime, mapa/listados.
3. Fichajes: formulario, historico, resumen, validaciones de bloqueo.
4. Calendario: grid mensual, leyenda, panel detalle, estados por dia.
5. Reportes e incidencias: tablas, filtros, export y feedback.

### Fase 5: Signals Store por feature
1. Crear stores por feature (auth-ui, layout-ui, dashboard-ui, calendar-ui, fichajes-ui).
2. Mover estado de componentes grandes a store:
   - filtros,
   - seleccion de dia,
   - paneles,
   - estados de carga/error,
   - preferencias de vista.
3. Mantener acceso a casos de uso via facades/ports.

### Fase 6: Hardening y calidad
1. Pruebas unitarias de componentes clave.
2. E2E para rutas principales y flujo login/timeout.
3. Accesibilidad (focus, teclado, contraste, labels).
4. Performance (chunks lazy, carga diferida, evitar CSS muerto).
5. Checklist final de regresion funcional.

## 5. Mapa de migracion (pantallas actuales -> objetivo)
- `auth/login` -> template auth tipo angular-tailwind (hero + panel limpio + UX clara).
- `home/dashboard` -> cards y bloques visuales homogeneos.
- `admin-dashboard` -> panel de datos con tabla/lista y visualizacion moderna.
- `fichajes` -> shell de tabla + formulario + resumen en columnas responsive.
- `calendar` -> estilo de calendario moderno + estados claros + panel lateral/modal.
- `reportes` -> tabla filtrable con toolbar compacta.
- `incidencias` -> lista/tabla con estados y prioridades.

## 6. Gestion de estilos
- Variables globales centralizadas en `src/styles/abstracts/_variables.scss`.
- Import unificado para SCSS: `@import 'abstracts/variables';` (sin rutas profundas).
- Regla BEM para SCSS de componentes complejos:
  - bloque: `.calendar`
  - elementos: `.calendar__day`, `.calendar__legend`
  - modificadores: `.calendar__day--today`, `.calendar__day--vacation`
- Evitar selectores genericos sin scope.

## 7. Riesgos y mitigaciones
1. Riesgo: romper rutas/guards al cambiar layout.
   - Mitigacion: migrar layout primero en rama aislada + tests de navegacion.
2. Riesgo: deuda visual por mezcla de SCSS y Tailwind.
   - Mitigacion: guia de estilo y lint de clases utilitarias.
3. Riesgo: divergencia con arquitectura hexagonal.
   - Mitigacion: prohibir llamadas HTTP directas desde componentes.
4. Riesgo: regresiones funcionales en calendario/fichajes.
   - Mitigacion: casos E2E de negocio antes y despues.

## 8. Entregables por sprint
### Sprint A (Foundations + Layout)
- Tailwind integrado.
- Design tokens definidos.
- Layout migrado y estable.

### Sprint B (Auth + Timeout)
- Login/forgot renovados.
- Modal timeout integrado visualmente.

### Sprint C (Dashboard + Fichajes + Calendar)
- Pantallas core migradas.
- Stores de UI principales.

### Sprint D (Reportes + Incidencias + Hardening)
- Pantallas restantes.
- QA, accesibilidad, pruebas y cierre.

## 9. Criterios de aceptacion (DoD)
- `ng build` sin errores.
- Flujo login -> home -> timeout -> logout funcional.
- Todas las secciones operativas con mocks.
- UI consistente, responsive y accesible.
- Sin romper arquitectura hexagonal ni tipado fuerte.

## 10. Plan de ejecucion inmediato (siguiente accion)
1. Aprobar este plan.
2. Ejecutar Fase 1 (Tailwind + tokens + UI base).
3. Iniciar Fase 2 (layout global) y despues Fase 3 (auth completo).
