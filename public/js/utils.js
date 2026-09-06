// ⚠️ SECURE ZONE — No agregar console.log() con datos de config en producción
(function (global) {
  const PLACEHOLDER_IMG =
    "/img/marca/favicon.png";

  function formatCurrency(amount, currency) {
    const value = Number(amount) || 0;
    const formatted = new Intl.NumberFormat("es-VE", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
    return `${formatted} ${currency || "FCFA"}`;
  }

  function formatPriceInput(rawValue) {
    const onlyDigits = String(rawValue || "").replace(/\D/g, "");
    if (!onlyDigits) return "";
    return new Intl.NumberFormat("es-VE", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(parseInt(onlyDigits, 10));
  }

  function parsePriceInput(displayValue) {
    const digits = String(displayValue || "").replace(/\./g, "").replace(/,/g, "");
    const n = parseInt(digits, 10);
    return Number.isFinite(n) ? n : 0;
  }

  function formatRelativeTime(date) {
    if (!date) return "";
    const d = date instanceof Date ? date : new Date(date);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Ahora";
    if (mins < 60) return `Hace ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `Hace ${hrs} h`;
    const days = Math.floor(hrs / 24);
    return `Hace ${days} d`;
  }

  function showToast(message, type) {
    let el = document.getElementById("cy-global-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "cy-global-toast";
      el.className = "cy-toast";
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add("show");
    if (type === "error") el.style.background = "#e74c3c";
    else if (type === "success") el.style.background = "#2ecc71";
    else el.style.background = "#0a0e1a";
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove("show"), 3200);
  }

  function showLoading(target, rows) {
    const node =
      typeof target === "string" ? document.querySelector(target) : target;
    if (!node) return;
    const count = rows || 4;
    node.innerHTML = Array.from({ length: count })
      .map(
        () =>
          '<div class="skeleton" style="height:88px;margin-bottom:10px;border-radius:12px"></div>'
      )
      .join("");
  }

  function hideLoading(target) {
    const node =
      typeof target === "string" ? document.querySelector(target) : target;
    if (!node) return;
    node.querySelectorAll(".skeleton").forEach((s) => s.remove());
  }

  function getNotifIcon(type) {
    const map = {
      nuevo_pago: "💳",
      nuevo_pedido: "📦",
      reserva: "📅",
      mensaje: "💬",
      sistema: "⚙️"
    };
    return map[type] || "🔔";
  }

  function exportToCSV(data, filename) {
    if (!Array.isArray(data) || !data.length) {
      showToast("No hay datos para exportar", "error");
      return;
    }
    const csv = [
      Object.keys(data[0]).join(","),
      ...data.map((row) =>
        Object.values(row)
          .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
          .join(",")
      )
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "export.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function getSafeParam(name) {
    const val = new URLSearchParams(window.location.search).get(name);
    if (!val) return null;
    return val
      .replace(/<[^>]*>/g, "")
      .replace(/javascript:/gi, "")
      .replace(/on\w+=/gi, "")
      .trim()
      .substring(0, 200);
  }

  function bindImgFallback(root) {
    const scope = root || document;
    scope.querySelectorAll("img:not([data-fallback-bound])").forEach((img) => {
      img.dataset.fallbackBound = "1";
      img.addEventListener("error", () => {
        if (img.src !== PLACEHOLDER_IMG) img.src = PLACEHOLDER_IMG;
      });
    });
  }

  function bindPriceInput(inputEl, onChange) {
    if (!inputEl) return;
    inputEl.addEventListener("input", () => {
      const real = parsePriceInput(inputEl.value);
      inputEl.value = formatPriceInput(inputEl.value);
      if (typeof onChange === "function") onChange(real, inputEl.value);
    });
  }

  global.CompraYaUtils = {
    PLACEHOLDER_IMG,
    formatCurrency,
    formatPriceInput,
    parsePriceInput,
    formatRelativeTime,
    showToast,
    showLoading,
    hideLoading,
    getNotifIcon,
    exportToCSV,
    getSafeParam,
    bindImgFallback,
    bindPriceInput
  };

  global.formatCurrency = formatCurrency;
  global.exportToCSV = exportToCSV;
  global.showToast = showToast;
})(window);
