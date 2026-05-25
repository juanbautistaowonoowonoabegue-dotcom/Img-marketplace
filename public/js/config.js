import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { initPushMessaging } from "./messaging.js";

export const firebaseConfig = {
  apiKey: "AIzaSyDpC7nL90nEUjooE6tN6lxLVleddzvhKf8",
  authDomain: "compraya-d0760.firebaseapp.com",
  projectId: "compraya-d0760",
  storageBucket: "compraya-d0760.firebasestorage.app",
  messagingSenderId: "741576296960",
  appId: "1:741576296960:web:46714b2a883293bc7d26e5",
  measurementId: "G-FXQZVDH85F"
};

export const FB = firebaseConfig;
export const API_BASE = "/api";
export const GEMINI_MODEL = "gemini-2.0-flash";
export const VAPID_KEY = "BNV-x72JOwbKYObwteVSHcZNwzet4HBw0Nv0-eJTEiAFVfo7Wzlqe-cr5AHYfd2epGJQJAs6NCRPArPpH703RDE";

// Compat exports to avoid breaking older modules.
export const PASS = "";
export const GEMINI_API_KEY = " ";
export const GEMINI_KEY = " ";
export const GITHUB_TOKEN = "";
export const GITHUB_BRANCH = "main";
export const GITHUB_USER = "";
export const GITHUB_REPO = "";
export const TU_VAPID_KEY_AQUI = VAPID_KEY;
export const geminiApiKey = "";
export const ADMIN_UID = "zK56tNKi1mNqliuLSeQ8UeXZ2tO2";
export const ADMIN_EMAIL = "juanbautistaowonoowonoabegue@gmail.com";
export const APP_NAME = "Compra Ya";
export const APP_VERSION = "3.2.0";

let app;
try {
  app = initializeApp(firebaseConfig);
  console.log("%cFirebase inicializado correctamente", "color:#00ff88; font-weight:bold");
} catch (error) {
  console.error("Error al inicializar Firebase:", error);
  app = { name: "[ERROR]" };
}

export { app };

initPushMessaging({
  app,
  vapidKey: VAPID_KEY
}).catch((err) => {
  console.warn("[FCM] Inicializacion no completada:", err?.message || err);
});