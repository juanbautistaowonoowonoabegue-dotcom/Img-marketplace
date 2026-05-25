# COMPRA YA — Configuración post-implementación

## 1) Firestore manual (consola Firebase)

### Usuario superadmin
En `users/{UID}`:
```json
{
  "role": "superadmin",
  "premium": true,
  "aiCallsCount": 0
}
```

### Claves API (solo superadmin)
Colección: `system_config` → documento: `api_keys`
```json
{
  "geminiApiKey": "TU_CLAVE_GEMINI",
  "githubToken": "TU_TOKEN_GITHUB",
  "githubUser": "tu-usuario",
  "githubRepo": "Img-marketplace",
  "githubBranch": "main"
}
```

### Feature flags
Colección: `config` → documento: `features`
```json
{
  "aiEnabled": true,
  "premiumRequired": true,
  "maintenanceMode": false
}
```

## 2) Despliegue

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage,hosting
```

## 3) Rutas nuevas

| Ruta solicitada | Archivo real |
|---|---|
| `serviciosygestiones-detalle.html` | Redirige a `servicio-detalle.html` |
| `metodo-pago.html` | Redirige a carrito/pagos |
| `delivery.html` | Redirige a carrito (#delivery) |
| `banners.html` | Redirige a `1234.html#sec-banners` |
| `servicio-config.html` | Redirige a `config.html?id=` |
| `login.html` | Usar `index.html` |

## 4) Scripts globales incluidos

En páginas principales:
- `/css/styles.css`
- `/js/utils.js`
- `/js/compra-ya-bridge.mjs`

Módulos avanzados:
- `/js/auth-guard.js`
- `/js/firestore-queries.js`
- `/js/config-loader.js`
- `/js/notifications.js`
- `/js/ai-guard.js`
