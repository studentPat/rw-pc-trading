export function qs(selector, parent = document) {
  return parent.querySelector(selector);
}

export function qsa(selector, parent = document) {
  return [...parent.querySelectorAll(selector)];
}

export function escapeHtml(text = "") {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function setLoading(element, isLoading, fallbackText = "Loading...") {
  if (!element) return;
  if (isLoading) {
    element.dataset.originalText = element.textContent;
    element.disabled = true;
    element.textContent = fallbackText;
  } else {
    element.disabled = false;
    if (element.dataset.originalText) {
      element.textContent = element.dataset.originalText;
    }
  }
}

export function renderEmptyState(container, message = "No records found.") {
  if (!container) return;
  container.innerHTML = `<div class="notice info">${escapeHtml(message)}</div>`;
}

export function debounce(fn, delay = 320) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function getFileName(file = {}) {
  return `${Date.now()}-${(file.name || "upload").replaceAll(/\s+/g, "-").toLowerCase()}`;
}