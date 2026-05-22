import { bootstrapLayout } from "../components/layout.js";
import { renderServiceCard } from "../components/cards.js";
import { openInquiry, wireInquiryModal } from "../components/inquiry.js";
import { listServices } from "../api/services.js";
import { escapeHtml, renderEmptyState } from "../utils/dom.js";
import { formatCurrency } from "../utils/format.js";
import { showNotice } from "../utils/notifications.js";

await bootstrapLayout();
wireInquiryModal();

let services = [];

async function loadServices() {
  services = await listServices();
  const mount = document.getElementById("services-grid");
  if (!services.length) {
    renderEmptyState(mount, "Services are being updated.");
    return;
  }
  mount.innerHTML = services.map(renderServiceCard).join("");
}

document.getElementById("services-grid").addEventListener("click", (event) => {
  const button = event.target.closest("button");
  const card = event.target.closest("[data-id]");
  if (!button || !card) return;

  const service = services.find((item) => item.id === card.dataset.id);
  if (!service) return;

  if (button.dataset.action === "inquire") {
    openInquiry(service.title);
    return;
  }

  const modal = document.getElementById("service-modal");
  modal.innerHTML = `
    <div class="modal-card">
      <div class="toolbar">
        <h3>${escapeHtml(service.title)}</h3>
        <button class="btn btn-muted" id="close-service-modal" type="button">Close</button>
      </div>
      ${service.image_url ? `<img src="${service.image_url}" alt="${escapeHtml(service.title)}" />` : ""}
      <p>${escapeHtml(service.description)}</p>
      <p class="price">${service.price_from ? `Starts at ${formatCurrency(service.price_from)}` : "Ask for quote"}</p>
      <button class="btn btn-primary" id="service-inquire-modal" type="button">Inquire Now</button>
    </div>
  `;
  modal.classList.add("open");
  document.getElementById("close-service-modal").addEventListener("click", () => modal.classList.remove("open"));
  document.getElementById("service-inquire-modal").addEventListener("click", () => openInquiry(service.title));
});

document.getElementById("service-modal").addEventListener("click", (event) => {
  if (event.target.id === "service-modal") event.target.classList.remove("open");
});

loadServices().catch((error) => showNotice(error.message, "error"));
