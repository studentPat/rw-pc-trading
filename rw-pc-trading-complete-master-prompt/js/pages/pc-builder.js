import { bootstrapLayout } from "../components/layout.js";
import { PC_PART_TYPES } from "../config.js";
import { addToCart } from "../api/cart.js";
import { evaluateBuildCompatibility, listPcBuilderParts, saveBuild } from "../api/pcbuilder.js";
import { escapeHtml, renderEmptyState } from "../utils/dom.js";
import { formatCurrency } from "../utils/format.js";
import { showNotice, showToast } from "../utils/notifications.js";

const context = await bootstrapLayout();
const selected = new Map();
let parts = [];

async function initBuilder() {
  parts = await listPcBuilderParts();
  renderSlots();
  renderSummary();
}

function renderSlots() {
  const mount = document.getElementById("builder-slots");
  if (!parts.length) {
    renderEmptyState(mount, "No PC builder parts are available yet.");
    return;
  }

  mount.innerHTML = PC_PART_TYPES.map((slot) => {
    const options = parts.filter((part) => part.part_type === slot);
    const selectedPart = selected.get(slot);
    return `
      <article class="pcb-slot" data-slot="${slot}">
        <div class="toolbar">
          <div>
            <h4>${slot}</h4>
            <p class="muted">${selectedPart ? selectedPart.name : "No part selected"}</p>
          </div>
          <select data-action="select-part">
            <option value="">Choose ${slot}</option>
            ${options
              .map(
                (part) =>
                  `<option value="${part.id}" ${selectedPart?.id === part.id ? "selected" : ""}>
                    ${escapeHtml(part.name)} - ${formatCurrency(part.price)}
                  </option>`
              )
              .join("")}
          </select>
        </div>
        ${
          selectedPart
            ? `<p>${formatCurrency(selectedPart.price)} | ${
                selectedPart.stock_quantity > 0 ? "Available" : "Out of Stock"
              } | ${selectedPart.power_draw_watts || 0}W</p>`
            : ""
        }
      </article>
    `;
  }).join("");
}

document.getElementById("builder-slots").addEventListener("change", (event) => {
  const select = event.target.closest("select[data-action='select-part']");
  const slotEl = event.target.closest("[data-slot]");
  if (!select || !slotEl) return;

  const part = parts.find((item) => item.id === select.value);
  if (part) {
    selected.set(slotEl.dataset.slot, part);
  } else {
    selected.delete(slotEl.dataset.slot);
  }

  renderSlots();
  renderSummary();
});

function selectedPartsArray() {
  return [...selected.entries()].map(([slot, product]) => ({ slot, product }));
}

function renderSummary() {
  const selectedParts = selectedPartsArray();
  const report = evaluateBuildCompatibility(selectedParts);
  const total = selectedParts.reduce((sum, item) => sum + Number(item.product.price || 0), 0);

  document.getElementById("build-summary").innerHTML = `
    <p><strong>Total:</strong> ${formatCurrency(total)}</p>
    <p><strong>Estimated Load:</strong> ${report.totalPartWattage}W</p>
    <p><strong>Recommended PSU:</strong> ${report.recommendedPsu}W</p>
    ${
      report.isCompatible
        ? `<div class="notice success">Compatible selections so far.</div>`
        : `<div class="notice error">${report.warnings.map(escapeHtml).join("<br>")}</div>`
    }
  `;

  document.querySelectorAll(".pcb-slot").forEach((slotEl) => {
    slotEl.classList.toggle("compatible", report.isCompatible && selected.has(slotEl.dataset.slot));
    slotEl.classList.toggle("incompatible", !report.isCompatible && selected.has(slotEl.dataset.slot));
  });
}

document.getElementById("save-build-btn").addEventListener("click", async () => {
  if (!context?.session?.user) {
    window.location.href = "login.html?next=pc-builder.html";
    return;
  }

  const selectedParts = selectedPartsArray();
  if (!selectedParts.length) {
    showNotice("Choose at least one part before saving a build.", "info");
    return;
  }

  try {
    const report = evaluateBuildCompatibility(selectedParts);
    await saveBuild(context.session.user.id, document.getElementById("build-name").value, selectedParts, report);
    showToast("Build saved to your profile.", "success");
  } catch (error) {
    showToast(error.message, "error");
  }
});

document.getElementById("add-build-cart-btn").addEventListener("click", async () => {
  if (!context?.session?.user) {
    window.location.href = "login.html?next=pc-builder.html";
    return;
  }

  const selectedParts = selectedPartsArray();
  const report = evaluateBuildCompatibility(selectedParts);
  if (!report.isCompatible) {
    showNotice("Resolve compatibility warnings before adding the build to cart.", "error");
    return;
  }

  try {
    for (const item of selectedParts) {
      await addToCart(context.session.user.id, item.product.id, 1);
    }
    showToast("Compatible build parts added to cart.", "success");
  } catch (error) {
    showToast(error.message, "error");
  }
});

initBuilder().catch((error) => showNotice(error.message, "error"));
