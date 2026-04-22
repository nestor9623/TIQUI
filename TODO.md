# TODO - Implementación Arquitectura Hexagonal TiquiApp

## ✅ PASO 1 COMPLETADO: Ports + JSON mocks

## ✅ PASO 2 COMPLETADO: Domain entities + UseCase movido/refinado

**Pendientes:**

### 3. Repo impl + Providers
- [ ] ✅ `JsonReportRepository` creado
- [ ] Editar `app.config.ts` providers

### 4. Fix imports Calendar
- [ ] Editar `features/calendar/pages/calendar.ts`

### 5. Cleanup duplicados
- [ ] Borrar archivos duplicados `core/mock/*report*`, `features/calendar/pages/*report*`

### 6. Flujo aprobación + Manager dashboard

**Estado: Repo impl listo, próximo app.config.ts**

### 3. Crear repositorio JSON impl
- [ ] `core/infraestructure/repositories/report/json-report.repository.ts` (lee JSONs)

### 4. Refinar auth mock
- [ ] Editar `core/mock/auth-mock.service.ts` → leer users.json + login-response.json

### 5. Actualizar providers e imports
- [ ] Editar `app.config.ts`
- [ ] Editar `features/calendar/pages/calendar.ts`

### 6. Implementar flujo aprobación
- [ ] `core/application/use-cases/fichaje/submit-for-approval.usecase.ts`
- [ ] Añadir en manager dashboard

### 7. Test & Cleanup
- [ ] `ng serve`, probar roles/flujo
- [ ] Eliminar TODO.md

**Estado: Ejecutando Paso 1...**
