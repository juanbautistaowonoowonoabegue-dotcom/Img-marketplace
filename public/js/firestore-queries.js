// Queries centralizadas — Compra Ya (plan Spark, cliente)
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  increment,
  serverTimestamp,
  startAfter
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { app } from "./config.js";

const db = getFirestore(app);

function mapServicio(docSnap) {
  const d = docSnap.data();
  const precio = Number(d.precio ?? 0);
  return {
    id: docSnap.id,
    ...d,
    titulo: d.titulo || d.nombre || "Servicio",
    nombre: d.nombre || d.titulo || "Servicio",
    precio,
    precioFormateado:
      d.precioFormateado ||
      (window.CompraYaUtils
        ? window.CompraYaUtils.formatCurrency(precio, d.moneda || "FCFA")
        : String(precio))
  };
}

export async function fetchServiciosActivos(opts) {
  const options = opts || {};
  const constraints = [where("status", "==", "activo")];

  if (options.categoria) {
    constraints.push(where("categoria", "==", options.categoria));
  }
  if (options.destacado === true) {
    constraints.push(where("destacado", "==", true));
  }

  constraints.push(
    orderBy(
      options.orderField || (options.destacado ? "destacado" : "fechaCreacion"),
      options.orderDir || "desc"
    )
  );
  constraints.push(limit(options.limitCount || 12));

  const snap = await getDocs(query(collection(db, "servicios"), ...constraints));
  return snap.docs.map(mapServicio);
}

export async function fetchServiciosActivosSimple(limitCount) {
  const snap = await getDocs(
    query(
      collection(db, "servicios"),
      where("status", "==", "activo"),
      limit(limitCount || 50)
    )
  );
  const rows = snap.docs.map(mapServicio);
  rows.sort((a, b) => {
    if (a.destacado && !b.destacado) return -1;
    if (!a.destacado && b.destacado) return 1;
    const ta = a.fechaCreacion?.toMillis?.() || 0;
    const tb = b.fechaCreacion?.toMillis?.() || 0;
    return tb - ta;
  });
  return rows;
}

export async function fetchServicioById(id) {
  const snap = await getDoc(doc(db, "servicios", id));
  if (!snap.exists()) return null;
  return mapServicio(snap);
}

export async function incrementServicioViews(id) {
  await updateDoc(doc(db, "servicios", id), {
    views: increment(1)
  });
}

export async function fetchBannersActivos() {
  const snap = await getDocs(
    query(collection(db, "banners"), where("activo", "==", true), limit(20))
  );
  const now = Date.now();
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((b) => {
      const fin = b.fechaFin?.toDate?.();
      return !fin || fin.getTime() >= now;
    })
    .sort((a, b) => (a.orden || 0) - (b.orden || 0));
}

export async function searchServiciosByTitulo(term, max) {
  const q = (term || "").trim();
  if (!q) return [];
  const snap = await getDocs(
    query(
      collection(db, "servicios"),
      where("status", "==", "activo"),
      where("titulo", ">=", q),
      where("titulo", "<=", q + "\uf8ff"),
      limit(max || 20)
    )
  );
  return snap.docs.map(mapServicio);
}

export async function fetchMisServicios(vendedorId) {
  const snap = await getDocs(
    query(collection(db, "servicios"), where("vendedorId", "==", vendedorId))
  );
  return snap.docs.map(mapServicio);
}

export async function fetchPaginated(collectionName, pageSize, lastDoc, filters) {
  const constraints = [];
  (filters || []).forEach((f) => constraints.push(where(f.field, f.op, f.value)));
  constraints.push(limit(pageSize || 20));
  if (lastDoc) constraints.push(startAfter(lastDoc));

  const snap = await getDocs(query(collection(db, collectionName), ...constraints));
  return {
    rows: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
    lastDoc: snap.docs[snap.docs.length - 1] || null
  };
}

export async function createNotificacion(payload) {
  return addDoc(collection(db, "notificaciones"), {
    ...payload,
    leida: false,
    fecha: serverTimestamp()
  });
}

export { db };
