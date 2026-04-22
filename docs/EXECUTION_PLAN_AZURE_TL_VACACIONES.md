# Plan de ejecucion - Azure 365, Team Leaders y Vacaciones

Fecha: 2026-04-30
Estado: Draft para ejecucion por fases

## 0) Revision de alcance (2026-05-06)

Cambios obligatorios acordados:

- No se usaran mocks para funcionalidades nuevas del agente ni para Azure dashboard.
- La fuente de verdad sera informacion real en Supabase y proveedores externos configurados.
- No se montara backend dedicado separado en esta fase.
- Para operaciones seguras con tokens de terceros se usara Supabase Edge Functions dentro del mismo proyecto operativo.

Estado actual verificado en codigo:

- El boton "Acceder con Microsoft 365" ya existe en login y llama a OAuth con provider `azure`.
- El flujo de login Microsoft base existe en `supabase-auth.service.ts`.
- El dashboard Azure actualmente usa placeholder (no datos reales) en `azure-dashboard.facade.ts`.
- Ya hay bandera `azureConnected` en modelo de usuario y sesion.

Decision tecnica:

- Mantener login Microsoft como esta base.
- Sustituir placeholder del dashboard por lectura real desde snapshot/tablas en Supabase.
- El agente de recomendaciones vivira en la app (Angular) con reglas dinamicas + datos reales.
- Integracion con Azure DevOps/Graph se hara por Edge Function para no exponer secretos en frontend.

## 1) Objetivo

Implementar una capa opcional de integracion con Microsoft 365/Azure DevOps para:

- Login con Microsoft 365 (opcional, coexistiendo con login normal)
- Vista informativa de sprint actual (inicio, hoy, fin, dias restantes)
- Vista rapida de tareas del usuario (solo lectura)
- Alertas personalizadas por usuario (dinamicas)
- Nuevo flujo Team Leader (TL) para asignacion de personas con aprobacion superior
- Nuevo modulo de vacaciones (solicitud, aprobacion, cupos por tipo/anio, impacto en calendario)

## 2) Principios de arquitectura

1. Todo Azure es opcional por usuario.
2. Si un usuario no conecta Microsoft, el sistema sigue funcionando igual.
3. No se rompe el rol actual manager/admin/employee.
4. Team Leader se modela como capacidad/perfil (no como rol global nuevo inicialmente).
5. Todo acceso Azure DevOps es read-only en esta fase.
6. Token handling seguro: no exponer secretos en frontend, refresco automatico y revocacion.

## 3) Fases de ejecucion

## Fase A - Fundacion de identidad e integraciones

- Boton "Acceder con Microsoft 365" en login.
- Flujo OAuth/OIDC via Supabase Auth (provider Microsoft).
- Vinculo de cuenta local con cuenta Microsoft (tabla de integracion).
- Indicador en perfil: "Microsoft conectado".
- Fallback limpio: login normal sin integracion.

Entregable:
- Usuario puede autenticar normal o Microsoft.
- Se persiste estado de integracion por usuario.

## Fase B - Dashboard sprint + tareas Azure (opcional)

- Tarjeta sprint en dashboard basada en Azure Boards para usuarios conectados.
- Datos: nombre sprint, fecha inicio, fecha fin, fecha actual, dias restantes.
- Vista rapida de tareas asignadas (top N por estado/prioridad).
- Modo no conectado: mostrar estado "no conectado" sin mock de tareas/sprint.

Entregable:
- Dashboard hibrido: datos reales si hay integracion; si no, vista base sin datos inventados.

## Fase C - Alertas dinamicas por usuario

- Definir perfil laboral por usuario (hora entrada/salida, pausas, tolerancias).
- Reglas de alertas por persona, no globales.
- Motor de alertas por eventos (fichaje, ausencias, anomalias, carga de trabajo).
- Modo "copilot agent": recomendaciones y mensaje contextual por usuario.

Entregable:
- Alertas personalizadas visibles en dashboard/notificaciones.

## Fase D - Team Leaders y asignaciones

- Nueva seccion de menu para gestion TL.
- Pantalla de asignacion tipo maestro-detalle:
  - Izquierda: lista de TL + filtros
  - Derecha: empleados
- Empleados ya asignados a otro TL se ven disabled.
- Flujo de solicitud de reasignacion para manager (aprobacion obligatoria).
- Al aprobar manager, cambia titularidad de empleado.

Entregable:
- Asignacion controlada y auditable de equipos por TL.

## Fase E - Modulo Vacaciones completo

