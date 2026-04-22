# Fase 0 - Inventario de Tokens y Motion

## 1. Objetivo
Definir contratos de diseño para reproducir la referencia con consistencia en toda la app.

## 2. Tokens de color (semanticos)
### 2.1 Brand
- --brand-primary
- --brand-accent
- --brand-secondary

### 2.2 Surface
- --surface-app
- --surface-card
- --surface-border
- --surface-overlay

### 2.3 Typography
- --text-primary
- --text-muted

### 2.4 Navigation
- --nav-background
- --nav-text
- --nav-text-strong
- --nav-accent
- --nav-active-bg

### 2.5 Estado
- --brand-success
- --brand-warning
- --brand-danger
- --brand-info

## 3. Tokens de espaciado y radio
Escala recomendada:
- spacing: 4, 8, 12, 16, 20, 24, 32
- radius: 8, 10, 12, 16, 999

Aplicacion:
- Cards: radius 12.
- Inputs/buttons medianos: radius 10.
- Avatares/chips: radius full.

## 4. Tokens de elevacion y blur
Niveles:
- elevation-1: cards base.
- elevation-2: hover cards.
- elevation-3: dropdowns/popovers.

Blur:
- overlay blur ligero en navbar y modales.

## 5. Motion system (global)
### 5.1 Duraciones
- fast: 120ms
- normal: 180ms
- slow: 260ms

### 5.2 Easing
- standard: cubic-bezier(0.2, 0, 0, 1)
- enter: cubic-bezier(0.16, 1, 0.3, 1)
- exit: cubic-bezier(0.4, 0, 1, 1)

### 5.3 Patrones
- Hover elevation: transform + box-shadow.
- Dropdown: fade + translateY corto.
- Sidebar collapse: width/spacing sincronizados.
- Stagger cards en dashboard.

## 6. Modo oscuro
Contrato:
- Mismo sistema de tokens, distintos valores.
- Contraste AA minimo para texto y controles.
- Sin hardcodear colores en componentes feature.

Estado actual:
- Theme store y paletas persistidas en localStorage ya existen.
- Falta extender cobertura a estilos legacy de todas las features.

## 7. Politica de implementacion
- Componentes shared solo consumen tokens CSS semanticos.
- Features migradas no introducen colores directos si existe token equivalente.
- Cualquier estilo legacy con lighten/darken pasa a color-mix o tokens dedicados.

## 8. Checklist de validacion por PR
- Usa tokens, no colores hardcoded.
- Incluye estados hover/active/focus-visible.
- Incluye validacion de dark mode.
- No rompe responsive 1440/1280/1024/768/390.
