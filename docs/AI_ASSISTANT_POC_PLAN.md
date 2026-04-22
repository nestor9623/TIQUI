# Agente Tiqui POC sin coste

## Objetivo

Validar dentro de la app un asistente operativo que ayude a equilibrar jornada, detectar exceso de horas y priorizar acciones sin depender de APIs de IA de pago.

## Restricción principal

- Coste externo cero en esta fase.
- Sin LLM, sin vector DB y sin proveedor de chat.
- Toda la lógica se resuelve con reglas locales y datos ya disponibles en la app.

## Superficies de integración

1. Panel global en el shell autenticado.
   - Entrada permanente desde cualquier pantalla.
   - Muestra recomendación principal, alertas y accesos rápidos.

2. Tarjeta prioritaria en dashboard.
   - Resume la acción más útil del día.
   - Da visibilidad inmediata al valor del asistente.

3. Reutilización futura en fichajes e incidencias.
   - Fichajes: sugerencia de hora de salida, pausas y compensación.
   - Incidencias: sugerencia de solicitud o revisión pendiente.

## Reglas del MVP

- Calcular balance diario contra jornada objetivo.
- Calcular balance semanal contra el avance esperado de la semana.
- Recomendar hora de salida si la jornada está en curso.
- Recomendar hora de entrada del día siguiente si hubo exceso o déficit relevante.
- Alertar cuando haya bloque largo de trabajo continuo.
- Alertar a manager/admin cuando existan incidencias pendientes.

## Alcance de esta ejecución

- Servicio de recomendaciones deterministas.
- Panel lateral global del asistente.
- Tarjeta resumen del asistente en dashboard.
- Etiqueta explícita de POC local sin coste.

## Siguiente fase sugerida

- Añadir tarjeta contextual en fichajes.
- Persistir historial de recomendaciones aceptadas o ignoradas.
- Programar recordatorios reales desde backend cuando la POC quede validada.