- Solicitud por empleado con rango de fechas y tipo de bolsa.
- Tipos de bolsa por usuario (anual vigente, remanente anio anterior, legal, etc).
- Limites y cupos por tipo/anio/usuario.
- Si cupo agotado, opcion deshabilitada en selector.
- Flujo aprobacion TL/manager.
- Reflejo en calendario empleado (bloqueado por vacaciones aprobadas).
- Vista TL de personas de su equipo con vacaciones, permisos y bajas.
- Escalabilidad para manager/admin: por TL, por grupo, o global.

Entregable:
- Modulo integral de solicitudes con trazabilidad y reflejo operativo.

## Fase F - Calidad visual y responsive

- Auditoria visual de espaciados, bordes, tipografia y consistencia.
- Ajustes responsive prioritarios: login, dashboard, asignaciones TL, vacaciones.
- QA por breakpoints: 360, 768, 1024, 1440.

Entregable:
- UI consistente y usable en movil y desktop.

## 4) Modelo funcional propuesto

## 4.1 Login opcional 365

- `login_method`: local o microsoft.
- Un usuario local puede vincular Microsoft mas tarde.
- Integracion activa si existe token valido de proveedor.

## 4.2 Sprint y tareas

- Fuente: Azure DevOps REST (iteraciones + work items asignados).
- Solo lectura.
- Cache corta para no saturar API.

## 4.3 Team Leader

- TL es employee con capability `is_team_leader = true`.
- Relacion equipo: asignacion employee -> TL.
- Reasignacion requiere solicitud y aprobacion manager.

## 4.4 Vacaciones

- Bolsas configurables por usuario y anio.
- Solicitud consume cupo segun tipo elegido.
- Al aprobar, se generan bloques en calendario de trabajo.

## 5) Riesgos y mitigacion

- Riesgo: complejidad OAuth + refresh tokens.
  - Mitigacion: broker con Supabase Auth + Edge Functions.
- Riesgo: reglas RLS complejas por TL/manager.
  - Mitigacion: funciones helper SECURITY DEFINER y politicas por accion.
- Riesgo: impacto UX por pantallas grandes.
  - Mitigacion: entregas por vertical con pruebas responsive por fase.

## 6) Orden recomendado de implementacion tecnica

1. Infra de autenticacion Microsoft y persistencia de integracion.
2. Cliente backend para Azure Boards (Edge Function).
3. Dashboard sprint/tareas solo con datos reales desde snapshot (sin placeholders).
4. Dominio TL y flujo de solicitud de reasignacion.
5. Dominio Vacaciones y calendario.
6. Alertas dinamicas y personalizacion.
7. Pulido UI + responsive + e2e.

## 6.1 Plan detallado para agente dentro del proyecto (sin backend dedicado)

Objetivo:

- Generar recomendaciones dinamicas al iniciar sesion y durante la jornada, usando datos reales.

Componentes:

1. `AgentContextService` (frontend)
- Carga contexto real del usuario desde Supabase:
  - ultimo fichaje y estado del dia,
  - balance semanal,
  - solicitudes pendientes/aprobadas/rechazadas,
  - notificaciones no leidas,
  - configuracion laboral del usuario.

2. `RecommendationEngineService` (frontend)
- Motor determinista con scoring por prioridad.
- Entrada: contexto real.
- Salida: top recomendaciones con razon explicable y accion sugerida.

3. `NotificationCenterService` (frontend + tabla real)
- Consume eventos reales de negocio (aprobaciones, rechazos, comentarios, incidencias).
- Guarda y lee notificaciones desde Supabase.
- Marca lectura individual y masiva.

4. `Edge Function` para conectores externos (seguridad)
- Azure DevOps y/o Graph via function.
- El frontend nunca ve refresh tokens ni secretos.

Reglas iniciales dinamicas:

- Si falta fichaje de entrada/salida en ventana horaria: alerta prioritaria.
- Si hay exceso de jornada acumulado: sugerir ajuste de salida/entrada.
- Si hay solicitud respondida por manager: generar notificacion con comentario.
- Si hay vacaciones aprobadas/rechazadas: generar notificacion contextual.

Entregable:

- Agente operativo en app sin LLM obligatorio, basado en datos reales y con explicabilidad.

## 6.2 Azure 365: checklist de configuracion pendiente (boton ya existente)

Esta es la lista exacta para cerrar la integracion:

1. Microsoft Entra ID (App registration)
- Crear app registration (single tenant o multi tenant segun necesidad).
- Configurar redirect URI de Supabase callback:
  - `https://<project-ref>.supabase.co/auth/v1/callback`
- Guardar `Application (client) ID`, `Directory (tenant) ID` y `Client secret`.

2. Supabase Auth > Providers > Azure
- Activar provider Azure.
- Cargar tenant/client id/client secret.
- Definir scopes minimos: `openid profile email offline_access`.
- Configurar redirect URLs permitidas para app:
  - `http://localhost:4200/auth/login`
  - URL productiva de login.

