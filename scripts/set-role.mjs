#!/usr/bin/env node
//
// Asigna un rol mediante custom claims de Firebase Auth.
//
// Es el arranque del modelo de autorizacion: las reglas de Firestore y de
// Storage leen `request.auth.token.role`, asi que hasta que el primer
// administrador tenga su claim nadie tiene acceso administrativo. A partir de
// ahi, los roles se asignan desde el panel con la funcion `setUserRole`.
//
// Uso:
//   gcloud auth application-default login
//   node scripts/set-role.mjs <uid|correo> superadmin
//   node scripts/set-role.mjs <uid|correo> --quitar
//
// Alternativa sin gcloud, con una clave de servicio que NUNCA se versiona:
//   GOOGLE_APPLICATION_CREDENTIALS=/ruta/segura/clave.json node scripts/set-role.mjs ...

import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const ROLES = ["superadmin", "vendedor", "comprador"];
const [identificador, rolBruto] = process.argv.slice(2);

if (!identificador || !rolBruto) {
  console.error("Uso: node scripts/set-role.mjs <uid|correo> <rol|--quitar>");
  process.exit(1);
}

const quitar = rolBruto === "--quitar";
if (!quitar && !ROLES.includes(rolBruto)) {
  console.error(`Rol no reconocido. Valores admitidos: ${ROLES.join(", ")}, --quitar`);
  process.exit(1);
}

initializeApp({ credential: applicationDefault() });
const auth = getAuth();

try {
  const usuario = identificador.includes("@")
    ? await auth.getUserByEmail(identificador)
    : await auth.getUser(identificador);

  await auth.setCustomUserClaims(usuario.uid, quitar ? {} : { role: rolBruto });

  // Invalida los tokens en circulacion para que el cambio surta efecto de
  // inmediato en vez de esperar a la siguiente renovacion (hasta una hora).
  await auth.revokeRefreshTokens(usuario.uid);

  console.log(
    quitar
      ? `Rol retirado de ${usuario.email || usuario.uid}.`
      : `Rol "${rolBruto}" asignado a ${usuario.email || usuario.uid}.`
  );
  console.log("El usuario debe volver a iniciar sesion.");
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
