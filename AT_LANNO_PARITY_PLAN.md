# Plan Maestro Por Fases: Paridad Total Con Angular Tailwind (at.lanno.dev)

## 1. Objetivo
Lograr paridad visual y de comportamiento con el dashboard de referencia, incluyendo layout, componentes, transiciones, estados de interacción, dark mode y variantes responsivas.

Este plan mantiene:
- Arquitectura hexagonal actual.
- Clean code y tipado estricto.
- Separación UI vs dominio.
- Idea de negocio de fichajes y secciones actuales.

## 2. Restricciones y criterio legal
- Se replica experiencia y patrones de UI con implementación propia.
- No se copia código propietario ni assets sin licencia explícita.
- Si se usan recursos del repositorio de referencia, validar licencia antes de incorporar archivos directos.

## 3. Definición de éxito (Definition of Done)
- Paridad visual mayor o igual al 95% en desktop y mobile para shell y pantallas objetivo.
- Paridad de interacción mayor o igual al 95% (hover, focus, active, dropdowns, colapsados, overlays, transiciones).
- Lighthouse en rango aceptable y accesibilidad WCAG AA en componentes críticos.
- Sin romper flujo de autenticación, roles, timeout de sesión y navegación existente.
- Build y test verdes en cada fase.

## 4. Estrategia de ejecución
Se trabaja por capas, no por páginas sueltas:
1. Fundaciones de diseño y motion.
2. Shell global.
3. Librería de componentes equivalentes.
4. Migración de cada sección funcional (fichajes, reportes, calendario, incidencias, dashboard).
5. Hardening final.

## 5. Fases detalladas

### Fase 0. Descubrimiento y baseline
Objetivo: congelar referencia y convertirla en especificación implementable.

Entregables:
- Inventario de componentes de referencia.
- Matriz de comportamiento por componente.
- Inventario de tokens (color, spacing, radius, sombras, tipografía, elevación, opacidades).
- Inventario de motion (duraciones, easing, delays, stagger).
- Checklist de estados: default, hover, active, focus, disabled, loading, empty.

Acciones:
- Capturas por breakpoint: 1440, 1280, 1024, 768, 390.
- Medición de espaciados y tipografías.
- Mapear navegación lateral y jerarquía de menús.

Salida:
- Documento de especificación visual y de interacción.

### Fase 1. Design System de paridad
Objetivo: habilitar un sistema que permita reproducir exactamente el look and feel.

Entregables:
- Tokens semánticos de color para light y dark.
- Escala de tipografía y espaciado alineada a referencia.
- Sistema de elevaciones y blur.
- Curvas de animación y tiempos globales.

Acciones:
- Consolidar variables en estilos globales.
- Añadir clases utilitarias de motion y estados.
- Añadir contratos de tema persistente (paleta, dark mode, preferencias UI).

Salida:
- Base visual estable para todas las páginas.

### Fase 2. Shell global exacto
Objetivo: reproducir layout principal de referencia al detalle.

Incluye:
- Sidebar (ancho, colapsado, jerarquía, secciones plegables, badges, estado activo).
- Navbar (brand, acciones, avatar, menú de usuario, overlays).
- Fondo, gradientes, capas, overlays, scrollbars y comportamiento responsive.

Entregables:
- Shell en paridad visual e interacción.
- Persistencia de estados UI (colapsado, tema, menú, configuración).

### Fase 3. Librería de componentes equivalentes
Objetivo: crear componentes base que reproduzcan el set de la referencia.

Componentes mínimos:
- Button, IconButton, Card, StatCard, Tag/Badge.
- Input, Select, Search, Toggle, Tabs, Dropdown.
- Table shell, List item, Chart card shell, Empty state, Skeleton.
- Modal, Drawer, Toast.

Reglas:
- Componentes presentacionales puros.
- Sin lógica de negocio en la capa visual.
- API tipada y consistente.

### Fase 4. Migración funcional por sección
Objetivo: llevar cada módulo al nuevo look sin romper dominio.

Orden recomendado:
1. Dashboard principal.
2. Reportes.
3. Fichajes.
4. Calendario.
5. Incidencias.
6. Admin dashboard.

Por cada sección:
- Reemplazo de layout local y componentes visuales.
- Adaptación de colores, estados y transiciones a tokens.
- Mantener casos de uso, puertos y servicios intactos.

### Fase 5. Auth y flujos transversales
Objetivo: paridad de login y pantallas auth, manteniendo tu lógica actual.

Incluye:
- Login, forgot password, estados de error/carga.
- Timeout modal con estilo y motion homogénea.
- Roles y redirecciones sin regresiones.

### Fase 6. Motion y microinteracciones
Objetivo: igualar sensación de calidad visual de referencia.

Incluye:
- Entrada de tarjetas con stagger.
- Hover con profundidad y cambio de borde.
- Dropdowns y overlays con animación coherente.
- Respeto de preferencias de reducción de movimiento.

### Fase 7. Hardening y QA final
Objetivo: cerrar con calidad de producción.

Incluye:
- Accesibilidad (focus visible, contraste, navegación teclado).
- Rendimiento (lazy, tamaño de bundle, imágenes, CSS).
- Tests de regresión visual y funcional.
- Checklist de paridad final por pantalla.

## 6. Mapa de trabajo técnico sin romper hexagonal

### Capa UI
- Solo consume facades y stores de UI.
- No accede directo a infraestructura.

### Capa aplicación y dominio
- Se mantiene estable.
- Ajustes solo si una interacción nueva lo requiere.

### Stores
- Layout UI store para shell.
- Theme store para tema y preferencias.
- Stores de pantalla para filtros y estado local.

## 7. Plan operativo por sprints

### Sprint A (1 semana)
- Fase 0 y Fase 1 completas.
- Resultado: sistema de diseño y motion listo.

### Sprint B (1 semana)
- Fase 2 completa.
- Resultado: shell exacto y estable.

### Sprint C (1 semana)
- Fase 3 completa + inicio Fase 4 con dashboard y reportes.

### Sprint D (1 semana)
- Fase 4 restante (fichajes, calendario, incidencias, admin dashboard).

### Sprint E (1 semana)
- Fase 5, 6 y 7.
- Resultado: cierre de paridad y producción.

## 8. Riesgos y mitigación
- Riesgo: deriva visual al mezclar estilos legacy y nuevos.
  - Mitigación: bandera por sección y reemplazo completo por vertical slice.
- Riesgo: deuda de Sass legacy.
  - Mitigación: migración progresiva de funciones deprecadas y limpieza por sprint.
- Riesgo: impacto en UX por cambios globales.
  - Mitigación: toggles por feature y validación continua con build + smoke tests.

## 9. Siguiente paso inmediato
Arrancar Fase 0 con un entregable en 24h:
- Especificación visual completa.
- Matriz de componentes y comportamientos.
- Backlog técnico priorizado para Sprint A y B.

## 10. Entregables Fase 0 (generados)
- docs/parity/PHASE0_VISUAL_SPEC.md
- docs/parity/PHASE0_COMPONENT_BEHAVIOR_MATRIX.md
- docs/parity/PHASE0_TOKENS_MOTION_SPEC.md
- docs/parity/PHASE0_EXECUTION_BACKLOG.md
