# Compra Ya Architecture Audit

Fecha de auditoria: 2026-09-21
Version de referencia: 0.1.0

## CURRENT ARCHITECTURE

El repositorio contiene tres superficies activas:

- `public/`: aplicacion legacy HTML/CSS/JavaScript publicada actualmente por Firebase Hosting.
- `backend/ts/`: API Express con TypeScript, Firebase Admin y Firestore como acceso principal a productos, usuarios y pagos.
- `frontend/react/`: nueva interfaz React/Vite con rutas de marketplace, empresa y vendedor, aun sin build instalado/verificado en este entorno.
- `backend/python/`: base Django REST inicial y utilidades Python para futuras integraciones.

Firebase Hosting actualmente publica `public/` y reescribe las rutas hacia `public/index.html`. El build de React aun no sustituye ese directorio.

## TARGET ARCHITECTURE

Firebase seguira siendo el origen de verdad de usuarios, productos, vendedores, pedidos, transacciones, configuracion y autenticacion.

React/Vite sera la interfaz principal cuando el build este validado. El frontend consumira APIs y no usara secretos ni SDKs administrativos.

TypeScript/Express mantendra los endpoints de negocio existentes y los adaptadores de pago que ya sirven como compatibilidad.

Django/Python tendra responsabilidades explicitas para integraciones que justifican Python:

- correo transaccional y retail;
- geocodificacion y servicios de Google Maps;
- orquestacion de WhatsApp/Meta cuando exista una cuenta empresarial configurada;
- envio server-side de notificaciones FCM;
- webhooks, tareas programadas, conciliacion y automatizacion.

Supabase queda reservado para Storage de imagenes. No se propone usar Supabase como segunda base de datos comercial.

## RISKS

- React no esta conectado al hosting: `firebase.json` continua sirviendo `public/`.
- Hay dos backends con responsabilidades solapadas. No se debe mover logica a Django sin definir el contrato con TypeScript.
- Los pagos actuales son adaptadores de demostracion: generan referencias locales o URLs de ejemplo y la verificacion devuelve `paid` sin verificar un proveedor real.
- El service worker FCM aparece duplicado en `public/firebase-messaging-sw.js` y `public/js/firebase-messaging-sw.js`.
- La instalacion de `@supabase/supabase-js` fallo y no existe configuracion Supabase comprobada.
- No existe `capacitor.config.json` en la raiz actual, aunque hay estructura Android generada.
- No se puede afirmar disponibilidad comercial de un operador Mobile Money para Guinea Ecuatorial sin credenciales y documentacion del proveedor.

## DUPLICATED LOGIC

- Inicializacion y consumo de Firebase aparecen en varias paginas legacy y scripts.
- Hay mas de un cliente API frontend (`core-api.js` y clientes nuevos).
- FCM tiene dos service workers y el flujo de foreground esta implementado en JavaScript legacy.
- Productos y checkout existen como contratos separados en Express y Django; Django aun usa datos demo en memoria.
- La navegacion se mantiene en enlaces directos a HTML mientras React define otra navegacion.

## SECURITY RISKS

- `firestore.rules` incluye una regla catch-all que permite lectura publica de cualquier documento no capturado. Debe revisarse antes de produccion.
- `firestore.rules` permite crear productos, pedidos y transacciones a cualquier usuario autenticado sin validacion completa de ownership, importes o campos inmutables.
- `storage.rules` permite escritura autenticada amplia en varias rutas y no valida MIME, tamano, propietario ni extension.
- El service worker contiene configuracion Firebase embebida. La configuracion web puede ser publica, pero debe generarse desde configuracion controlada y nunca incluir secretos.
- `backend/python/.env.example` referencia `serviceAccountKey.json`; esa clave no debe estar en el repositorio ni en el frontend.
- CORS de Django parte de localhost y debe restringirse por entorno antes de staging/produccion.
- No hay rate limiting, idempotencia de pagos, validacion de webhooks ni firma documentada.

## LEGACY COMPONENTS

Las paginas principales aun publicadas son `index.html`, `index-comprador.html`, `index-vendedor.html`, `detalledelproducto.html`, `caritodecompras.html`, `perfil-usuario.html`, `perfildelvendedor.html`, `serviciosygestiones.html`, `notificaciones.html`, `metodo-pago.html`, `sobrenosotros.html` y `1234.html`.

No se eliminan en esta auditoria. La migracion debe registrar pagina, funcionalidad, ruta React, dependencias, pruebas y redireccion antes de retirar duplicados.

## FIREBASE COMPONENTS

Presentes:

- Firebase Hosting configurado para `public/`.
- reglas e indices de Firestore;
- reglas de Firebase Storage;
- Firebase Functions en `functions/index.js`;
- Firebase Admin en TypeScript y Python;
- Firebase Cloud Messaging web en los service workers legacy;
- colecciones observadas: `users`, `productos`, `servicios`, `pedidos`, `transacciones`, `notificaciones`, `banners` y otras.

Functions actualmente expone administracion basica y generacion Gemini. No hay funciones comprobadas para correo, Maps, WhatsApp, pagos o push server-side.

## DJANGO COMPONENTS

