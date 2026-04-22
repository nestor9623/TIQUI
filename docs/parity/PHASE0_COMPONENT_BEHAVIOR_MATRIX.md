# Fase 0 - Matriz de Componentes y Comportamientos

## 1. Matriz de paridad (Shell)
| Bloque | Target (referencia) | Estado actual | Gap | Prioridad |
|---|---|---|---|---|
| Sidebar | Secciones, subgrupos, active fuerte, colapsado premium | Implementado base | Ajustar densidad, iconografia, microinteracciones | Alta |
| Navbar | Acciones limpias, dropdown user consistente | Implementado base | Pulir spacing, tipografia y estados de foco | Alta |
| Theme switch | Multi-theme + dark mode uniforme | Implementado parcial | Falta cobertura total en features legacy | Alta |
| Content shell | Atmosfera visual y grid modular | Implementado parcial | Falta estandarizacion total por pagina | Alta |

## 2. Matriz de paridad (Componentes base)
| Componente | Target | Implementado | Gap tecnico |
|---|---|---|---|
| Button | Variantes visuales + estados ricos | ui-button | Agregar loading visual avanzado y tokens de elevacion por estado |
| Card | Hero, metric, compact y media | ui-card (basico) | Faltan variantes hero/stat/media |
| Text Input | Label/focus/error premium | ui-text-input | Falta densidad compacta y helper slots |
| Dropdown | Menu con secciones y animacion | navbar dropdown | Convertir a componente reusable |
| Table Shell | Cabecera, hover, acciones, vacio | reportes y incidencias parcial | Unificar en componente shared |

## 3. Matriz de paridad por pagina
| Pagina | Referencia visual | Estado | Complejidad | Recomendacion |
|---|---|---|---|---|
| Dashboard | Muy alta | Parcial | Alta | Migrar primero tras shell |
| Reportes | Alta | Parcial | Media | Segundo, usando table shell nuevo |
| Fichajes | Alta | Parcial | Alta | Tercero, por relevancia de negocio |
| Calendario | Media/alta | Parcial | Alta | Cuarto, preservar semantica de estados |
| Incidencias | Media | Parcial | Baja/media | Quinto |
| Admin dashboard | Alta | Parcial | Alta | Sexto |

## 4. Matriz de comportamientos obligatorios
| Interaccion | Target | Estado actual | Accion |
|---|---|---|---|
| Sidebar collapse | Persistente, animado y sin layout shift | Si | Afinar timing y easing |
| Mobile drawer | Overlay, close-outside, focus management | Si parcial | Completar focus trap y escape |
| Dropdown user | Toggle, cierre por outside click, animacion | Si | Estandarizar como componente |
| Hover cards | Elevacion + borde + suavizado | Parcial | Aplicar por tokens globales |
| Tablas | Hover fila + acciones contextuales | Parcial | Unificar table shell |
| Dark mode | Cobertura total app | Parcial | Migrar estilos legacy a tokens CSS |

## 5. Matriz de estados visuales por familia
| Familia | default | hover | active | focus-visible | disabled | loading | empty |
|---|---|---|---|---|---|---|---|
| Button | Si | Si | Si | Parcial | Si | Parcial | N/A |
| Input | Si | Si | N/A | Si | Si | N/A | N/A |
| Card | Si | Parcial | N/A | N/A | N/A | N/A | Parcial |
| Table | Si | Parcial | Parcial | N/A | N/A | Parcial | Parcial |
| Sidebar item | Si | Si | Si | Parcial | N/A | N/A | N/A |

## 6. Criterios de medicion de paridad
Paridad visual por pagina:
- Objetivo >= 95% por checklist de spacing, color, tipografia, elevacion, borders, motion.

Paridad de comportamiento:
- Objetivo >= 95% por checklist de eventos UI y estados.

Defectos bloqueantes:
- Cualquier regression en auth, roles, timeout o routing principal.
