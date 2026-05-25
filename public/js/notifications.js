// Notificaciones en tiempo real — Compra Ya
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { db } from "./firestore-queries.js";

export function initNotifications(userId) {
  if (!userId) return () => {};
  const notifBadge = document.getElementById("notif-badge");
  const notifList = document.getElementById("notif-list");
  if (!notifBadge || !notifList) return () => {};

  const q = query(
    collection(db, "notificaciones"),
    where("para", "==", userId),
    where("leida", "==", false),
    orderBy("fecha", "desc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const count = snapshot.size;
      notifBadge.textContent = count > 9 ? "9+" : String(count);
      notifBadge.style.display = count > 0 ? "flex" : "none";

      notifList.innerHTML =
        snapshot.docs
          .map((docSnap) => {
            const n = docSnap.data();
            const icon = window.CompraYaUtils
              ? window.CompraYaUtils.getNotifIcon(n.tipo)
              : "🔔";
            const when = n.fecha?.toDate?.()
              ? window.CompraYaUtils?.formatRelativeTime(n.fecha.toDate())
              : "";
            return `
          <div class="notif-item" onclick="marcarLeida('${docSnap.id}', '${n.pedidoId || ""}')">
            <div class="notif-icon">${icon}</div>
            <div class="notif-body">
              <p>${n.mensaje || ""}</p>
              <span>${when}</span>
            </div>
          </div>`;
          })
          .join("") || '<p class="notif-empty">Sin notificaciones nuevas</p>';
    },
    (err) => {
      console.warn("[Notificaciones]", err.message);
    }
  );
}

window.marcarLeida = async function marcarLeida(notifId, pedidoId) {
  try {
    await updateDoc(doc(db, "notificaciones", notifId), { leida: true });
    if (pedidoId) {
      window.location.href = `detalledelproducto.html?id=${pedidoId}`;
    }
  } catch (e) {
    window.showToast?.("No se pudo marcar la notificación", "error");
  }
};