`backend/python/config/` contiene settings, URLs y WSGI. `backend/python/marketplace/` contiene endpoints demo:

- `GET /api/health/`;
- `GET /api/products/`;
- `POST /api/checkout/`.

No hay modelos Django aprobados. Esta es la decision correcta por ahora: los datos comerciales deben seguir en Firebase y no duplicarse en SQLite.

El comando de verificacion debe ejecutarse desde `backend/python/manage.py`, no desde la raiz.

## SUPABASE COMPONENTS

No se ha verificado proyecto, URL, bucket, politicas, claves ni dominio Supabase. La instalacion de `@supabase/supabase-js` fallo y no se ha agregado como dependencia confirmada.

La integracion futura debe limitarse inicialmente a Storage de imagenes con placeholders en `.env.example` y sin `service_role` en React.

## PAYMENT COMPONENTS

TypeScript define `WalletProvider`, `WalletRequest`, `WalletResponse` y `IntegrationService` con proveedores nominales `stripe`, `paypal`, `mercado-pago`, `paystack` y `local-wallet`.

Esto es una abstraccion inicial, no integraciones productivas. Falta:

- estado asincrono `pending`, `processing`, `paid`, `failed`, `cancelled`, `expired`, `refunded`;
- idempotency key;
- provider reference;
- webhook firmado;
- conciliacion;
- validacion server-side del importe desde Firestore;
- adaptador especifico para Guinea Ecuatorial sin inventar proveedor;
- adaptadores regionales solo despues de verificar disponibilidad comercial.

La verificacion por WhatsApp no debe considerarse verificacion de pago. Meta WhatsApp puede servir para OTP, confirmaciones y comunicacion, pero el estado financiero debe confirmarse mediante el proveedor de pagos y su webhook.

## GOOGLE SERVICES

No hay adaptadores Python comprobados para Gmail/Workspace, Google Maps Platform, geocoding, Places o rutas.

Antes de activar estos servicios se necesitan variables y APIs configuradas en Google Cloud, por ejemplo:

- `GOOGLE_MAPS_API_KEY` o credenciales server-side equivalentes;
- `GOOGLE_APPLICATION_CREDENTIALS` para servicios que lo requieran;
- proveedor de correo y remitente verificado;
- restricciones por API, entorno y dominio.

No se deben inventar claves, project IDs, remitentes ni cuotas.

## META / WHATSAPP

No existe actualmente integracion Meta/WhatsApp en el repositorio.

La implementacion futura debe usar WhatsApp Business Platform/Cloud API con tokens en variables de entorno y webhooks firmados. La verificacion de usuario por OTP y la confirmacion de pago son flujos distintos y deben tener estados y auditoria separados.

## NOTIFICATIONS

FCM web ya solicita permiso, obtiene un token VAPID, guarda el token en `users/{uid}` y muestra un toast en foreground. El service worker muestra notificaciones cuando la PWA esta en background.

Falta:

- envio server-side desde Python o Functions;
- registro por dispositivo y plataforma;
- revocacion/rotacion de tokens;
- canales y prioridades Android;
- categorias y permisos iOS;
- persistencia de eventos de notificacion;
- no registrar secretos en logs.

Para que las notificaciones sean visibles como las de otras apps, la configuracion nativa de Android/iOS y los permisos del sistema son obligatorios; Python solo puede enviar el mensaje y no puede forzar permisos del dispositivo.

## SEO COMPONENTS

El legacy contiene metadatos y archivos de verificacion de Google, pero no se ha validado una estrategia completa de React para canonical, Open Graph, sitemap, robots y JSON-LD por ruta.

La landing institucional necesita `Organization`, `WebSite` y `BreadcrumbList` con datos reales, sin inventar metricas, propietarios, direcciones o partners.

## DEPLOYMENT COMPONENTS

- Firebase Hosting publica `public/`.
- Firebase Functions usa `functions/`.
- Android contiene artefactos Capacitor, pero no se verifico una configuracion raiz `capacitor.config.json`.
- React tiene Vite y debe generar un build reproducible antes de cambiar Hosting.
- Django/Node no deben exponerse directamente a Internet sin HTTPS, reverse proxy, limites y secretos por entorno.

## MIGRATION PLAN

1. Confirmar project ID Firebase, entornos y reglas objetivo.
2. Crear `LEGACY-MIGRATION.md` con rutas y estado de cada pagina.
3. Validar e instalar dependencias React y Django en el entorno real.
4. Completar React para catalogo, detalle, carrito, perfil, servicios, notificaciones, vendedor y empresa.
5. Mantener Firebase como source of truth y conectar Django mediante servicios de lectura/escritura controlados, sin modelos duplicados.
6. Implementar en Python adaptadores separados para correo, Maps, FCM y WhatsApp, todos con placeholders y validacion de configuracion.
7. Diseñar pagos asincronos con adaptadores regionales, webhooks e idempotencia; no declarar pagos reales desde el frontend.
8. Preparar Storage Supabase solo cuando existan URL, bucket y politicas reales.
9. Revisar Firestore/Storage Rules y aplicar seguridad por rol y ownership.
10. Probar en development, staging y production; solo despues cambiar Firebase Hosting al build React.
