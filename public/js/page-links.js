// Mapa de interconexión de rutas — Compra Ya
window.CompraYaRoutes = {
  home: "index-comprador.html",
  servicios: "serviciosygestiones.html",
  servicioDetalle: (id) =>
    `serviciosygestiones-detalle.html?id=${encodeURIComponent(id)}`,
  pago: (servicioId) =>
    `metodo-pago.html${servicioId ? `?servicioId=${encodeURIComponent(servicioId)}` : ""}`,
  vendedor: "vendedores.html",
  configServicio: (id) =>
    `servicio-config.html${id ? `?id=${encodeURIComponent(id)}` : ""}`,
  admin: "1234.html",
  banners: "banners.html",
  delivery: "delivery.html"
};
