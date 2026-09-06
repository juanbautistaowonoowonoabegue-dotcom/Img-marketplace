import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { app, API_BASE, GEMINI_MODEL } from "./config.js";

const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth, GEMINI_MODEL };

async function gemini(prompt, imageBase64 = null, mimeType = null) {
  // El endpoint exige sesion: sin token devuelve 401 y no consume cuota.
  const usuario = auth.currentUser;
  if (!usuario) throw new Error("Inicia sesion para usar las funciones de IA");
  const token = await usuario.getIdToken();

  const response = await fetch(`${API_BASE}/gemini/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      prompt,
      imageBase64,
      mimeType,
      model: GEMINI_MODEL
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Gemini error: ${response.status}`);
  }

  const text = data.text || data?.raw?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Respuesta vacia de Gemini");
  return text;
}

function parseGeminiJSON(text) {
  try {
    const clean = text.replace(/```json|```/g, "").trim();
    const match = clean.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    return match ? JSON.parse(match[0]) : null;
  } catch (e) {
    console.warn("[IA] Error parseando JSON:", e);
    return null;
  }
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Error leyendo archivo"));
    reader.readAsDataURL(file);
  });
}
window.fileToBase64 = fileToBase64;

export async function editarImagenesIA(selectedFiles) {
  if (!selectedFiles || selectedFiles.length === 0) throw new Error("Sube al menos una foto");
  const imageBase64 = await fileToBase64(selectedFiles[0]);
  const mimeType = selectedFiles[0].type;
  const raw = await gemini(
    "Da 4 consejos concretos y breves para mejorar esta foto de producto y vender mas en Guinea Ecuatorial. Responde SOLO con un array JSON de strings.",
    imageBase64,
    mimeType
  );
  return parseGeminiJSON(raw) || ["Mejora la iluminacion", "Usa un fondo neutro", "Muestra varios angulos", "Limpia el producto"];
}
window.editarImagenesIA = editarImagenesIA;

export async function recomendarPrecioIA(titulo = "", categoria = "", selectedFiles = []) {
  let imageBase64 = null;
  let mimeType = null;
  if (selectedFiles.length > 0) {
    imageBase64 = await fileToBase64(selectedFiles[0]);
    mimeType = selectedFiles[0].type;
  }
  const prompt = `Precio recomendado en FCFA para "${titulo}" en ${categoria}. Responde SOLO JSON: {"precio": numero, "razon": "texto corto"}`;
  const raw = await gemini(prompt, imageBase64, mimeType);
  return parseGeminiJSON(raw);
}
window.recomendarPrecioIA = recomendarPrecioIA;

export async function generarDescripcionIA(titulo, categoria, estado, precio, selectedFiles = []) {
  let imageBase64 = null;
  let mimeType = null;
  if (selectedFiles.length > 0) {
    imageBase64 = await fileToBase64(selectedFiles[0]);
    mimeType = selectedFiles[0].type;
  }
  const prompt = `Crea una descripcion persuasiva para: ${titulo}. Cat: ${categoria}, Estado: ${estado}, Precio: ${precio} FCFA. Para compradores en Malabo y Bata. Max 900 caracteres.`;
  return gemini(prompt, imageBase64, mimeType);
}
window.generarDescripcionIA = generarDescripcionIA;

export const IAWidget = {
  init() {
    console.log("IA Widget inicializado");
  }
};

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => IAWidget.init());
}