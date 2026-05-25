import { onRequest } from "firebase-functions/v2/https";
import { initializeApp } from "firebase/app";
import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";

const firebaseConfig = {
  apiKey: "AIzaSyDpC7nL90nEUjooE6tN6lxLVleddzvhKf8",
  authDomain: "compraya-d0760.firebaseapp.com",
  projectId: "compraya-d0760",
  storageBucket: "compraya-d0760.firebasestorage.app",
  messagingSenderId: "741576296960",
  appId: "1:741576296960:web:46714b2a883293bc7d26e5",
  measurementId: "G-FXQZVDH85F"
};
  

const app = initializeApp(firebaseConfig);

const ai = getAI(app, {
  backend: new GoogleAIBackend(),
});

const model = getGenerativeModel(ai, {
  model: "gemini-3-flash-preview",
});

export const generarTexto = onRequest(async (req, res) => {
  try {
    const prompt = req.body.prompt;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    res.json({ respuesta: text });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});