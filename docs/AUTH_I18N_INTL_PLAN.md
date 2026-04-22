# Plan de ejecución: Auth visual, i18n JSON e identidad internacional

## Objetivo
Alinear la experiencia de autenticación con una línea visual premium y dejar preparada la app para una expansión internacional real, manteniendo arquitectura hexagonal, signals-first y una base de traducciones editable en JSON.

---

## 1. Forgot Password debe seguir la nueva línea visual

### Meta
Hacer que la pantalla de recuperación de contraseña respire exactamente la misma identidad que el login actual.

### Acciones
- Reutilizar el mismo canvas visual unificado del login para evitar cortes y fondos inconsistentes.
- Mantener el mismo lenguaje de tarjetas, bordes, sombras, gradientes y motion suave.
- Añadir un bloque visual lateral equivalente al login, con mensaje de recuperación segura y confianza operativa.
- Migrar el componente a un patrón signal-first:
  - loading con signal
  - error con signal
  - success con signal
  - derivados con computed
- Revisar accesibilidad de foco, lectura de alertas y navegación por teclado.

### Resultado esperado
Una pantalla de recuperación coherente, elegante y no aislada visualmente del resto del flujo auth.

---

## 2. Migración de i18n desde TypeScript a JSON

### Decisión
Sí, para este proyecto tiene más sentido pasar a JSON por mantenibilidad y edición rápida.

### Estructura propuesta
- src/app/core/i18n/i18n.config.ts
- src/app/core/i18n/i18n.store.ts
- src/assets/i18n/es/common.json
- src/assets/i18n/es/login.json
- src/assets/i18n/es/navbar.json
- src/assets/i18n/es/reports.json
- src/assets/i18n/en/common.json
- src/assets/i18n/en/login.json
- src/assets/i18n/en/navbar.json
- src/assets/i18n/en/reports.json

### Estrategia técnica
- Mantener un store central de idioma con signals.
- El store no contendrá textos hardcodeados; cargará diccionarios JSON.
- Los componentes consumirán solo signals y computed derivados del store.
- Se añadirá persistencia del idioma en localStorage.
- Se dejará una función de acceso simple por claves para evitar duplicación.

### Ventajas
- Más fácil de mantener y revisar.
- Mejor para trabajo de producto o QA.
- Más listo para incorporar más idiomas en el futuro.

---

## 3. Mini mapa animado en login

### Objetivo
Reflejar visualmente que Tiqui puede operar con fichajes internacionales sin romper la estética elegante actual.

### Propuesta visual
- Integrar un pequeño mapa SVG estilizado dentro del hero del login.
- Mostrar 3 o 4 puntos clave con pulsos sutiles.
- Dibujar una línea animada entre ubicaciones para simular sincronización o validación global.
- Mantenerlo pequeño, limpio y con opacidad controlada.
- No usar una librería pesada; hacerlo con SVG y CSS para que sea performante.

### Enfoque recomendado
- Primera versión con Europa y Latinoamérica estilizadas.
- Puntos sugeridos: Madrid, Londres, Bogotá, Ciudad de México.
- Animación con fallback para reduce motion.

### Resultado esperado
Un detalle premium y diferencial sin recargar la pantalla.

---

## 4. Orden de ejecución recomendado

### Fase A
Migrar i18n a JSON y dejar navbar + login usando la nueva fuente.

### Fase B
Actualizar forgot-password para que siga exactamente la línea del login.

### Fase C
Integrar el mini mapa internacional animado en el hero del login.

### Fase D
Extender i18n a dashboard, reportes, fichajes y calendario.

---

## 5. Criterios de calidad
- Sin romper arquitectura hexagonal.
- Sin meter lógica de traducción en componentes de dominio.
- UI basada en signals y computed donde aplique.
- Accesibilidad mínima WCAG AA.
- Build limpio y revisión responsive en desktop y mobile.

---

## 6. Siguiente paso inmediato
Ejecutar la Fase A:
1. mover textos a JSON
2. adaptar store i18n
3. dejar login y navbar consumiendo JSON
4. después continuar con forgot-password y mapa
