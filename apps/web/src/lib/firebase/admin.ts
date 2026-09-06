import "server-only";

import { applicationDefault, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

/**
 * SDK de administración. Solo servidor.
 *
 * El import de `server-only` hace que el build falle si alguien lo importa
 * desde un componente de cliente: la credencial no puede llegar al navegador
 * ni por accidente. Es la barrera que faltaba en el proyecto anterior, donde
 * una clave de servicio acabó versionada en el repositorio.
 *
 * Las credenciales salen de las de aplicación por defecto: la cuenta de
 * servicio que App Hosting inyecta en tiempo de ejecución, o
 * GOOGLE_APPLICATION_CREDENTIALS en local. Nunca un fichero en el árbol.
 */

function obtenerApp(): App {
  const existentes = getApps();
  if (existentes.length) return existentes[0]!;
  return initializeApp({ credential: applicationDefault() });
}

export function authAdmin(): Auth {
  return getAuth(obtenerApp());
}

export function firestoreAdmin(): Firestore {
  return getFirestore(obtenerApp());
}

/** Rol autorizado del usuario, leído del claim del token. */
export async function rolDe(idToken: string): Promise<string | null> {
  const decodificado = await authAdmin().verifyIdToken(idToken, true);
  return typeof decodificado.role === "string" ? decodificado.role : null;
}
