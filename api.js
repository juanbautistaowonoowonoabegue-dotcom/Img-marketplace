// ================================================
// public/js/api.js - API UNIFICADA PROFESIONAL
// Compra Ya Marketplace - Guinea Ecuatorial
// Versión Abril 2026 - Centralizado y Seguro
// ================================================

import { firebaseConfig, GITHUB_TOKEN, GITHUB_REPO, GITHUB_BRANCH } from './config.js';

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    query, 
    where, 
    orderBy, 
    limit, 
    getDocs, 
    addDoc, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getRemoteConfig, fetchAndActivate, getValue } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-remote-config.js";

// ==================== INICIALIZACIÓN FIREBASE ====================
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const remoteConfig = getRemoteConfig(app);

remoteConfig.settings.minimumFetchIntervalMillis = 3600000;

export { db, auth, remoteConfig };

// ==================== VARIABLES GLOBALES ====================
export let currentUser = null;
export let productosDB = [];
export let carritoDB = [];

// ==================== AUTENTICACIÓN GOOGLE ====================
export const provider = new GoogleAuthProvider();

export function iniciarSesionGoogle() {
    signInWithPopup(auth, provider)
        .then((result) => {
            console.log("✅ Bienvenido:", result.user.displayName);
            window.location.href = "mispublicaciones.html";
        })
        .catch((error) => {
            console.error("❌ Error al iniciar sesión:", error.message);
        });
}

