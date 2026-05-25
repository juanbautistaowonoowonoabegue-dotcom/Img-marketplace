import {
  getMessaging,
  getToken,
  onMessage,
  isSupported
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const LS_KEY = "compraya_fcm_token";
const PROMPT_KEY = "compraya_push_prompted_once";
const DEFAULT_VAPID_KEY = "BNV-x72JOwbKYObwteVSHcZNwzet4HBw0Nv0-eJTEiAFVfo7Wzlqe-cr5AHYfd2epGJQJAs6NCRPArPpH703RDE";

// Cambiado a un Toast UI elegante dentro de la app para cuando esté en Foreground
function showForegroundNotification(payload) {
  const title = payload?.notification?.title || payload?.data?.title || "Compra Ya";
  const body = payload?.notification?.body || payload?.data?.body || "Tienes una nueva notificación";
  const link = payload?.data?.url || "notificaciones.html";

  // Crear estructura del Toast dinámicamente
  const toast = document.createElement('div');
  toast.className = 'fcm-toast';
  toast.innerHTML = `
    <div class="fcm-toast-icon">🛍️</div>
    <div class="fcm-toast-content">
      <strong>${title}</strong>
      <p>${body}</p>
    </div>
    <button class="fcm-toast-close">✕</button>
  `;

  // Redirección al hacer clic en el Toast
  toast.style.cursor = 'pointer';
  toast.onclick = (e) => {
    if (e.target.className !== 'fcm-toast-close') {
      window.location.href = link;
    }
  };

  // Botón de cerrar
  toast.querySelector('.fcm-toast-close').onclick = (e) => {
    e.stopPropagation();
    toast.remove();
  };

  document.body.appendChild(toast);

  // Auto-eliminar a los 6 segundos
  setTimeout(() => {
    if (toast.parentNode) toast.remove();
  }, 6000);
}

// Guarda o actualiza el token vinculándolo directamente al usuario autenticado
async function saveToken(db, auth, token) {
  const prev = localStorage.getItem(LS_KEY);
  if (prev === token) return;

  localStorage.setItem(LS_KEY, token);

  // Escuchamos el estado de autenticación para asegurar que tenemos el UID del usuario
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Guardar directamente en el documento del usuario en 'users' para que las Cloud Functions lo encuentren rápido
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        fcmToken: token,
        platform: "web-pwa",
        userAgent: navigator.userAgent,
        updatedAt: serverTimestamp()
      }, { merge: true }); // 'merge: true' evita borrar los campos previos del usuario (como nombre o rol)
      console.log("[FCM] Token sincronizado en el perfil del usuario.");
    }
  });
}

export async function initPushMessaging({ app, vapidKey = DEFAULT_VAPID_KEY }) {
  if (!app || !window.isSecureContext || !("serviceWorker" in navigator)) return;
  if (!(await isSupported())) return;

  try {
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    const messaging = getMessaging(app);
    const auth = getAuth(app);
    const db = getFirestore(app);

    if (Notification.permission === "default" && !localStorage.getItem(PROMPT_KEY)) {
      localStorage.setItem(PROMPT_KEY, "1");
      await Notification.requestPermission();
    }

    if (Notification.permission === "granted") {
      const token = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration
      });
      if (token) {
        await saveToken(db, auth, token);
      }
    }

    onMessage(messaging, (payload) => {
      console.log("[FCM] Mensaje en foreground:", payload);
      showForegroundNotification(payload);
    });

  } catch (error) {
    console.warn("[FCM] Error al inicializar el servicio de mensajería:", error.message);
  }
}