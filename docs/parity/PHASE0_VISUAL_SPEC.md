# Fase 0 - Especificacion Visual y de Interaccion

## 1. Alcance de referencia
Referencia objetivo:
- https://at.lanno.dev/
- https://at.lanno.dev/dashboard/nfts

Alcance funcional para paridad:
- Shell global: sidebar, navbar, overlay, area de contenido.
- Dashboard estilo NFT como lenguaje visual base.
- Sistema de tablas, cards, paneles, menu de usuario.
- Dark mode y theming multi-paleta.

No se migra dominio en Fase 0:
- Casos de uso de fichajes.
- Puertos/adaptadores hexagonales.
- Servicios de auth y mocks.

## 2. Inventario de vistas objetivo
Vistas observadas en la referencia:
- Dashboard/NFTs con hero card principal y cards secundarias.
- Tabla tipo "Active Auctions" con estado temporal y acciones.
- Sidebar por grupos con subitems y estados activos.
- Navbar con user menu y acciones de configuracion.

Vistas actuales de TiquiApp a mapear:
- Dashboard: src/app/features/dashboard/pages/dashboard.html
- Reportes: src/app/features/reportes/pages/reportes.html
- Fichajes: src/app/features/fichajes/pages/fichajes.html
- Calendario: src/app/features/calendar/pages/calendar.html
- Incidencias: src/app/features/incidencias/pages/incidencias.html
- Shell: src/app/shared/components/layout/layout.html

## 3. Especificacion de layout (target)
### 3.1 Estructura general
- Sidebar fijo izquierdo.
- Navbar fijo superior desplazado por ancho de sidebar.
- Content wrapper con scroll interno.
- Fondo con capas: gradiente suave + ruido/atmosfera ligera.

### 3.2 Sidebar
- Jerarquia por secciones.
- Estado colapsado y expandido persistente.
- Estado active por ruta y estado hover.
- Interaccion mobile: drawer + overlay + cierre por click externo.

### 3.3 Navbar
- Brand compacto + meta de pagina.
- Bloque de acciones (settings, user avatar/menu).
- Dropdown de usuario con tema, dark mode y logout.

### 3.4 Area de contenido
- Grid modular con cards.
- Separacion visual por elevaciones y bordes suaves.
- Espaciado consistente por tokens.

## 4. Especificacion de componentes visuales
### 4.1 Cards
- Card principal de alto impacto (hero) con media, datos clave y CTA.
- Cards secundarias con metrica/resumen y acciones rapidas.
- Estados: hover con elevacion y contraste de borde.

### 4.2 Tabla avanzada
- Header sticky opcional en scroll largo.
- Celdas con tipografia numerica para montos/tiempo.
- Estado de fila hover y accion contextual.

### 4.3 Inputs y acciones
- Inputs con fondo elevado, borde semitransparente y focus visible.
- Botones primario/secundario/ghost con transiciones consistentes.
- Dropdowns con animacion de entrada corta.

## 5. Estados y comportamiento UX obligatorios
Estados por componente:
- default
- hover
- active/pressed
- focus-visible
- disabled
- loading
- empty
- error

Comportamientos globales:
- No saltos de layout al abrir/cerrar sidebar.
- Animaciones entre 120ms y 280ms.
- Overlay con blur ligero en menus mobile.
- Persistencia de preferencias UI en localStorage.

## 6. Responsive baseline
Breakpoints de validacion:
- 1440 px (desktop amplio)
- 1280 px (desktop comun)
- 1024 px (tablet landscape)
- 768 px (tablet portrait)
- 390 px (mobile)

Reglas:
- Sidebar en desktop fijo y en mobile tipo drawer.
- Navbar simplificada en mobile (oculta texto secundario).
- Grid de dashboard colapsa por bloques sin perder jerarquia visual.

## 7. Mapping visual a negocio de fichajes
Adaptacion semantica:
- "NFT cards" se convierten en "cards de jornada/metricas".
- Tabla "Active Auctions" se convierte en "registros de fichajes/reportes".
- Widgets financieros se convierten en KPIs de horas, incidencias y cumplimiento.

Condicion critica:
- Solo cambia la capa de presentacion.
- Dominio de fichajes se conserva.

## 8. Criterios de aceptacion de Fase 0
- Existe especificacion visual completa.
- Existe mapeo target->actual por cada modulo.
- Existen criterios medibles para Sprint A/B.
- Se identifican riesgos y bloqueadores de implementacion.

## 9. Bloqueadores detectados
- No se dispone de capturas automaticas versionadas en repo de referencia desde herramientas actuales.
- Solucion: generar baseline visual en Fase 1 con snapshots Playwright en tu repo.