// ==================== COMPRESIÓN DE IMÁGENES ====================
export async function compressImage(file, maxWidth = 900, quality = 0.68) {
    return new Promise((resolve) => {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => { img.src = e.target.result; };

        img.onload = () => {
            const canvas = document.createElement('canvas');
            let { width, height } = img;

            if (width > maxWidth) {
                height = Math.round((maxWidth / width) * height);
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;
            canvas.getContext('2d').drawImage(img, 0, 0, width, height);

            canvas.toBlob((blob) => {
                const newName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
                resolve(new File([blob], newName, { type: "image/webp" }));
            }, "image/webp", quality);
        };

        reader.readAsDataURL(file);
    });
}

// ==================== SUBIR IMAGEN A GITHUB ====================
export async function subirImagenAGitHub(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
            const base64Content = reader.result.split(',')[1];
            const nombreArchivo = `productos/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;

            const urlApi = `https://api.github.com/repos/${GITHUB_REPO}/contents/${nombreArchivo}`;

            try {
                const response = await fetch(urlApi, {
                    method: "PUT",
                    headers: {
                        "Authorization": `token ${GITHUB_TOKEN}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        message: `Upload product image: ${nombreArchivo}`,
                        content: base64Content,
                        branch: GITHUB_BRANCH
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || `GitHub Error: ${response.status}`);
                }

                const rawUrl = `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}/${nombreArchivo}`;
                resolve(rawUrl);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = () => reject(new Error("Error leyendo el archivo"));
        reader.readAsDataURL(file);
    });
}

// ==================== PUBLICAR PRODUCTO ====================
export async function publicarProducto() {
    const btn = document.querySelector('.btn-publicar');
    if (!btn) return;

    const titulo = document.getElementById('titulo')?.value.trim();
    const precio = parseFloat(document.getElementById('precio')?.value);
    const categoria = document.getElementById('categoria')?.value;
    const descripcion = document.getElementById('descripcion')?.value.trim() || "";
    const subcategoria = document.getElementById('subcategoria')?.value || "";
    const archivoSeleccionado = window.archivoSeleccionado; // Debe estar en window

    if (!archivoSeleccionado) return alert("❌ Por favor selecciona una imagen.");
    if (!titulo || !precio || !categoria) return alert("❌ Completa Título, Precio y Categoría.");

    try {
        btn.disabled = true;
        btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Procesando...`;

        const compressedFile = await compressImage(archivoSeleccionado, 900, 0.68);
        const urlImagen = await subirImagenAGitHub(compressedFile);

        await addDoc(collection(db, "Producto"), {
            Título: titulo,
            precio: precio,
            categoria: categoria,
            subcategoria: subcategoria,
            descripcion: descripcion,
            url_imagen: urlImagen,
            estado: "aceptado",
            fechaPublicacion: serverTimestamp(),
            vendedorId: currentUser ? currentUser.uid : "anonimo",
            vendedorNombre: currentUser ? (currentUser.displayName || "Vendedor Local") : "Vendedor Local"
        });

        alert("✅ ¡Producto publicado con éxito!");
        window.location.reload();

    } catch (error) {
        console.error("Error al publicar:", error);
        alert("❌ Error: " + error.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<i class="fas fa-paper-plane"></i> Publicar Producto Gratis`;
    }
}

// ==================== CREAR TARJETA DE PRODUCTO ====================
export function crearTarjeta(producto) {
    const div = document.createElement('div');
    div.className = 'tarjeta-premium';
    div.setAttribute('data-categoria', producto.categoria || 'general');

    const imagenSrc = producto.url_imagen || producto.imagen || 'https://via.placeholder.com/300x200?text=Sin+Imagen';

    div.innerHTML = `
        <div style="position: relative;">
            ${producto.precioAntiguo || producto.esOferta ? `<div class="badge-oferta">OFERTA</div>` : ''}
            <img src="${imagenSrc}" alt="${producto.Título || producto.nombre}" 
                 onclick="verDetalle('${producto.docId}')" style="cursor:pointer; width:100%; height:160px; object-fit:cover;">
        </div>
        <div class="tarjeta-info">
            <div class="tarjeta-titulo">${producto.Título || producto.nombre || 'Sin título'}</div>
            <div class="tarjeta-precio">${Number(producto.precio || 0).toLocaleString()} FCFA</div>
        </div>
    `;
    return div;
}

window.verDetalle = function(id) {
    if (id) window.location.href = `detalledelproducto.html?id=${id}`;
};

// ==================== CARGAR Y FILTRAR PRODUCTOS ====================
export async function cargarProductos() {
    try {
        const q = query(
            collection(db, "Producto"),
            where("estado", "==", "aceptado"),
            orderBy("fechaPublicacion", "desc"),
            limit(120)
        );

        const snapshot = await getDocs(q);
        productosDB = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));

        console.log(`✅ ${productosDB.length} productos cargados`);
        mostrarProductosFiltrados('todos');

    } catch (e) {
        console.error("❌ Error cargando productos:", e);
    }
}

export function mostrarProductosFiltrados(filtro = 'todos') {
    let filtrados = productosDB;

    if (filtro !== "todos") {
        if (filtro === "ofertas") {
            filtrados = productosDB.filter(p => p.precioAntiguo || p.esOferta);
        } else {
            filtrados = productosDB.filter(p => 
                (p.categoria && p.categoria.toLowerCase() === filtro.toLowerCase()) ||
                (p.tipo && p.tipo.toLowerCase() === filtro.toLowerCase())
            );
        }
    }

    // Aquí puedes adaptar los contenedores según tu HTML
    const contenedores = {
        tendencias: document.getElementById('carrusel-tendencias'),
        ofertas: document.getElementById('carrusel-ofertas'),
        iphones: document.getElementById('carrusel-iphones'),
        laptops: document.getElementById('carrusel-laptops')
    };

    Object.values(contenedores).forEach(cont => { if (cont) cont.innerHTML = ''; });

    filtrados.forEach(prod => {
        const tarjeta = crearTarjeta(prod);
        if (contenedores.tendencias) contenedores.tendencias.appendChild(tarjeta.cloneNode(true));
        if (contenedores.ofertas && (prod.precioAntiguo || prod.esOferta)) contenedores.ofertas.appendChild(tarjeta.cloneNode(true));
        if (contenedores.iphones && (prod.categoria === "iphones" || prod.tipo === "iphones")) contenedores.iphones.appendChild(tarjeta.cloneNode(true));
        if (contenedores.laptops && (prod.categoria === "laptops" || prod.tipo === "laptops")) contenedores.laptops.appendChild(tarjeta.cloneNode(true));
    });
}

window.filtrar = function(categoria) {
    document.querySelectorAll('.filtro-item').forEach(btn => btn.classList.remove('active'));
    mostrarProductosFiltrados(categoria);
};

// ==================== CARRITO ====================
export function agregarAlCarrito(producto) {
    const existe = carritoDB.find(item => item.docId === producto.docId);
    if (existe) existe.cantidad++;
    else carritoDB.push({ ...producto, cantidad: 1 });

    localStorage.setItem('carrito', JSON.stringify(carritoDB));
    alert(`${producto.Título || producto.nombre} añadido al carrito`);
}

// ==================== INICIALIZACIÓN ====================
async function inicializarApp() {
    console.log("%c🚀 API.js cargado - Compra Ya Marketplace", "color:#00f5ff; font-size:1.1rem; font-weight:bold");

    onAuthStateChanged(auth, (user) => {
        currentUser = user;
    });

    await cargarProductos();

    // Cargar carrito desde localStorage
    const carritoGuardado = localStorage.getItem('carrito');
    if (carritoGuardado) carritoDB = JSON.parse(carritoGuardado);
}

document.addEventListener('DOMContentLoaded', inicializarApp);