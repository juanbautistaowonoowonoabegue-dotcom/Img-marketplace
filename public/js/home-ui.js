window.hideInitialLoader = function hideInitialLoader() {
  const loader = document.getElementById("loader");
  if (!loader) return;
  loader.remove();
};

(function () {
  const tabs = document.querySelectorAll(".hiw-tab");
  const buyer = document.getElementById("hiwBuyer");
  const seller = document.getElementById("hiwSeller");
  if (!tabs.length || !buyer || !seller) return;

  tabs.forEach((tab) =>
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      if (tab.dataset.role === "buyer") {
        buyer.classList.add("show");
        seller.classList.remove("show");
      } else {
        seller.classList.add("show");
        buyer.classList.remove("show");
      }
    })
  );
})();

(function () {
  if (!("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("vis");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -30px 0px" }
  );
  document
    .querySelectorAll(".reveal,.reveal-l,.reveal-r")
    .forEach((el) => io.observe(el));
})();

(function () {
  if (!("IntersectionObserver" in window)) return;
  function animCount(el, target, suf, dur = 1400) {
    let start = null;
    function step(ts) {
      if (!start) start = ts;
      const p = Math.min((ts - start) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      if (el) el.textContent = Math.floor(e * target) + suf;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  const io = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        animCount(document.getElementById("sUsers"), 1200, "+");
        animCount(document.getElementById("sAds"), 3800, "+", 1600);
        io.disconnect();
      }
    },
    { threshold: 0.4 }
  );
  const g = document.getElementById("statsGrid");
  if (g) io.observe(g);
})();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    if (!window.isSecureContext) {
      console.warn(
        "PWA deshabilitada: Service Worker requiere HTTPS o localhost."
      );
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });
      registration.update().catch(() => {});
    } catch (error) {
      console.warn("Service Worker no se pudo registrar:", error);
    }
  });
}
