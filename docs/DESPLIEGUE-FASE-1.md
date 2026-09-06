# Fase 1 — Despliegue y verificación

Cierre de los P0 de `docs/AUDITORIA.md` sobre el código actual, sin migrar todavía.

**El orden importa.** Las reglas nuevas leen el rol desde los *custom claims* del token. Si se despliegan antes de asignar el claim, nadie tendrá acceso administrativo y el panel quedará inaccesible.

---

## Qué cambia

| Área | Antes | Ahora |
|---|---|---|
| `firestore.rules` | Comodín final con lectura pública y escritura para cualquier autenticado | 24 colecciones declaradas, sin comodín. Lo no declarado se deniega |
| Rol | Campo `role` en el documento que el propio usuario edita | Custom claim `request.auth.token.role`, solo escribible por `setUserRole` |
| `storage.rules` | 4 rutas declaradas, sin límite de tamaño ni tipo | 9 rutas reales, imagen y menos de 5 MB |
| Panel admin | `public/1234.html`, servido a cualquiera, control en cliente | `functions/admin/panel.html`, tras cookie de sesión y claim |
| `geminiGenerate` | `cors: true`, sin autenticación | Origen restringido, token obligatorio, cuota diaria por usuario |
| Cabeceras | Sin CSP; JS cacheado 1 año sin hash | CSP, Permissions-Policy, COOP; JS con revalidación horaria |

---

## Orden de despliegue

### 1. Asignar el claim de administración

```bash
gcloud auth application-default login
node scripts/set-role.mjs comprayasedeenmalabo@gmail.com superadmin
```

El script revoca los tokens en circulación, así que el administrador debe volver a iniciar sesión. Verificar antes de continuar:

```bash
node -e "const{initializeApp,applicationDefault}=require('firebase-admin/app');const{getAuth}=require('firebase-admin/auth');initializeApp({credential:applicationDefault()});getAuth().getUserByEmail('comprayasedeenmalabo@gmail.com').then(u=>console.log(u.customClaims))"
```

Debe imprimir `{ role: 'superadmin' }`. Si no, **no sigas**.

### 2. Probar las reglas contra el emulador

```bash
firebase emulators:start --only firestore,storage,hosting,functions
```

Recorrido mínimo antes de tocar producción:

- Sin sesión: la portada, la ficha de producto y la de servicio cargan y listan.
- Sin sesión: `/1234.html` devuelve la pantalla de acceso, no el panel.
- Con sesión de comprador: carrito, pedido, chat y notificaciones funcionan.
- Con sesión de comprador: intentar `updateDoc(doc(db,'usuarios',<otroUid>),{banned:true})` debe fallar.
- Con sesión de comprador: intentar leer `usuarios` con `getDocs(collection(db,'usuarios'))` sin filtro debe funcionar solo si hay sesión, y `system_config` debe fallar.
- Con sesión de vendedor: publicar producto, subir imagen, editar el propio, y **no** poder editar el de otro.
- Con administración: el panel carga y el listado de usuarios responde.

### 3. Desplegar

```bash
firebase deploy --only functions
firebase deploy --only firestore:rules,storage:rules
firebase deploy --only hosting
```

Las funciones primero: `adminSession` y `adminAccess` deben existir antes de que Hosting empiece a enrutar `/1234.html` hacia ellas.

Alternativa recomendada para validar la CSP sin arriesgar producción:

```bash
firebase hosting:channel:deploy fase-1 --expires 7d
```

### 4. Rollback

```bash
git revert <hash>
firebase deploy --only firestore:rules,storage:rules,functions,hosting
```

Las reglas anteriores quedan en el historial de Git y en la consola de Firebase, que conserva las versiones desplegadas.

---

## Riesgos conocidos y decisiones tomadas

**Lectura pública del catálogo.** `productos`, `Producto`, `servicios`, `resenas` y `banners` mantienen `allow read: if true`. No es un descuido: varios listados consultan sin filtrar por estado (`limit(20)`, `where('vendido','==',false)`), y en un `list` de Firestore una condición sobre `resource.data` obliga a que la consulta lleve el filtro equivalente. Restringirlo ahora rompería la portada. Se cierra cuando las consultas se normalicen.

**`usuarios` con `get` público.** Las fichas de vendedor y de producto se ven sin sesión y resuelven el nombre del vendedor. `list` sí queda restringido a usuarios con sesión, que era el vector real: el volcado masivo de correos y teléfonos. La solución definitiva es separar el perfil público del privado en documentos distintos — Fase 3.

**Autoconcesión de premium.** El canje de código sigue escribiéndose desde el cliente: `isPremium`, `premiumExpiry` y `premiumActivadoEn` están en la lista de campos autoeditables. Sin ellos se rompe `serviciospremium.html`. Los campos que usa administración (`premium`, `isVerified`, `banned`, `verifiedAt`) sí quedan cerrados. El canje debe pasar a una función invocable — Fase 2.

**Productos heredados sin `vendedorId`.** Un documento antiguo sin ese campo no podrá editarlo su vendedor, solo administración. Conviene un backfill antes de desplegar:

```js
// Ejecutar una vez con firebase-admin
const snap = await db.collection('productos').where('vendedorId', '==', null).get();
```

**La clave de Gemini sigue llegando al navegador de administración.** `config-loader.js` la lee de `system_config/api_keys` y el panel llama a Google directamente. Ahora solo con el claim, pero lo correcto es enrutar también esas llamadas por `geminiGenerate` — Fase 2.

**CSP con `'unsafe-inline'` en scripts.** Las 33 páginas llevan JavaScript embebido; sin `'unsafe-inline'` no arranca ninguna. La política sí restringe los orígenes de carga, `object-src`, `base-uri`, `form-action` y `connect-src`, que corta la exfiltración. La política estricta con *nonces* llega cuando el JavaScript salga de los HTML — Fase 2.

**`ADMIN_UID` retirado del panel.** Era un bypass: `role === "superadmin" || user.uid === ADMIN_UID`. De paso, el panel importaba `ADMIN_UID` de `config.js`, que no lo exporta — un import nombrado inexistente es un error de enlace de módulo, así que ese `<script type="module">` no llegaba a ejecutarse. Conviene comprobar en el emulador que el panel arranca ahora.

---

## Lo que sigue sin resolverse en esta fase

- Colecciones duplicadas: `usuarios`/`users`, `productos`/`Producto`, `resenas`/`reviews`.
- Los ~380 `innerHTML` sin escapado. La CSP mitiga la exfiltración, no la inyección.
- `window.deleteById` en el panel, protegido por una comparación de contraseña en cliente. Ahora las reglas exigen el claim, así que el borrado ya no depende de esa comparación, pero la función debe salir del cliente.
- Sin tests de reglas. El siguiente paso natural es `@firebase/rules-unit-testing` sobre el emulador, con un caso por colección; es lo que convierte esta fase en algo que no se puede deshacer por accidente.