3. Flujo de sesion y perfil
- Verificar que el callback vuelve a `/auth/login` y restaura sesion.
- Confirmar persistencia de `login_method='microsoft'` y `azure_connected=true`.
- Guardar `azure_oid` y `azure_tenant_id` en perfil/integracion para trazabilidad.

4. Permisos y consentimiento
- Validar consentimiento admin/usuario segun tenant.
- Si se usara Graph, anadir permisos minimos (por ejemplo `User.Read`) y consentimiento.

5. Conexion Azure Boards real
- Implementar lectura de sprint/tareas por Edge Function usando credenciales seguras.
- Guardar snapshot en tablas (`azure_sprint_snapshot`, `azure_task_snapshot`).
- Consumir snapshots desde frontend.

6. QA de integracion
- Caso usuario no conectado: sin errores ni datos inventados.
- Caso usuario conectado: sprint y tareas reales.
- Caso token expirado: refresh/reautenticacion controlada.

## 6.3 Operacion diaria sin editor web (solo VS Code)

- Ejecutar SQL y seeds desde terminal del proyecto.
- Versionar migraciones y scripts en `scripts/`.
- Opcional: crear tareas de VS Code para `seed`, `sync`, `snapshot`, `verify`.
- Opcional: MCP interno para ejecutar operaciones permitidas de Supabase con auditoria.

## 7) Definicion de exito (MVP)

- Login normal sigue funcionando.
- Login Microsoft funciona en paralelo.
- Dashboard muestra sprint real solo para usuarios conectados.
- Team Leader puede gestionar asignaciones con aprobacion manager.
- Vacaciones se solicitan, aprueban y reflejan en calendario.
- Alertas se personalizan por usuario.

## 8) Actualizaciones requeridas en Supabase

Esta seccion es el backlog exacto para BD, RLS, funciones y automatizaciones.

## 8.1 Extensiones sobre profiles

- Mantener `role` como esta (admin/manager/employee).
- Agregar columnas:
  - `is_team_leader boolean default false`
  - `team_group_id uuid null`
  - `work_pattern_id uuid null`
  - `azure_connected boolean default false`
  - `azure_tenant_id text null`
  - `azure_oid text null`
  - `login_method text check (login_method in ('local','microsoft')) default 'local'`

## 8.2 Integraciones Azure por usuario

Tabla `user_integrations`:
- `id uuid pk`
- `user_id uuid fk profiles(id)`
- `provider text` (microsoft, azure_devops)
- `provider_user_id text`
- `access_token_encrypted text`
- `refresh_token_encrypted text`
- `expires_at timestamptz`
- `scopes text[]`
- `status text` (active, revoked, error)
- `last_sync_at timestamptz`
- `created_at`, `updated_at`

Notas:
- Encriptar tokens (pgcrypto o KMS via edge function).
- Nunca exponer refresh token al frontend.

## 8.3 Config Azure Boards por usuario/equipo

Tabla `azure_board_settings`:
- `id uuid pk`
- `user_id uuid fk`
- `organization text`
- `project text`
- `team text`
- `default_area_path text`
- `enabled boolean default true`

## 8.4 Snapshot cache de sprint y tareas

Tabla `azure_sprint_snapshot`:
- `id uuid pk`
- `user_id uuid fk`
- `sprint_id text`
- `sprint_name text`
- `start_date date`
- `end_date date`
- `payload jsonb`
- `synced_at timestamptz`

Tabla `azure_task_snapshot`:
- `id uuid pk`
- `user_id uuid fk`
- `work_item_id text`
- `title text`
- `state text`
- `priority text`
- `assigned_to text`
- `url text`
- `payload jsonb`
- `synced_at timestamptz`

## 8.5 Team Leader y asignaciones

Tabla `team_groups`:
- `id uuid pk`
- `name text`
- `active boolean`
- `manager_id uuid fk profiles(id)`

Tabla `team_leader_assignments`:
- `id uuid pk`
- `team_leader_id uuid fk profiles(id)`
- `employee_id uuid fk profiles(id)`
- `group_id uuid fk team_groups(id)`
- `active boolean default true`
- `assigned_at timestamptz`
- `assigned_by uuid fk profiles(id)`
- unique activo por empleado

Tabla `team_leader_change_requests`:
- `id uuid pk`
- `employee_id uuid fk`
- `current_team_leader_id uuid fk`
- `requested_team_leader_id uuid fk`
- `requested_by uuid fk`
- `status text` (pending, approved, rejected)
- `manager_reviewer_id uuid fk`
- `manager_comment text`
- `created_at`, `reviewed_at`

