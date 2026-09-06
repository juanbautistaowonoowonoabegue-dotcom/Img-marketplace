# Auditoría técnica — Compra Ya (Img-marketplace)

Alcance: rama `main`, 393 ficheros versionados, 33 páginas HTML en `public/`, Cloud Functions v2, reglas de Firestore y Storage, backend Java abandonado en `src/`, envoltorio Capacitor para Android.

Clasificación: **P0** = detener y corregir antes de cualquier despliegue · **P1** = corregir en el sprint actual · **P2** = deuda técnica planificable.

---

## 1. Seguridad

### P0-1 · Clave privada de cuenta de servicio publicada

`src/main/java/com/compraya/backend/config/controller/model/repository/service/firebase-service-account.json` contiene la clave privada RSA completa (`private_key`, `private_key_id`) del proyecto `marketplace-2005`, versionada en un repositorio público de GitHub.

Impacto: control administrativo total del proyecto Firebase — lectura y escritura de toda la base de datos ignorando las reglas, emisión de tokens de cualquier usuario, acceso al bucket de Storage y consumo facturable ilimitado.

Acción, en este orden:

1. Revocar la clave en la consola de Google Cloud (IAM → Cuentas de servicio → Claves) y auditar los registros de acceso de las últimas semanas.
2. Eliminar el fichero del árbol de trabajo (hecho en esta rama).
3. Purgar el histórico con `git filter-repo` y forzar la reescritura del remoto.

Eliminar el fichero del commit actual **no** lo retira del histórico ni de los forks o cachés de GitHub. La clave debe considerarse comprometida de forma definitiva.

### P0-2 · La regla comodín anula todas las reglas de Firestore

`firestore.rules:110`

```
match /{document=**} {
  allow read: if true;
  allow write: if isSignedIn();
}
```

Firestore concede el acceso si **alguna** regla coincide. Esta regla final concede lectura pública y escritura a cualquier usuario autenticado sobre toda la base de datos, dejando sin efecto los bloques específicos escritos más arriba.

### P0-3 · Escalada de privilegios a superadmin

`users/{uid}` permite `update` al propio dueño sin restringir qué campos cambia, y `isSuperAdmin()` se resuelve leyendo `role` de ese mismo documento. Cualquier usuario registrado puede escribir `role: "superadmin"` en su propio documento y obtener control del panel maestro. El rol debe vivir en *custom claims* de Auth, no en un documento que el propio usuario puede editar.

### P0-4 · El modelo de datos y las reglas no coinciden

El código cliente usa `usuarios` (27 referencias) mientras las reglas protegen `users`. La colección `usuarios` no tiene ninguna regla: cae en el comodín y queda **legible por cualquiera** (correos, teléfonos, direcciones) y **escribible por cualquier usuario autenticado**. El mismo desajuste existe en `Producto` vs `productos`, `resenas` vs la subcolección `reviews`, y `pagos` vs `transacciones`.

Colecciones en uso sin regla propia: `usuarios`, `Producto`, `comunidades`, `chats`, `carritos`, `ai_chats`, `resenas`, `seguidores`, `reportes`, `pagos`, `mail`, `emailQueue`, `email_campaigns`, `cy_analytics`, `broadcasts`, `codigosPremium`, `presencia`, `likes`.

### P0-5 · Panel de administración servido como fichero estático

`public/1234.html` (210 KB) se publica en Hosting. El *rewrite* de `firebase.json` hacia la función `adminAccess` nunca se aplica, porque Hosting sirve el fichero existente antes de evaluar el rewrite — la función es código muerto que además responde `200 OK` a cualquiera.

El control de acceso es íntegramente de cliente: un UID incrustado (`ADMIN_UID = "zK56tNKi1mNqliuLSeQ8UeXZ2tO2"`) y una comparación `val === PASS` en JavaScript. Cualquiera puede descargar el fichero, leer la lógica completa de administración y llamar directamente a Firestore; lo único que realmente protege los datos son las reglas, y las reglas están abiertas (P0-2).

`window.deleteById` borra cualquier documento de cualquier colección con esa misma comparación de contraseña en cliente.

### P0-6 · Función `geminiGenerate` sin autenticación ni cuota

