# Sistema de Autenticación - TiquiApp

## 📋 Descripción General

Sistema de autenticación completo y seguro implementado con las mejores prácticas de Angular 21, incluyendo:

- **Login seguro** con formulario reactivo
- **Gestión de JWT** con refresh tokens
- **Monitoreo de sesión** con timeout automático
- **Modal de advertencia** cuando la sesión está a punto de expirar
- **Interceptor HTTP** para inyectar token en todas las solicitudes
- **Guard de rutas** para proteger áreas autenticadas
- **Mock de datos** para desarrollo sin backend

---

## 🗂️ Estructura de Carpetas

```
src/app/
├── core/
│   ├── auth/
│   │   ├── guards/
│   │   │   └── auth.guard.ts                 # Guard de rutas
│   │   ├── interceptors/
│   │   │   └── auth.interceptor.ts           # Interceptor HTTP para JWT
│   │   ├── models/
│   │   │   └── auth.model.ts                 # Interfaces y tipos
│   │   ├── services/
│   │   │   ├── auth.service.ts               # Servicio principal de auth
│   │   │   ├── token.service.ts              # Gestión de tokens
│   │   │   └── session-timeout.service.ts    # Monitoreo de sesión
│   │   └── index.ts
│   └── mock/
│       └── auth-mock.service.ts              # Mock de backend (JWT simulado)
│
├── features/
│   └── auth/
│       ├── pages/
│       │   ├── login/
│       │   │   ├── login.component.ts        # Página de login
│       │   │   ├── login.component.html
│       │   │   └── login.component.scss
│       │   └── forgot-password/
│       │       ├── forgot-password.component.ts
│       │       ├── forgot-password.component.html
│       │       └── forgot-password.component.scss
│       ├── components/
│       │   └── session-timeout-modal/
│       │       ├── session-timeout-modal.component.ts
│       │       ├── session-timeout-modal.component.html
│       │       └── session-timeout-modal.component.scss
│       ├── auth-routing.module.ts
│       └── index.ts
```

---

## 🔐 Características Principales

### 1. **Autenticación con JWT Mock**

El sistema utiliza JWT tokens simulados para desarrollo. Los tokens expiran cada **5 minutos** y se almacenan en `localStorage`.

```typescript
// Ejemplo de payload JWT decodificado
{
  sub: "1",
  email: "employee@tiqui.com",
  firstName: "Juan",
  lastName: "Pérez",
  role: "employee",
  iat: 1710777600,
  exp: 1710777900
}
```

### 2. **Credenciales de Demo**

Para pruebas rápidas, usa:

| Email | Contraseña | Rol |
|-------|------------|-----|
| admin@tiqui.com | admin123 | Admin |
| employee@tiqui.com | employee123 | Employee |
| manager@tiqui.com | manager123 | Manager |

### 3. **Monitoreo de Sesión**

- **Inactividad**: 2 minutos (120 segundos)
- **Advertencia**: 1 minuto antes de expirar
- **Actividad**: clicks, teclas, scroll, touch
- **Refresco**: Automático cada 5 minutos si hay inactividad

El sistema detecta actividad del usuario y reinicia el contador de inactividad. Una vez que falten 60 segundos, aparece el modal informativo.

### 4. **Modal de Advertencia**

Cuando la sesión está a punto de expirar:

- Muestra cuenta regresiva en formato MM:SS
- Cambia de color según tiempo restante:
  - 🟢 Normal (> 60s): Azul
  - 🟡 Warning (30-60s): Amarillo
  - 🔴 Critical (< 30s): Rojo
- Opciones: Extender sesión o cerrar sesión inmediata

### 5. **Interceptor HTTP**

Automáticamente:

- Inyecta token en header: `Authorization: Bearer {token}`
- Detección de errores 401 (Unauthorized)
- Intenta refrescar token automáticamente
- Logout si falla el refresh

### 6. **Guard de Rutas**

Protege todas las rutas excepto `/auth/`:

```typescript
{
  path: 'home',
  canActivate: [AuthGuard],
  loadChildren: () => ...
}
```

---

## 🎨 Diseño Visual

### Login Page

**Layout Split:**
- **Mitad Izquierda**: Gradiente azul lavanda con logo y info cards
- **Mitad Derecha**: Formulario de login con colores pastel

**Paleta de Colores:**
- Primary: `#7c83fd` (Azul Lavanda)
- Accent: `#6fcf97` (Verde Pastel)
- Info: `#56ccf2` (Azul Cielo)
- Warning: `#f2c94c` (Amarillo Suave)
- Danger: `#f28482` (Rojo Pastel)

### Formularios

- Validaciones en tiempo real
- Feedback visual clara
- Toggle para mostrar/ocultar contraseña
- Spinner de carga
- Mensajes de error descriptivos

---

## 🔄 Flujo de Autenticación

```
1. Usuario ingresa credenciales
   ↓
2. Se valida en AuthMockService
   ↓
3. Se genera JWT mock (5 min expiry)
   ↓
4. Se guardan:
   - Token en localStorage
   - Refresh token en localStorage
   - Tiempo de expiración
   ↓
5. AuthService actualiza su estado
   ↓
6. SessionTimeoutService inicia monitoreo
   ↓
7. App redirige a /home
   ↓
8. Todas las llamadas HTTP llevan token
   ↓
9. Si inactividad > 2 min → Modal de advertencia
   ↓
10. Si usuario no responde → Logout automático
```

