// ═══════════════════════════════════════════════════════
//  CompraYa · home-ui.js
//  Registra SW, captura beforeinstallprompt, animaciones
// ═══════════════════════════════════════════════════════
‘use strict’;

/* ══════════════════════════════════════

1. LOADER — ocultar cuando la página
   esté lista (lo llama también Firebase)
   ══════════════════════════════════════ */
   window.hideInitialLoader = function () {
   const loader = document.getElementById(‘loader’);
   if (!loader || loader._hidden) return;
   loader._hidden = true;
   loader.style.transition = ‘opacity .45s ease’;
   loader.style.opacity    = ‘0’;
   setTimeout(() => loader.remove(), 500);
   };

// Fallback: ocultar loader aunque Firebase falle
window.addEventListener(‘load’, () => {
setTimeout(window.hideInitialLoader, 4000); // máximo 4 s de espera
});

/* ══════════════════════════════════════
2. SERVICE WORKER
══════════════════════════════════════ */
if (‘serviceWorker’ in navigator) {
window.addEventListener(‘load’, async () => {
try {
const reg = await navigator.serviceWorker.register(’/service-worker.js’, {
scope: ‘/’,
updateViaCache: ‘none’, // forzar comprobación de actualizaciones siempre
});
console.log(’[PWA] SW registrado ✓’, reg.scope);

```
  // Detectar nueva versión disponible
  reg.addEventListener('updatefound', () => {
    const newSW = reg.installing;
    if (!newSW) return;
    newSW.addEventListener('statechange', () => {
      if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
        showUpdateBanner();
      }
    });
  });
} catch (err) {
  console.warn('[PWA] Error al registrar SW:', err);
}
```

});
}

/* ══════════════════════════════════════
3. PWA INSTALL PROMPT
Capturamos beforeinstallprompt para
mostrarlo con nuestro propio banner.
══════════════════════════════════════ */
let _deferredPrompt = null;

window.addEventListener(‘beforeinstallprompt’, (event) => {
event.preventDefault();          // evitar mini-infobar automático
_deferredPrompt = event;
console.log(’[PWA] Install prompt capturado ✓’);
showInstallBanner();
});

// Ya instalada → limpiar
window.addEventListener(‘appinstalled’, () => {
console.log(’[PWA] App instalada ✓’);
_deferredPrompt = null;
removeInstallBanner();
});

// Si ya corre en standalone (ya estaba instalada)
window.addEventListener(‘load’, () => {
if (isStandalone()) removeInstallBanner();
});

function isStandalone() {
return (
window.matchMedia(’(display-mode: standalone)’).matches ||
window.navigator.standalone === true
);
}

/* ── Función pública para disparar el prompt ── */
window.promptPWAInstall = async function () {
if (!_deferredPrompt) return;
_deferredPrompt.prompt();
const { outcome } = await _deferredPrompt.userChoice;
console.log(’[PWA] Elección del usuario:’, outcome);
_deferredPrompt = null;
removeInstallBanner();
};

/* ── Banner de instalación ── */
function showInstallBanner() {
if (isStandalone() || document.getElementById(‘cy-install-banner’)) return;

const banner = document.createElement(‘div’);
banner.id = ‘cy-install-banner’;
banner.setAttribute(‘role’, ‘dialog’);
banner.setAttribute(‘aria-label’, ‘Instalar CompraYa’);
banner.style.cssText = `position:fixed;bottom:24px;left:50%;transform:translateX(-50%); background:linear-gradient(135deg,#0e1626,#162038); border:1px solid rgba(0,245,255,.25); border-radius:16px;padding:14px 18px; display:flex;align-items:center;gap:12px; z-index:8000;box-shadow:0 8px 32px rgba(0,0,0,.5); max-width:calc(100vw - 32px);width:fit-content; animation:cyBannerIn .4s cubic-bezier(.34,1.56,.64,1); font-family:'DM Sans',sans-serif;`;

// Inyectar keyframes una sola vez
if (!document.getElementById(‘cy-banner-style’)) {
const st = document.createElement(‘style’);
st.id = ‘cy-banner-style’;
st.textContent = `@keyframes cyBannerIn { from{opacity:0;transform:translateX(-50%) translateY(20px)} to  {opacity:1;transform:translateX(-50%) translateY(0)} }`;
document.head.appendChild(st);
}

banner.innerHTML = `<img src="/img/marca/icono-192.png" alt="CompraYa" width="40" height="40" style="border-radius:10px;flex-shrink:0" > <div style="flex:1;min-width:0"> <div style="font-weight:700;font-size:.88rem;color:#e8f0ff;white-space:nowrap">Instala CompraYa</div> <div style="font-size:.72rem;color:rgba(200,215,230,.6);margin-top:2px">Acceso directo desde tu pantalla de inicio</div> </div> <button onclick="window.promptPWAInstall()" style="background:linear-gradient(135deg,#00f5ff,#00d4aa);color:#000; border:none;border-radius:10px;padding:8px 16px; font-weight:700;font-size:.8rem;cursor:pointer;white-space:nowrap;flex-shrink:0" > Instalar </button> <button onclick="document.getElementById('cy-install-banner').remove()" aria-label="Cerrar" style="background:transparent;border:none;color:rgba(200,215,230,.5); cursor:pointer;font-size:1.1rem;padding:2px 4px;flex-shrink:0;line-height:1" >✕</button>`;

document.body.appendChild(banner);
}

function removeInstallBanner() {
document.getElementById(‘cy-install-banner’)?.remove();
}

/* ── Banner de actualización ── */
function showUpdateBanner() {
if (document.getElementById(‘cy-update-banner’)) return;
const bar = document.createElement(‘div’);
bar.id = ‘cy-update-banner’;
bar.style.cssText = `position:fixed;top:0;left:0;right:0;z-index:9000; background:#0e1626;border-bottom:1px solid rgba(0,245,255,.2); padding:10px 16px;display:flex;align-items:center;justify-content:center;gap:10px; font-family:'DM Sans',sans-serif;font-size:.82rem;color:#e8f0ff;`;
bar.innerHTML = `<span>🔄 Nueva versión disponible</span> <button onclick="window.location.reload()" style="background:linear-gradient(135deg,#00f5ff,#00d4aa);color:#000; border:none;border-radius:8px;padding:5px 14px; font-weight:700;font-size:.78rem;cursor:pointer"> Actualizar </button> <button onclick="this.parentElement.remove()" aria-label="Cerrar" style="background:transparent;border:none;color:rgba(200,215,230,.5);cursor:pointer;font-size:1rem">✕</button>`;
document.body.prepend(bar);
}

/* ══════════════════════════════════════
4. SCROLL REVEAL (IntersectionObserver)
══════════════════════════════════════ */
const revealObs = new IntersectionObserver(
(entries) => {
entries.forEach((e) => {
if (e.isIntersecting) {
e.target.classList.add(‘vis’);
revealObs.unobserve(e.target);
}
});
},
{ threshold: 0.1, rootMargin: ‘0px 0px -40px 0px’ }
);

document.querySelectorAll(’.reveal, .reveal-l, .reveal-r’).forEach(
(el) => revealObs.observe(el)
);

/* ══════════════════════════════════════
5. TABS “CÓMO FUNCIONA”
══════════════════════════════════════ */
document.querySelectorAll(’.hiw-tab’).forEach((btn) => {
btn.addEventListener(‘click’, () => {
document.querySelectorAll(’.hiw-tab’).forEach((b) => b.classList.remove(‘active’));
btn.classList.add(‘active’);

```
const role    = btn.dataset.role;
const buyer   = document.getElementById('hiwBuyer');
const seller  = document.getElementById('hiwSeller');

if (role === 'buyer') {
  buyer.classList.add('show');
  seller.classList.remove('show');
} else {
  seller.classList.add('show');
  buyer.classList.remove('show');
}
```

});
});

/* ══════════════════════════════════════
6. TOPBAR — sombra al hacer scroll
══════════════════════════════════════ */
const topbar = document.querySelector(’.topbar’);
if (topbar) {
window.addEventListener(‘scroll’, () => {
topbar.style.boxShadow = window.scrollY > 10
? ‘0 4px 24px rgba(0,0,0,.45)’
: ‘none’;
}, { passive: true });
}