`functions/index.js` expone `onRequest` con `cors: true` (cualquier origen), sin verificación de token ni límite por usuario. Un tercero puede automatizar llamadas contra vuestra clave de Gemini y generar factura sin límite. `maxInstances: 10` limita la concurrencia, no el gasto.

### P1-1 · Credencial de base de datos en `application.properties`

`src/main/resources/application.properties` incluye una URI de MongoDB Atlas con contraseña en claro. Rotar esa contraseña aunque el backend esté abandonado — es probable que se reutilice en otros servicios.

### P1-2 · Reglas de Storage sin límites

`storage.rules` permite escritura a cualquier usuario autenticado en `public/`, `servicios/` y `banners/` sin restricción de `contentType` ni de `size`. Un usuario puede subir ejecutables o llenar el bucket. Faltan validaciones del tipo `request.resource.size < 5 * 1024 * 1024 && request.resource.contentType.matches('image/.*')`.

### P1-3 · Superficie de XSS

Alrededor de 380 usos de `innerHTML` inyectan datos de Firestore (títulos de producto, nombres de vendedor, mensajes de chat) sin escapado. Como cualquier usuario autenticado puede escribir en cualquier colección (P0-2), un atacante puede almacenar `<img src=x onerror=...>` en un producto y ejecutarlo en el navegador de cada visitante. Sin CSP: `firebase.json` define `X-Frame-Options`, `X-Content-Type-Options` y `Referrer-Policy`, pero no `Content-Security-Policy`.

---

## 2. Accesibilidad

Medido sobre las 33 páginas de `public/`.

| Comprobación | Estado | Criterio WCAG 2.2 |
|---|---|---|
| `outline: none` sin sustituto | 57 declaraciones, 0 `:focus-visible` | 2.4.7 / 2.4.11 — falla |
| Controles sobre `<div onclick>` | ~300, sin `keydown` ni rol | 2.1.1 / 4.1.2 — falla |
| Etiquetas de formulario | 114 `input` + 29 `select` + 16 `textarea`, solo 22 `label for=` | 1.3.1 / 3.3.2 — falla |
| Regiones en vivo | 1 `aria-live` en toda la aplicación | 4.1.3 — falla |
| Landmarks | 8 `<main>` para 33 páginas, 0 enlaces de salto | 1.3.1 / 2.4.1 — falla |
| Encabezados | 17 `<h1>` para 33 páginas; `index.html` no tiene ninguno | 1.3.1 / 2.4.6 — falla |
| Texto alternativo | 132 `<img>`, ~66 con `alt` | 1.1.1 — falla |
| Agrupación de campos | 0 `<fieldset>` / `<legend>` en pago y pedido | 1.3.1 — falla |

Consecuencias concretas:

- **Navegación por teclado rota de raíz.** Con `outline:none` global y sin `:focus-visible`, quien navega con tabulador no ve dónde está. Es el fallo más barato de corregir y el de mayor impacto.
- **El carrito y el chat son mudos.** Añadir al carrito, recibir un mensaje o disparar un *toast* no se anuncia: un lector de pantalla no recibe nada. Falta una región `aria-live="polite"` única y un `role="alert"` para errores.
- **Formularios sin etiqueta programática.** El `placeholder` desaparece al escribir y no lo expone la API de accesibilidad de forma fiable. Afecta a registro, publicación de producto y pago — el embudo completo de conversión.
- **`<div onclick>` como botón.** No recibe foco, no responde a Enter/Espacio y no se anuncia como control. `index.html:1184` sí lo hace bien (`role="button"`, `tabindex="0"` y manejador `keydown` en `index.html:1606`): es el patrón a replicar en las ~300 restantes.
- **`document.body.innerHTML = ...`** en `auth-guard.js` para el mensaje de acceso denegado destruye el árbol y pierde el foco sin devolverlo a ningún sitio.

La reescritura propuesta en `docs/ARQUITECTURA.md` resuelve la mayoría de estos puntos por construcción, no por revisión manual página a página.

---

## 3. Arquitectura y mantenibilidad

