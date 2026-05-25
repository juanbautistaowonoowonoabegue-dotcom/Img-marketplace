// Protección de rutas — Compra Ya
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { app } from "./config.js";

const auth = getAuth(app);
const db = getFirestore(app);

export async function getUserRole(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return "buyer";
  return snap.data().role || "buyer";
}

export function requireAuth(options) {
  const opts = options || {};
  const loginUrl = opts.loginUrl || "index.html";
  const redirectParam = encodeURIComponent(
    window.location.pathname + window.location.search
  );

  return new Promise((resolve, reject) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.href = `${loginUrl}?redirect=${redirectParam}`;
        return reject(new Error("AUTH_REQUIRED"));
      }

      try {
        const role = await getUserRole(user.uid);
        window.CompraYaAuth = { user, role };

        if (opts.roles && !opts.roles.includes(role)) {
          if (opts.deniedHtml) {
            document.body.innerHTML = opts.deniedHtml;
          } else {
            document.body.innerHTML =
              '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:Raleway,sans-serif;padding:24px;text-align:center"><div><h1>Acceso denegado</h1><p>No tienes permisos para ver esta página.</p></div></div>';
          }
          if (opts.logoutOnDenied) await signOut(auth);
          return reject(new Error("ROLE_DENIED"));
        }

        resolve({ user, role });
      } catch (err) {
        reject(err);
      }
    });
  });
}

export function requireSuperAdmin() {
  return requireAuth({
    roles: ["superadmin"],
    logoutOnDenied: true,
    deniedHtml:
      '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0A0E1A;color:#E2ECF8;font-family:Raleway,sans-serif;padding:24px;text-align:center"><div><h1 style="color:#C9A84C">Acceso denegado</h1><p>Solo superadmin puede acceder al panel maestro.</p><a href="index.html" style="color:#00DCFF">Volver al inicio</a></div></div>'
  });
}
