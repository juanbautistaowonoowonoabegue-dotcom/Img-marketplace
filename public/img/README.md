# public/img — Recursos gráficos

Las 70 imágenes que estaban sueltas en la raíz del repositorio, con nombre descriptivo y agrupadas por uso.

Están dentro de `public/` a propósito: Firebase Hosting solo sirve lo que hay en esa carpeta. Fuera de ella habría que seguir enlazándolas desde `raw.githubusercontent.com`, que es lo que hacía el sitio y no es un CDN soportado — sin control de caché, sin garantía de disponibilidad y sujeto a limitación de tasa. Ahora se sirven desde el propio dominio, con la cabecera `Cache-Control` de una semana que define `firebase.json`.

## Estructura

| Carpeta | Contenido | Ficheros |
|---|---|---|
| `marca/` | Identidad de Compra Ya: favicons, iconos de PWA, logotipo | 7 |
| `pagos/` | Logotipos de bancos y monederos: Ecobank, CCEI, BANGE, BGFI, Muni Dinero, B-Morï, Rosa Money | 7 |
| `entrega/` | Opciones de entrega: ENA Delivery y recogida en persona | 2 |
| `premium/` | Ilustraciones de los planes premium | 5 |
| `banners/` | Banner de portada y captura para el manifiesto | 2 |
| `aliados/empresas/` | Logotipos de comercios y marcas aliadas | 27 |
| `aliados/instituciones/` | Ministerios, embajadas y organismos | 7 |
| `contenido/categorias/` | Imágenes de las seis categorías de portada | 6 |
| `contenido/` | Fotografía e ilustración suelta | 7 |

## Criterio de nombres

Todo en minúsculas, sin espacios, sin paréntesis y sin acentos. Los nombres anteriores —`logo de y Bluejay Travels (rectangular).png`, `min-educación .png`, `Asonga .png` con espacio final— obligaban a codificar la URL y se rompen con facilidad entre sistemas de ficheros.

Los ficheros que solo tenían un identificador de cámara se han nombrado por lo que son. La identidad de cada uno se dedujo del código que los usaba: los `IMG_41xx` son los logotipos de los métodos de pago de `peninsula-de-pagos.html`, donde cada objeto de banco lleva su enlace a Google Play.

| Antes | Ahora |
|---|---|
| `IMG_4139.jpeg` | `pagos/ecobank.jpeg` |
| `IMG_4140.jpeg` | `pagos/b-mori.jpeg` |
| `IMG_4141.jpeg` | `pagos/muni-dinero.jpeg` |
| `IMG_4142.jpeg` | `pagos/ccei-bank.jpeg` |
| `IMG_4143.jpeg` | `pagos/bgfi-mobile.jpeg` |
| `IMG_4144.jpeg` | `pagos/bange.jpeg` |
| `IMG_4147.jpeg` | `pagos/rosa-money.jpeg` |
| `IMG_4148.jpeg` | `entrega/ena-delivery.jpeg` |
| `89D02180-B718-431D-881D-E45FAC4F01C7.png` | `entrega/recogida-en-persona.png` |
| `IMG_4021.jpeg` | `banners/captura-aplicacion.jpeg` |
| `A.JPG` … `E.JPG` | `premium/plan-a.jpg` … `plan-e.jpg` |
| `1.JPG` … `6.JPG` | `contenido/categorias/categoria-1.jpg` … `-6.jpg` |

## Duplicados retirados

Dos pares eran byte a byte idénticos. Se conservó el que estaba referenciado en el código:

- `fav.PNG` ≡ `favicon.PNG` → se queda `marca/favicon.png`. Eran 3,6 MB **cada uno**.
- `logo_075949.jpeg` ≡ `compra-ya-ofertas-rojo.JPEG` → se queda `marca/oferta-roja.jpeg`.

## Pendiente: optimización

La carpeta pesa **33 MB** y dos ficheros se llevan 9 MB de ellos, ambos por un uso que no lo justifica:

- `entrega/recogida-en-persona.png` — **5,4 MB** para un icono que se muestra a unos 48 px en el carrito.
- `marca/favicon.png` — **3,6 MB** para un favicon.

Como `public/` es el `webDir` de Capacitor, todo esto entra también en el APK. Convertir a WebP y redimensionar a los tamaños de uso reduciría la carpeta en torno a un 90 % sin pérdida visible. No se ha tocado aquí porque reorganizar y recomprimir son dos cambios distintos y conviene poder revisarlos por separado.

De las 70 imágenes, **19 están referenciadas** en el código. Las 51 restantes —sobre todo logotipos de aliados e instituciones— se conservan porque parecen material de catálogo pendiente de uso, no residuo. Antes de borrar ninguna conviene confirmarlo con quien las subió.

## Lo que no se movió

- **`uploads/`** en la raíz. No es material de diseño: es el destino de las subidas de producto que `index-vendedor.html` hace contra la API de GitHub. Las URL de esas imágenes están guardadas en documentos de Firestore; moverlas rompería las fotos de los productos ya publicados, y eso no se arregla desde el repositorio.
- **`android/app/src/main/res/`**. Son recursos de Android con rutas que impone el sistema de build.
