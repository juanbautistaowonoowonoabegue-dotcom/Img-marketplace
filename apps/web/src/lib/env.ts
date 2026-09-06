import { z } from "zod";

/**
 * Configuración validada al arrancar.
 *
 * Una variable ausente o mal escrita rompe el build con un mensaje claro, en
 * lugar de producir un `undefined` que aparece tres pantallas más adelante.
 * Ningún secreto entra aquí: lo que lleva el prefijo `NEXT_PUBLIC_` viaja al
 * navegador por definición, y las credenciales de servidor se leen aparte.
 */

const esquemaPublico = z.object({
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1),
});

/**
 * Next sustituye `process.env.NEXT_PUBLIC_*` en tiempo de compilación solo si
 * se accede a la propiedad de forma literal. Por eso el objeto se construye
 * explícitamente y no con un bucle sobre las claves.
 */
export const envPublico = esquemaPublico.parse({
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
});

export type EnvPublico = z.infer<typeof esquemaPublico>;
