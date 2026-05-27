const { onRequest, onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const { defineSecret } = require("firebase-functions/params");
const fetch = require("node-fetch");

const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");

setGlobalOptions({ maxInstances: 10 });
exports.adminAccess = onRequest(
  { cors: true },
  async (req, res) => {
    // tu lógica aquí
    res.status(200).send("OK");
  }
);
// ─── Endpoint principal para generar contenido con Gemini ───
exports.geminiGenerate = onRequest(
  { secrets: [GEMINI_API_KEY], cors: true },
  async (req, res) => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { prompt, imageBase64, mimeType, model } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "prompt requerido" });
    }

    const GEMINI_MODEL = model || "gemini-2.0-flash";
    const apiKey = GEMINI_API_KEY.value();

    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY no configurada en Secrets" });
    }

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

    const parts = [{ text: prompt }];
    if (imageBase64 && mimeType) {
      const base64Data = imageBase64.includes(",")
        ? imageBase64.split(",")[1]
        : imageBase64;
      parts.push({ inlineData: { mimeType, data: base64Data } });
    }

    try {
      const geminiRes = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts }],
          generationConfig: { maxOutputTokens: 1024, temperature: 0.7 }
        })
      });

      const data = await geminiRes.json();

      if (!geminiRes.ok) {
        console.error("[geminiGenerate] Error Gemini API:", data);
        return res.status(502).json({
          error: data?.error?.message || "Error en Gemini API",
          raw: data
        });
      }

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        return res.status(502).json({ error: "Respuesta vacía de Gemini", raw: data });
      }

      return res.status(200).json({ text });

    } catch (e) {
      console.error("[geminiGenerate] Exception:", e);
      return res.status(500).json({ error: e.message });
    }
  }
);