const { onRequest, onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const { defineSecret } = require("firebase-functions/params");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { readFile } = require("node:fs/promises");
const path = require("node:path");

initializeApp();

const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");

setGlobalOptions({ maxInstances: 10 });

// Origenes autorizados. `cors: true` aceptaba cualquiera, lo que permitia a un
// tercero consumir la cuota de Gemini desde su propio sitio.
const ALLOWED_ORIGINS = [
  "https://compra-ya-guinea.web.app",
  "https://compraya-d0760.web.app",
  "https://compraya-d0760.firebaseapp.com",
  "http://localhost:5000",
  "http://localhost:5173"
];

const ADMIN_ROLE = "superadmin";
const SESSION_COOKIE = "__session";
const SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000;

// Cuota diaria de llamadas al modelo por usuario.
const AI_DAILY_LIMIT_FREE = 20;
const AI_DAILY_LIMIT_PREMIUM = 200;

function applyCors(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
    res.set("Vary", "Origin");
    res.set("Access-Control-Allow-Credentials", "true");
  }
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

async function requireUser(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    const error = new Error("Falta el token de sesion");
    error.status = 401;
    throw error;
  }
  try {
    return await getAuth().verifyIdToken(header.slice(7));
  } catch (_) {
    const error = new Error("Token invalido o caducado");
    error.status = 401;
    throw error;
  }
}

function readCookie(req, name) {
  const raw = req.headers.cookie;
  if (!raw) return null;
  for (const part of raw.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

// ─── Consumo de cuota diaria, atomico ───
async function consumeAIQuota(uid, isPremium) {
  const limit = isPremium ? AI_DAILY_LIMIT_PREMIUM : AI_DAILY_LIMIT_FREE;
  const today = new Date().toISOString().slice(0, 10);
  const ref = getFirestore().doc(`ai_usage/${uid}`);

  return getFirestore().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.exists ? snap.data() : {};
    const used = data.dia === today ? data.llamadas || 0 : 0;

    if (used >= limit) return { allowed: false, used, limit };

    tx.set(
      ref,
      { dia: today, llamadas: used + 1, actualizadoEn: FieldValue.serverTimestamp() },
      { merge: true }
    );
    return { allowed: true, used: used + 1, limit };
  });
}

// ─── Generacion de contenido con Gemini ───
// Requiere sesion, aplica cuota por usuario y limita el origen.
exports.geminiGenerate = onRequest(
  { secrets: [GEMINI_API_KEY], cors: false },
  async (req, res) => {
    applyCors(req, res);
    if (req.method === "OPTIONS") return res.status(204).send("");
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Metodo no permitido" });
    }

    let user;
    try {
      user = await requireUser(req);
    } catch (e) {
      return res.status(e.status || 401).json({ error: e.message });
    }

    const { prompt, imageBase64, mimeType, model } = req.body || {};
    if (typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ error: "prompt requerido" });
    }
    if (prompt.length > 8000) {
      return res.status(413).json({ error: "prompt demasiado largo" });
    }

    const quota = await consumeAIQuota(user.uid, user.premium === true || user.role === ADMIN_ROLE);
    if (!quota.allowed) {
      return res.status(429).json({
        error: `Limite diario alcanzado (${quota.limit} llamadas)`,
        limite: quota.limit
      });
    }

    const geminiModel = typeof model === "string" && /^[\w.-]+$/.test(model)
      ? model
      : "gemini-2.0-flash";
    const apiKey = GEMINI_API_KEY.value();
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY no configurada" });
    }

    const parts = [{ text: prompt }];
    if (imageBase64 && mimeType) {
      const base64Data = imageBase64.includes(",")
        ? imageBase64.split(",")[1]
        : imageBase64;
      parts.push({ inlineData: { mimeType, data: base64Data } });
    }

    try {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey
          },
          body: JSON.stringify({
            contents: [{ role: "user", parts }],
            generationConfig: { maxOutputTokens: 1024, temperature: 0.7 }
          })
        }
      );

      const data = await geminiRes.json();

      if (!geminiRes.ok) {
        console.error("[geminiGenerate] error de la API", { status: geminiRes.status });
        // No se devuelve `raw`: puede contener detalles de la clave o del proyecto.
        return res.status(502).json({ error: "El servicio de generacion no respondio correctamente" });
      }

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        return res.status(502).json({ error: "Respuesta vacia del modelo" });
      }

      return res.status(200).json({ text, restantes: quota.limit - quota.used });
    } catch (e) {
      console.error("[geminiGenerate] excepcion", e);
      return res.status(500).json({ error: "Error interno" });
    }
  }
);