**Duplicación literal.** `public/vendedores.html` y `public/index-vendedor.html` son byte a byte el mismo fichero de 2.796 líneas salvo el salto de línea final. Dos copias de 120 KB que hay que mantener en paralelo. `api.js` en la raíz y `public/js/api.js` han divergido (449 líneas de diferencia) sin que quede claro cuál está vivo.

**Sin capa compartida.** Cada una de las 33 páginas lleva su propio bloque `<style>` con los mismos *design tokens* copiados, y su propio `<script>` inline. `index-comprador.html` son 192 KB en un solo fichero. Cambiar el color de marca o el encabezado son 33 ediciones manuales.

**Tres versiones del SDK de Firebase** conviven: 10.7.1 (24 referencias), 10.14.1 (80) y 12.11.0 (2). El navegador descarga y ejecuta runtimes distintos según la página.

**Paso de build destructivo.** `scripts/obfuscate-client-js.mjs` minifica `public/js/{api,config,ia}.js` **sobrescribiendo el fichero de origen**. Ejecutarlo dos veces destruye el código fuente sin copia. Además hay `.min.js` versionados junto a los `.js`, sin que ningún `<script>` indique cuál se sirve.

**Caché mal configurada.** `firebase.json` marca `**/*.@(js|css)` como `max-age=31536000, immutable` pero los nombres no llevan hash de contenido. Un usuario que ya visitó el sitio se queda con el JavaScript antiguo durante un año.

**Backend Java muerto.** `src/main/java/` contiene una aplicación Spring Boot con `SecurityConfig`, `FirebaseTokenFilter` y controladores, configurada a la vez contra MongoDB (`application.properties`) y PostgreSQL (`application.yml`). No hay `pom.xml` ni `build.gradle` en la raíz que la compile; `demo/` es solo un *wrapper* de Gradle vacío. Nunca se ha construido ni desplegado. `application.properties` incluso contiene una etiqueta `<script src="api.js"></script>` pegada dentro del fichero de propiedades.

**Sin red de seguridad.** No hay tests, ni linter, ni tipos, ni formateo. El único workflow de CI compila el APK de Android; no valida nada del código web.

**Peso del repositorio.** 55 MB, 115 binarios versionados, incluido `app-debug.apk.zip` (4,3 MB, salida de la propia CI) y PNG de hasta 5,6 MB.

Nota importante: las imágenes de la raíz **no son residuo**. Producción las enlaza en caliente desde `raw.githubusercontent.com`. Eso funciona pero no está soportado como CDN: sin control de caché, sin garantía de disponibilidad y sujeto a limitación de tasa. Deben moverse a Storage o a Hosting **antes** de borrarlas del repositorio.

**Trazas de herramientas de IA.** `.agents/skills/` (86 ficheros), `.cursor/settings.json` y `skills-lock.json` estaban versionados. Eliminados en esta rama y añadidos a `.gitignore`.

---

## 4. Prioridad de ejecución

| # | Acción | Prioridad | Estado |
|---|---|---|---|
| 1 | Revocar la cuenta de servicio y purgar el histórico | P0 — hoy | **Pendiente — requiere consola de Google Cloud** |
| 2 | Rotar la contraseña de MongoDB Atlas | P0 — hoy | **Pendiente — requiere consola de Atlas** |
| 3 | Reescribir `firestore.rules` sin comodín | P0 | Hecho — Fase 1 |
| 4 | Mover `role` a *custom claims* de Auth | P0 | Hecho — Fase 1 |
| 5 | Sacar `1234.html` de `public/` y protegerlo en servidor | P0 | Hecho — Fase 1 |
| 6 | Autenticar y limitar `geminiGenerate` | P0 | Hecho — Fase 1 |
| 7 | Límites de tipo y tamaño en `storage.rules` + CSP | P1 | Hecho — Fase 1 |
| 8 | Restaurar el foco visible y etiquetar los formularios | P1 | Pendiente |
| 9 | Migración incremental al stack de `docs/ARQUITECTURA.md` | P2 | Pendiente |

Los puntos 1 y 2 no dependen del código y siguen abiertos: requieren acceso a las consolas de Google Cloud y de MongoDB Atlas. El detalle de lo aplicado y el orden de despliegue están en `docs/DESPLIEGUE-FASE-1.md`.