---

## 💡 Uso en Componentes

### Acceder al Usuario Actual

```typescript
import { AuthService } from '@core/auth/services/auth.service';

export class MiComponente implements OnInit {
  user$ = this.authService.auth$.pipe(
    map(state => state.user)
  );

  constructor(private authService: AuthService) {}

  ngOnInit() {
    const usuario = this.authService.getCurrentUser();
    console.log(usuario);
  }
}
```

### Logout

```typescript
this.authService.logout();
this.router.navigate(['/auth/login']);
```

### Refrescar Token Manualmente

```typescript
this.authService.refreshAccessToken().subscribe({
  next: () => console.log('Token refrescado'),
  error: () => console.log('Refresh fallido')
});
```

### Token Service

```typescript
import { TokenService } from '@core/auth/services/token.service';

constructor(private tokenService: TokenService) {}

// Obtener token actual
const token = this.tokenService.getToken();

// Verificar si está expirado
if (this.tokenService.isTokenExpired()) {
  // Redirige a login
}

// Decodificar token
const payload = this.tokenService.decodeToken(token);
console.log(payload); // { sub, email, role, iat, exp }
```

---

## 🚀 Integración con Backend Real

Para pasar de mock a backend real:

### 1. Reemplazar AuthMockService

En lugar de usar `AuthMockService`, implementa llamadas HTTP reales:

```typescript
// auth.service.ts

login(credentials: LoginCredentials): Observable<AuthResponse> {
  return this.http.post<AuthResponse>('/api/auth/login', credentials)
    .pipe(
      tap(response => this.handleAuthResponse(response)),
      catchError(error => this.handleAuthError(error))
    );
}

refreshAccessToken(): Observable<AuthResponse> {
  const refreshToken = this.tokenService.getRefreshToken();
  return this.http.post<AuthResponse>('/api/auth/refresh', { refreshToken })
    .pipe(
      tap(response => this.handleAuthResponse(response)),
      catchError(error => this.handleAuthError(error))
    );
}
```

### 2. Actualizar Interceptor

Si tu API devuelve tokens en headers o refresca automáticamente:

```typescript
export class AuthInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.tokenService.getToken();
    if (token) {
      request = this.addToken(request, token);
    }

    return next.handle(request).pipe(
      catchError(error => {
        if (error.status === 401) {
          // Lógica de refresh
        }
        return throwError(() => error);
      })
    );
  }
}
```

### 3. Actualizar Configuración

```typescript
// app.config.ts

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptorsFromDi(),
      withXsrfConfiguration({...})
    ),
    // Tu AuthService seguirá funcionando igual
  ]
};
```

---

## 🧪 Testing

### Guard Testing

```typescript
it('debería redireccionar si no está autenticado', () => {
  const spy = spyOn(authService, 'isAuthenticated').and.returnValue(false);
  const canActivate = guard.canActivate(route, state);
  expect(canActivate).toBeFalsy();
});
```

### Service Testing

```typescript
it('debería guardar token correctamente', () => {
  tokenService.setToken('mock-token', 300);
  expect(tokenService.getToken()).toBe('mock-token');
  expect(tokenService.isTokenExpired()).toBeFalsy();
});
```

---

## ⚖️ Mejores Prácticas Implementadas

✅ **Standalone Components** - Angular 21+
✅ **Reactive Forms** - Tipo-seguro
✅ **TypeScript Strict Mode** - Tipos explícitos
✅ **RxJS Patterns** - Subscripciones limpias
✅ **Servicios Inyectados** - DI contenedor
✅ **Guards de Rutas** - Protección declarativa
✅ **Interceptors HTTP** - Centralización de lógica
✅ **Estado Centralizado** - Subjects y Observables
✅ **SCSS Modular** - Variables y mixins
✅ **Accesibilidad** - Formularios con labels
✅ **Manejo de Errores** - Try-catch y error streams
✅ **Performance** - ChangeDetection OnPush (standby)

---

## 🐛 Troubleshooting

### "No se encuentra el módulo auth-mock.service"

Verifica las importaciones en `auth.service.ts` apuntan a `../../mock/auth-mock.service`

### Session no se muestra

- Confirma que `SessionTimeoutModalComponent` esté en `app.html`
- Verifica que `SessionTimeoutService.startSessionMonitoring()` se llama

### Token no se inyecta en requests

- Revisa que `AuthInterceptor` esté registrado en `app.config.ts`
- Verifica que el token existe en localStorage

### Logout no redirige correctamente

- Confirma que permisos en el router son correctos
- Revisa que `router.navigate()` se llama después de `logout()`

---

## 📝 Notas de Desarrollo

- **Mock expira en 5 minutos**: Para cambiar, modifica `expiresIn` en `auth-mock.service.ts`
- **Timeout de inactividad**: Cambia `TIMEOUT_DURATION` en `session-timeout.service.ts`
- **Colores personalizados**: Usa variables de `src/styles/abstracts/_variables.scss`
- **Emails de prueba**: Agrega más usuarios en `mockUsers` de `auth-mock.service.ts`

---

**Versión**: 1.0.0  
**Angular**: 21.2.0  
**Última Actualización**: Marzo 2025
