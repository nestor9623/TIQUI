# Reglas Clave de Desarrollo

## 1) Angular 21 como base obligatoria
- Todo componente nuevo o refactorizado debe seguir Angular 21.
- Priorizar `signal()`, `computed()` y `input()` / `output()` para estado local y API publica.
- Usar RxJS solo cuando el origen de datos o la integracion realmente lo requieran.
- Mantener `ChangeDetectionStrategy.OnPush` en componentes de UI.

## 2) Estructura obligatoria de componentes
- No se permite renderizar HTML inline dentro del fichero `.ts` del componente.
- Todo componente debe tener su plantilla en un fichero `.html` y sus estilos en un fichero `.scss` propios.
- Mantener templates legibles, sin logica compleja incrustada.

## 3) SCSS y nomenclatura
- Los ficheros `.scss` deben seguir BEM: `bloque__elemento--modificador`.
- Evitar selectores descendentes genericos cuando exista una clase BEM mas explicita.
- Variables de color, espaciado y tipografia solo desde el sistema global de estilos.

## 4) Estado y persistencia
- El objetivo del repo es migrar el estado UI y de aplicacion a stores basados en signals.
- No introducir accesos nuevos y directos a `localStorage` o `sessionStorage` desde componentes.
- Cuando haya persistencia, encapsularla en un store dedicado y dejarla preparada para una futura migracion a Signal Store.

## 5) Internacionalizacion
- No se permiten textos de interfaz hardcodeados en componentes, templates o stores.
- Todo literal visible para la persona usuaria debe vivir en su fichero `.json` de `i18n` correspondiente.
- Las claves de traduccion deben agruparse por feature o componente para evitar bundles difusos.

## 6) Diseno de componentes
- Priorizar componentes pequenos, cohesivos y con responsabilidad unica.
- Evitar duplicacion de logica, estilos y literales.
- Inputs y outputs deben estar tipados y nombrados de forma semantica.

## 7) Calidad minima antes de entregar
- Antes de finalizar cualquier cambio hay que verificar que compila correctamente con `ng build`.
- Corregir errores de compilacion o tipado antes de dar una tarea por cerrada.
- Cualquier cambio visual debe mantenerse responsive en mobile y desktop.

## 8) Tests
- No crear, modificar ni ejecutar tests visuales, funcionales o unitarios salvo indicacion explicita del usuario.

## 9) Verificacion final
- Antes de entregar, revisar que el cambio cumple estas reglas y que no deja deuda tecnica nueva evitable.
- Si se detectan mejoras o migraciones recomendables fuera del alcance inmediato, documentarlas y comentarlas antes de ejecutarlas.