## 8.6 Vacaciones: catalogo, saldos, solicitudes y trazabilidad

Tabla `vacation_types`:
- `id uuid pk`
- `code text unique`
- `name text`
- `carry_over boolean`
- `legal_basis text`
- `active boolean`

Tabla `user_vacation_quotas`:
- `id uuid pk`
- `user_id uuid fk`
- `year int`
- `vacation_type_id uuid fk`
- `total_days numeric(5,2)`
- `used_days numeric(5,2)`
- `pending_days numeric(5,2)`
- `available_days numeric(5,2) generated`
- unique (`user_id`,`year`,`vacation_type_id`)

Tabla `vacation_requests`:
- `id uuid pk`
- `user_id uuid fk`
- `vacation_type_id uuid fk`
- `start_date date`
- `end_date date`
- `requested_days numeric(5,2)`
- `status text` (draft, pending, approved, rejected, cancelled)
- `approver_id uuid fk`
- `reason text`
- `manager_comment text`
- `created_at`, `updated_at`, `resolved_at`

Tabla `vacation_request_days`:
- `id uuid pk`
- `request_id uuid fk`
- `day date`
- `day_fraction numeric(3,2)`
- unique (`request_id`,`day`)

Tabla `vacation_events` (auditoria):
- `id uuid pk`
- `request_id uuid fk`
- `event_type text`
- `actor_id uuid fk`
- `payload jsonb`
- `created_at`

## 8.7 Alertas dinamicas por usuario

Tabla `user_work_patterns`:
- `id uuid pk`
- `user_id uuid fk unique`
- `entry_time time`
- `exit_time time`
- `break_enabled boolean`
- `break_minutes int`
- `timezone text`
- `tolerance_minutes int`
- `active boolean`

Tabla `user_alert_preferences`:
- `id uuid pk`
- `user_id uuid fk unique`
- `channels text[]` (in_app, email, push)
- `quiet_hours jsonb`
- `rules jsonb`
- `enabled boolean`

Tabla `alert_events`:
- `id uuid pk`
- `user_id uuid fk`
- `type text`
- `severity text`
- `title text`
- `message text`
- `payload jsonb`
- `read_at timestamptz`
- `created_at`

## 8.8 RLS y funciones helper nuevas

Funciones helper sugeridas:
- `get_my_role()` ya existe.
- `is_team_leader(uid)`
- `is_manager_of(uid_target)`
- `is_team_leader_of(uid_target)`

Politicas RLS clave:
- `team_leader_assignments`: TL ve su equipo; manager/admin ven todo; updates restringidos.
- `team_leader_change_requests`: requester crea; manager del equipo revisa; admin full.
- `vacation_requests`: empleado ve/crea las suyas; TL ve su equipo; manager/admin global segun regla.
- `user_vacation_quotas`: empleado ve su saldo; TL/manager vista por equipo.
- `user_integrations`: solo propietario + backend service role.

## 8.9 Triggers y jobs

Triggers:
- Al aprobar `vacation_requests`, descontar quota y crear eventos de calendario laboral.
- Al rechazar/cancelar, revertir saldo pendiente.
- Al cambiar asignacion TL aprobada, cerrar asignacion activa anterior y abrir nueva.

Jobs (cron/edge):
- Refresh token Azure antes de expiracion.
- Sync diario de sprint/tareas para conectados.
- Recalculo nocturno de alertas/anomalias.

## 8.10 Vistas para consumo frontend

Vistas SQL:
- `vw_my_sprint_summary`
- `vw_my_quick_tasks`
- `vw_team_availability` (vacaciones/permisos/bajas por equipo y sprint)
- `vw_vacation_balances`

## 8.11 Migraciones y orden de despliegue

1. Migracion columnas `profiles`.
2. Tablas `user_integrations`, `azure_board_settings`, snapshots.
3. Tablas TL + solicitudes de cambio.
4. Tablas vacaciones + cuotas + eventos.
5. Tablas alertas dinamicas.
6. Funciones helper + RLS policies.
7. Triggers de negocio.
8. Seeds iniciales (vacation_types, quotas base 23 dias, etc).
9. Validacion con usuarios demo.

## 8.12 Seeds minimos iniciales

- Vacation types base (anio actual, remanente anio anterior, legal).
- Quotas por usuario al alta (ejemplo: 23 dias anual actual).
- Team groups base.
- Config default de alertas por rol.

## 9) Criterios de no-regresion

- Login local y rutas actuales deben permanecer estables.
- Si no hay integracion Azure, no debe haber errores ni estados rotos.
- RLS no debe abrir acceso transversal entre equipos.
- Cambios de asignacion siempre auditados y aprobados cuando aplique.