// ─── Asignacion de rol mediante custom claims ───
// El rol deja de vivir en un documento que el propio usuario puede editar.
exports.setUserRole = onCall(async (request) => {
  if (request.auth?.token?.role !== ADMIN_ROLE) {
    throw new HttpsError("permission-denied", "Solo administracion puede asignar roles");
  }

  const { uid, role } = request.data || {};
  if (typeof uid !== "string" || !uid) {
    throw new HttpsError("invalid-argument", "uid requerido");
  }
  if (!["superadmin", "vendedor", "comprador", null].includes(role)) {
    throw new HttpsError("invalid-argument", "rol no reconocido");
  }
  if (uid === request.auth.uid && role !== ADMIN_ROLE) {
    throw new HttpsError("failed-precondition", "No puedes retirarte tu propio rol de administracion");
  }

  const claims = role ? { role } : {};
  await getAuth().setCustomUserClaims(uid, claims);
  await getFirestore().doc(`usuarios/${uid}`).set(
    { role: role || null, rolActualizadoEn: FieldValue.serverTimestamp() },
    { merge: true }
  );

  return { ok: true, uid, role: role || null };
});

// ─── Sesion del panel de administracion ───
// Intercambia un token de identidad por una cookie de sesion. Hosting solo
// reenvia la cookie `__session`, por eso ese nombre.
exports.adminSession = onRequest(async (req, res) => {
  applyCors(req, res);
  if (req.method === "OPTIONS") return res.status(204).send("");

  if (req.method === "DELETE") {
    res.set("Set-Cookie", `${SESSION_COOKIE}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Strict`);
    return res.status(200).json({ ok: true });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo no permitido" });
  }

  let user;
  try {
    user = await requireUser(req);
  } catch (e) {
    return res.status(e.status || 401).json({ error: e.message });
  }

  if (user.role !== ADMIN_ROLE) {
    console.warn("[adminSession] acceso denegado", { uid: user.uid });
    return res.status(403).json({ error: "Acceso denegado" });
  }

  const cookie = await getAuth().createSessionCookie(
    req.headers.authorization.slice(7),
    { expiresIn: SESSION_MAX_AGE_MS }
  );

  res.set(
    "Set-Cookie",
    `${SESSION_COOKIE}=${cookie}; Max-Age=${SESSION_MAX_AGE_MS / 1000}; Path=/; HttpOnly; Secure; SameSite=Strict`
  );
  return res.status(200).json({ ok: true });
});

// ─── Panel de administracion ───
// El HTML ya no vive en public/: Hosting lo servia como fichero estatico a
// cualquiera y el rewrite hacia esta funcion nunca llegaba a evaluarse.
let panelCache = null;
let gateCache = null;

async function loadAsset(name, cache) {
  if (cache) return cache;
  return readFile(path.join(__dirname, "admin", name), "utf8");
}

exports.adminAccess = onRequest(async (req, res) => {
  res.set("Cache-Control", "no-store");
  res.set("X-Robots-Tag", "noindex, nofollow");

  const cookie = readCookie(req, SESSION_COOKIE);
  if (cookie) {
    try {
      const claims = await getAuth().verifySessionCookie(cookie, true);
      if (claims.role === ADMIN_ROLE) {
        panelCache = await loadAsset("panel.html", panelCache);
        res.set("Content-Type", "text/html; charset=utf-8");
        return res.status(200).send(panelCache);
      }
    } catch (_) {
      // Cookie caducada o revocada: se cae a la pantalla de acceso.
    }
  }

  gateCache = await loadAsset("gate.html", gateCache);
  res.set("Content-Type", "text/html; charset=utf-8");
  return res.status(401).send(gateCache);
});
