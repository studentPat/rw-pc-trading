import { bootstrapLayout } from "../components/layout.js";
import { computeCartTotals, listCartItems, removeCartItem, updateCartQuantity } from "../api/cart.js";
import { createReservationFromCart } from "../api/reservations.js";
import { escapeHtml, renderEmptyState, setLoading } from "../utils/dom.js";
import { formatCurrency } from "../utils/format.js";
import { showNotice, showToast } from "../utils/notifications.js";

const context = await bootstrapLayout({ requiresAuth: true });
const DEPOSIT_RATE = 0.2;
let cartItems = [];

async function loadCart() {
  cartItems = await listCartItems(context.session.user.id);
  const mount = document.getElementById("cart-items");
  if (!cartItems.length) {
    renderEmptyState(mount, "Your cart is empty. Add products before creating a reservation.");
  } else {
    mount.innerHTML = cartItems
      .map(
        (item) => `
          <article class="card" data-id="${item.id}">
            <div class="grid grid-2">
              <div>
                ${
                  item.products.cover_image
                    ? `<img src="${item.products.cover_image}" alt="${escapeHtml(item.products.name)}" />`
                    : `<div class="card-image-fallback">RW PC</div>`
                }
              </div>
              <div>
                <h4>${escapeHtml(item.products.name)}</h4>
                <p class="price">${formatCurrency(item.products.price)}</p>
                <p class="muted">${
                  item.products.stock_quantity > 0 ? "Available for reservation" : "Out of stock"
                }</p>
                <label class="field">
                  <span>Quantity</span>
                  <input type="number" min="1" max="${item.products.stock_quantity}" value="${item.quantity}" data-action="qty" />
                </label>
                <button class="btn btn-danger" data-action="remove" type="button">Remove</button>
              </div>
            </div>
          </article>
        `
      )
      .join("");
  }

  const totals = computeCartTotals(cartItems);
  const requiredDeposit = totals.subtotal * DEPOSIT_RATE;
  document.getElementById("cart-total").textContent = `Cart total: ${formatCurrency(totals.subtotal)} (${totals.itemCount} item/s)`;
  document.getElementById("cart-deposit").textContent = `Required deposit (20%): ${formatCurrency(requiredDeposit)}`;
}

document.getElementById("cart-items").addEventListener("change", async (event) => {
  const input = event.target.closest("[data-action='qty']");
  const card = event.target.closest("[data-id]");
  if (!input || !card) return;

  try {
    await updateCartQuantity(card.dataset.id, Number(input.value));
    await loadCart();
    showToast("Cart updated.", "success");
  } catch (error) {
    showToast(error.message, "error");
    await loadCart();
  }
});

document.getElementById("cart-items").addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action='remove']");
  const card = event.target.closest("[data-id]");
  if (!button || !card) return;

  try {
    await removeCartItem(card.dataset.id);
    await loadCart();
    showToast("Item removed.", "success");
  } catch (error) {
    showToast(error.message, "error");
  }
});

document.getElementById("reservation-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector("button[type='submit']");
  setLoading(button, true, "Submitting...");

  try {
    const formData = new FormData(form);
    await createReservationFromCart(context.session.user.id, {
      notes: formData.get("notes")
    });
    showNotice("Reservation created. Upload your payment proof from the Reservations page.", "success");
    form.reset();
    await loadCart();
    setTimeout(() => {
      window.location.href = "reservations.html";
    }, 900);
  } catch (error) {
    showNotice(error.message, "error");
  } finally {
    setLoading(button, false);
  }
});

loadCart().catch((error) => showNotice(error.message, "error"));
