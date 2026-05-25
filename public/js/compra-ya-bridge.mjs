// Puente global: expone Firebase + utilidades en window.CompraYa
import { app, firebaseConfig } from "./config.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { initSecureConfigWatcher } from "./config-loader.js";

const auth = getAuth(app);
const db = getFirestore(app);

initSecureConfigWatcher();

window.CompraYa = {
  app,
  auth,
  db,
  firebaseConfig
};
