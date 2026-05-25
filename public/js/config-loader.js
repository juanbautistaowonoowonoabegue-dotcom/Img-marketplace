// ⚠️ SECURE ZONE — Claves sensibles solo desde Firestore (superadmin)
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { app } from "./config.js";

const db = getFirestore(app);
const auth = getAuth(app);

let secureConfigCache = null;
let secureConfigExpiresAt = 0;

async function isSuperAdmin(user) {
  if (!user) return false;
  const snap = await getDoc(doc(db, "users", user.uid));
  return snap.exists() && snap.data().role === "superadmin";
}

export async function loadSecureConfig(force) {
  const user = auth.currentUser;
  if (!user) return null;
  if (!force && secureConfigCache && Date.now() < secureConfigExpiresAt) {
    return secureConfigCache;
  }

  const allowed = await isSuperAdmin(user);
  if (!allowed) return null;

  const snap = await getDoc(doc(db, "system_config", "api_keys"));
  if (!snap.exists()) return null;

  secureConfigCache = Object.freeze({ ...snap.data() });
  secureConfigExpiresAt = Date.now() + 3600000;
  return secureConfigCache;
}

export function getApiKey(keyName) {
  if (!secureConfigCache) throw new Error("Config not loaded");
  return secureConfigCache[keyName] || null;
}

export function initSecureConfigWatcher() {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      secureConfigCache = null;
      secureConfigExpiresAt = 0;
      return;
    }
    try {
      await loadSecureConfig(true);
    } catch (_) {
      secureConfigCache = null;
    }
  });
}
