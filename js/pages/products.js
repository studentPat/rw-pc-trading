import { bootstrapLayout } from "../components/layout.js";
import { renderProductCard } from "../components/cards.js";
import { openInquiry, wireInquiryModal } from "../components/inquiry.js";
import { addToCart } from "../api/cart.js";
import { getProductById, listCategories, listProducts } from "../api/products.js";
import { escapeHtml, renderEmptyState } from "../utils/dom.js";
import { formatCurrency } from "../utils/format.js";
import { showNotice, showToast } from "../utils/notifications.js";

const context = await bootstrapLayout();
wireInquiryModal();

let products = [];

async function initProducts() {
  const categories = await listCategories();
  const categoryFilter = document.getElementById("category-filter");
  categoryFilter.innerHTML += categories
    .map((category) => `<option value="${category.id}">${escapeHtml(category.name)}</option>`)
    .join("");

  document.getElementById("product-search").addEventListener("input", () => loadProducts());
  categoryFilter.addEventListener("change", () => loadProducts());

  await loadProducts();

  const params = new URLSearchParams(window.location.search);
  if (params.get("product")) {
    showProductDetails(params.get("product")).catch((error) => showNotice(error.message, "error"));
  }
}

async function loadProducts() {
  const search = document.getElementById("product-search").value;
  const categoryId = document.getElementById("category-filter").value;
  products = await listProducts({ search, categoryId, limit: 80 });

  const mount = document.getElementById("products-grid");
  if (!products.length) {
    renderEmptyState(mount, "No matching products found.");
    return;
  }
  mount.innerHTML = products.map(renderProductCard).join("");
}

document.getElementById("products-grid").addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  const card = event.target.closest("[data-id]");
  if (!button || !card) return;

  const product = products.find((item) => item.id === card.dataset.id);
  if (!product) return;

  if (button.dataset.action === "inquire") openInquiry(product.name);
  if (button.dataset.action === "details") await showProductDetails(product.id);
  if (button.dataset.action === "add-cart") {
    if (!context?.session?.user) {
      window.location.href = "login.html?next=products.html";
      return;
    }
    try {
      await addToCart(context.session.user.id, product.id, 1);
      showToast("Added to cart.", "success");
    } catch (error) {
      showToast(error.message, "error");
    }
  }
});

async function showProductDetails(productId) {
  const product = await getProductById(productId);
  const modal = document.getElementById("product-modal");
  modal.innerHTML = `
    <div class="modal-card">
      <div class="toolbar">
        <h3>${escapeHtml(product.name)}</h3>
        <button class="btn btn-muted" id="close-product-modal" type="button">Close</button>
      </div>
      <div class="grid grid-2">
        <div>
          ${
            product.cover_image
              ? `<img src="${product.cover_image}" alt="${escapeHtml(product.name)}" />`
              : `<div class="card-image-fallback">RW PC</div>`
          }
        </div>
        <div>
          <p class="price">${formatCurrency(product.price)}</p>
          <p><strong>Brand:</strong> ${escapeHtml(product.brand || "-")}</p>
          <p><strong>Model:</strong> ${escapeHtml(product.model || "-")}</p>
          <p><strong>Warranty:</strong> ${product.warranty_months || 0} month(s)</p>
          <p><strong>Status:</strong> ${escapeHtml(product.stock_status)}</p>
          <p>${escapeHtml(product.description || "")}</p>
          <div class="stat-row">
            <button class="btn btn-primary" id="modal-add-cart" type="button">Add to Cart</button>
            <button class="btn btn-muted" id="modal-inquire" type="button">Inquire Now</button>
          </div>
        </div>
      </div>
    </div>
  `;
  modal.classList.add("open");
  document.getElementById("close-product-modal").addEventListener("click", () => modal.classList.remove("open"));
  document.getElementById("modal-inquire").addEventListener("click", () => openInquiry(product.name));
  document.getElementById("modal-add-cart").addEventListener("click", async () => {
    if (!context?.session?.user) {
      window.location.href = "login.html?next=products.html";
      return;
    }
    await addToCart(context.session.user.id, product.id, 1);
    showToast("Added to cart.", "success");
  });
}

document.getElementById("product-modal").addEventListener("click", (event) => {
  if (event.target.id === "product-modal") event.target.classList.remove("open");
});

initProducts().catch((error) => showNotice(error.message, "error"));
