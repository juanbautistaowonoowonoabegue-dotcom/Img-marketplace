"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

import { envPublico } from "@/lib/env";

/**
 * SDK de cliente. Una sola instancia por pestaña.
 *
 * El código heredado cargaba tres versiones distintas del SDK (10.7.1, 10.14.1
 * y 12.11.0) según la página, y `firebase-init.js` apuntaba además a otro
 * proyecto. Aquí la versión y el proyecto salen del `package.json` y del
 * entorno validado.
 *
 * Solo lectura de catálogo y sesión. Todo lo privilegiado pasa por el servidor:
 * ver `admin.ts`.
 */

const configuracion = {
  apiKey: envPublico.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: envPublico.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: envPublico.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: envPublico.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: envPublico.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: envPublico.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function obtenerApp(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(configuracion);
}

export function obtenerAuth(): Auth {
  return getAuth(obtenerApp());
}

export function obtenerFirestore(): Firestore {
  return getFirestore(obtenerApp());
}
