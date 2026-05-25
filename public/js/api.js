import { app, API_BASE } from "./config.js";
import { getFirestore, collection, query, where, orderBy, limit, getDocs, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getRemoteConfig } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-remote-config.js";

const db = getFirestore(app);
const auth = getAuth(app);
const remoteConfig = getRemoteConfig(app);
remoteConfig.settings.minimumFetchIntervalMillis = 3600000;

export { db, auth, remoteConfig };
export let currentUser = null;
export let productosDB = [];
export let carritoDB = [];

export const provider = new GoogleAuthProvider();

export function iniciarSesionGoogle() {
  signInWithPopup(auth, provider)
    .then((result) => {
      console.log("Bienvenido:", result.user.displayName);
      window.location.href = "mispublicaciones.html";
    })
    .catch((error) => {
      console.error("Error al iniciar sesion:", error.message);
    });
}

export async function compressImage(file, maxWidth = 900, quality = 0.68) {
  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target.result;
    };

    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((maxWidth / width) * height);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        const newName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
        resolve(new File([blob], newName, { type: "image/webp" }));
      }, "image/webp", quality);
    };

    reader.readAsDataURL(file);
  });
}

export async function subirImagenAGitHub(file) {
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = () => reject(new Error("Error leyendo archivo"));
    reader.readAsDataURL(file);
  });

  const response = await fetch(`${API_BASE}/github/upload-image`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contentBase64: base64,
      filename: file.name,
      folder: "productos"
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.url) {
    throw new Error(data.error || `Error API GitHub: ${response.status}`);
  }
  return data.url;
}

export async function publicarProducto() {
  const btn = document.querySelector(".btn-publicar");
  if (!btn) return;

  const titulo = document.getElementById("titulo")?.value.trim();
  const precio = parseFloat(document.getElementById("precio")?.value);
  const categoria = document.getElementById("categoria")?.value;
  const descripcion = document.getElementById("descripcion")?.value.trim() || "";
  const subcategoria = document.getElementById("subcategoria")?.value || "";
  const archivoSeleccionado = window.archivoSeleccionado;

  if (!archivoSeleccionado) return alert("Selecciona una imagen.");
  if (!titulo || !precio || !categoria) return alert("Completa titulo, precio y categoria.");

  try {
    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Procesando...`;
    const compressedFile = await compressImage(archivoSeleccionado, 900, 0.68);
    const urlImagen = await subirImagenAGitHub(compressedFile);

    await addDoc(collection(db, "Producto"), {
      Título: titulo,
      precio,
      categoria,
      subcategoria,
      descripcion,
      url_imagen: urlImagen,
      estado: "aceptado",
      fechaPublicacion: serverTimestamp(),
      vendedorId: currentUser ? currentUser.uid : "anonimo",
      vendedorNombre: currentUser ? currentUser.displayName || "Vendedor Local" : "Vendedor Local"
    });

    alert("Producto publicado con exito");
    window.location.reload();
  } catch (error) {
    console.error("Error al publicar:", error);
    alert(`Error: ${error.message}`);
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i class="fas fa-paper-plane"></i> Publicar Producto Gratis`;
  }
}

export function crearTarjeta(producto) {
  const div = document.createElement("div");
  div.className = "tarjeta-premium";
  div.setAttribute("data-categoria", producto.categoria || "general");
  const imagenSrc = producto.url_imagen || producto.imagen || "https://via.placeholder.com/300x200?text=Sin+Imagen";
  div.innerHTML = `
    <div style="position: relative;">
      ${producto.precioAntiguo || producto.esOferta ? `<div class="badge-oferta">OFERTA</div>` : ""}
      <img src="${imagenSrc}" alt="${producto.Título || producto.nombre}" onclick="verDetalle('${producto.docId}')" style="cursor:pointer; width:100%; height:160px; object-fit:cover;">
    </div>
    <div class="tarjeta-info">
      <div class="tarjeta-titulo">${producto.Título || producto.nombre || "Sin titulo"}</div>
      <div class="tarjeta-precio">${Number(producto.precio || 0).toLocaleString()} FCFA</div>
    </div>
  `;
  return div;
}

window.verDetalle = function (id) {
  if (id) window.location.href = `detalledelproducto.html?id=${id}`;
};

export async function cargarProductos() {
  try {
    const q = query(collection(db, "Producto"), where("estado", "==", "aceptado"), orderBy("fechaPublicacion", "desc"), limit(120));
    const snapshot = await getDocs(q);
    productosDB = snapshot.docs.map((doc) => ({ docId: doc.id, ...doc.data() }));
    mostrarProductosFiltrados("todos");
  } catch (e) {
    console.error("Error cargando productos:", e);
  }
}

export function mostrarProductosFiltrados(filtro = "todos") {
  let filtrados = productosDB;
  if (filtro !== "todos") {
    if (filtro === "ofertas") filtrados = productosDB.filter((p) => p.precioAntiguo || p.esOferta);
    else filtrados = productosDB.filter((p) => (p.categoria && p.categoria.toLowerCase() === filtro.toLowerCase()) || (p.tipo && p.tipo.toLowerCase() === filtro.toLowerCase()));
  }

  const contenedores = {
    tendencias: document.getElementById("carrusel-tendencias"),
    ofertas: document.getElementById("carrusel-ofertas"),
    iphones: document.getElementById("carrusel-iphones"),
    laptops: document.getElementById("carrusel-laptops")
  };

  Object.values(contenedores).forEach((cont) => {
    if (cont) cont.innerHTML = "";
  });

  filtrados.forEach((prod) => {
    const tarjeta = crearTarjeta(prod);
    if (contenedores.tendencias) contenedores.tendencias.appendChild(tarjeta.cloneNode(true));
    if (contenedores.ofertas && (prod.precioAntiguo || prod.esOferta)) contenedores.ofertas.appendChild(tarjeta.cloneNode(true));
    if (contenedores.iphones && (prod.categoria === "iphones" || prod.tipo === "iphones")) contenedores.iphones.appendChild(tarjeta.cloneNode(true));
    if (contenedores.laptops && (prod.categoria === "laptops" || prod.tipo === "laptops")) contenedores.laptops.appendChild(tarjeta.cloneNode(true));
  });
}

window.filtrar = function (categoria) {
  document.querySelectorAll(".filtro-item").forEach((btn) => btn.classList.remove("active"));
  mostrarProductosFiltrados(categoria);
};

export function agregarAlCarrito(producto) {
  const existe = carritoDB.find((item) => item.docId === producto.docId);
  if (existe) existe.cantidad += 1;
  else carritoDB.push({ ...producto, cantidad: 1 });
  localStorage.setItem("carrito", JSON.stringify(carritoDB));
}

document.addEventListener("DOMContentLoaded", async () => {
  onAuthStateChanged(auth, (user) => {
    currentUser = user;
  });
  await cargarProductos();
  const carritoGuardado = localStorage.getItem("carrito");
  if (carritoGuardado) carritoDB = JSON.parse(carritoGuardado);
});