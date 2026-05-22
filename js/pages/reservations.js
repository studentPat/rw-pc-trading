import { bootstrapLayout } from "../components/layout.js";
import { listUserReservations, uploadPaymentProof } from "../api/reservations.js";
import { escapeHtml, renderEmptyState, setLoading } from "../utils/dom.js";
import { formatCurrency, formatDate } from "../utils/format.js";
import { showNotice, showToast } from "../utils/notifications.js";

const context = await bootstrapLayout({ requiresAuth: true });
let reservations = [];

function statusClass(status) {
  if (["Approved", "Ready for Pickup", "Claimed"].includes(status)) return "badge-success";
  if (status === "Rejected") return "badge-danger";
  return "badge-warning";
}

async function loadReservations() {
  reservations = await listUserReservations(context.session.user.id);
  const mount = document.getElementById("reservations-list");

  if (!reservations.length) {
    renderEmptyState(mount, "No reservations yet.");
    return;
  }

  mount.innerHTML = reservations
    .map(
      (reservation) => `
        <article class="card" data-id="${reservation.id}">
          <div class="toolbar">
            <div>
              <h4>Reservation ${reservation.id.slice(0, 8)}</h4>
              <p class="muted">${formatDate(reservation.created_at)}</p>
            </div>
            <span class="badge ${statusClass(reservation.status)}">${escapeHtml(reservation.status)}</span>
          </div>
          <p class="price">${formatCurrency(reservation.total_amount)}</p>
          <p><strong>Deposit:</strong> ${formatCurrency(reservation.deposit_amount)}</p>
          <p><strong>Admin Notes:</strong> ${escapeHtml(reservation.admin_notes || "-")}</p>
          <div>
            ${(reservation.reservation_items || [])
              .map(
                (item) =>
                  `<p>${escapeHtml(item.products?.name || "Product")} x ${item.quantity} - ${formatCurrency(item.subtotal)}</p>`
              )
              .join("")}
          </div>
          <div>
            <h5>Payment Proofs</h5>
            ${
              reservation.payment_proofs?.length
                ? reservation.payment_proofs
                    .map(
                      (proof) =>
                        `<p>${escapeHtml(proof.payment_method)} | ${escapeHtml(proof.status)} | ${formatDate(proof.created_at)} <a href="${proof.image_url}" target="_blank" rel="noreferrer">View</a></p>`
                    )
                    .join("")
                : `<p class="muted">No payment proof uploaded yet.</p>`
            }
          </div>
          ${
            ["Pending Deposit", "Rejected"].includes(reservation.status)
              ? `<button class="btn btn-primary" data-action="upload" type="button">Upload Payment Proof</button>`
              : ""
          }
        </article>
      `
    )
    .join("");
}

document.getElementById("reservations-list").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action='upload']");
  const card = event.target.closest("[data-id]");
  if (!button || !card) return;
  openPaymentModal(card.dataset.id);
});

function openPaymentModal(reservationId) {
  const modal = document.getElementById("payment-modal");
  modal.innerHTML = `
    <form class="modal-card" id="payment-form">
      <div class="toolbar">
        <h3>Upload Payment Proof</h3>
        <button class="btn btn-muted" id="close-payment-modal" type="button">Close</button>
      </div>
      <label class="field">
        <span>Payment Method</span>
        <select name="paymentMethod" required>
          <option>GCash</option>
          <option>Maya</option>
          <option>Bank Transfer</option>
          <option>Credit Card</option>
          <option>E-Wallet</option>
        </select>
      </label>
      <label class="field">
        <span>Reference Number</span>
        <input name="referenceNo" />
      </label>
      <label class="field">
        <span>Note</span>
        <textarea name="note"></textarea>
      </label>
      <label class="field">
        <span>Payment Image</span>
        <input type="file" name="proof" accept="image/*" required />
      </label>
      <button class="btn btn-primary" type="submit">Submit Proof</button>
    </form>
  `;
  modal.classList.add("open");
  document.getElementById("close-payment-modal").addEventListener("click", () => modal.classList.remove("open"));
  document.getElementById("payment-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector("button[type='submit']");
    setLoading(button, true, "Uploading...");

    try {
      const formData = new FormData(form);
      await uploadPaymentProof({
        reservationId,
        userId: context.session.user.id,
        file: formData.get("proof"),
        paymentMethod: formData.get("paymentMethod"),
        referenceNo: formData.get("referenceNo"),
        note: formData.get("note")
      });
      modal.classList.remove("open");
      showToast("Payment proof uploaded for verification.", "success");
      await loadReservations();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(button, false);
    }
  });
}

document.getElementById("payment-modal").addEventListener("click", (event) => {
  if (event.target.id === "payment-modal") event.target.classList.remove("open");
});

loadReservations().catch((error) => showNotice(error.message, "error"));
