// Límite de llamadas IA — Compra Ya (Bloque 7)
import {
  doc,
  getDoc,
  updateDoc,
  increment
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { db } from "./firestore-queries.js";

export async function handleAICall(currentUser, callbackFn) {
  if (!currentUser?.uid) {
    window.showToast?.("Debes iniciar sesión para usar IA", "error");
    return;
  }

  const userRef = doc(db, "users", currentUser.uid);
  const userDoc = await getDoc(userRef);
  const data = userDoc.exists() ? userDoc.data() : {};
  const aiCalls = data.aiCallsCount || 0;
  const isPremium = data.premium === true;

  if (aiCalls === 0) {
    await callbackFn();
    await updateDoc(userRef, { aiCallsCount: increment(1) });
    return;
  }

  if (aiCalls >= 1 && !isPremium) {
    mostrarModalPremiumIA(currentUser.uid);
    return;
  }

  if (isPremium) {
    await callbackFn();
    await updateDoc(userRef, { aiCallsCount: increment(1) });
  }
}

export function mostrarModalPremiumIA(uid) {
  let modal = document.getElementById("modal-premium-ia");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "modal-premium-ia";
    modal.innerHTML = `
      <div style="position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:13000;display:flex;align-items:center;justify-content:center;padding:20px">
        <div style="max-width:420px;width:100%;background:#fff;border-radius:16px;padding:24px;text-align:center;font-family:Raleway,sans-serif">
          <div style="font-size:2rem">✨</div>
          <h3 style="margin:12px 0 8px;font-family:'Cormorant Garamond',serif">Has usado tu llamada gratuita de IA</h3>
          <p style="color:#5A6478;font-size:.92rem;line-height:1.5">Actualiza a Premium para acceso ilimitado a todas las funciones de IA.</p>
          <div style="display:flex;gap:10px;justify-content:center;margin-top:18px">
            <button id="btnPremiumGo" class="btn-primary btn-accent" type="button">Actualizar a Premium</button>
            <button id="btnPremiumLater" class="btn-outline" type="button">Quizás luego</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelector("#btnPremiumLater").addEventListener("click", () => {
      modal.style.display = "none";
    });
    modal.querySelector("#btnPremiumGo").addEventListener("click", () => {
      window.location.href = "serviciospremium.html";
    });
  }
  modal.style.display = "block";

  if (uid) {
    updateDoc(doc(db, "users", uid), { premiumModalSeen: true }).catch(() => {});
  }
}

window.handleAICall = handleAICall;
window.mostrarModalPremiumIA = mostrarModalPremiumIA;
