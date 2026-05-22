import { escapeHtml } from "../utils/dom.js";
import { formatCurrency, formatDate, formatStars } from "../utils/format.js";

export function stockBadge(status) {
  const className =
    status === "Available" ? "badge-success" : status === "Limited Stock" ? "badge-warning" : "badge-danger";
  return `<span class="badge ${className}">${escapeHtml(status)}</span>`;
}

export function renderProductCard(product) {
  const image = product.cover_image
    ? `<img src="${product.cover_image}" alt="${escapeHtml(product.name)}" loading="lazy" />`
    : `<div class="card-image-fallback">RW PC</div>`;
  const disabled = product.stock_status === "Out of Stock" ? "disabled" : "";

  return `
    <article class="card product-card" data-id="${product.id}">
      ${image}
      <p class="muted">${escapeHtml(product.categories?.name || product.part_type || "Product")}</p>
      <h4>${escapeHtml(product.name)}</h4>
      <p class="muted">${escapeHtml(product.brand || "")} ${escapeHtml(product.model || "")}</p>
      <div class="stat-row">
        <span class="price">${formatCurrency(product.price)}</span>
        ${stockBadge(product.stock_status)}
      </div>
      <div class="stat-row" style="margin-top:.75rem;">
        <button class="btn btn-primary" data-action="add-cart" ${disabled}>Add to Cart</button>
        <button class="btn btn-muted" data-action="inquire">Inquire Now</button>
        <button class="btn btn-secondary" data-action="details">Details</button>
      </div>
    </article>
  `;
}

export function renderServiceCard(service) {
  return `
    <article class="card service-icon-wrap" data-id="${service.id}">
      <div class="service-floating-icon">${escapeHtml((service.icon || "W").slice(0, 2))}</div>
      ${
        service.image_url
          ? `<img src="${service.image_url}" alt="${escapeHtml(service.title)}" loading="lazy" />`
          : `<div class="card-image-fallback">Service</div>`
      }
      <h4>${escapeHtml(service.title)}</h4>
      <p class="muted">${escapeHtml(service.description)}</p>
      <p class="price">${service.price_from ? `Starts at ${formatCurrency(service.price_from)}` : "Ask for quote"}</p>
      <div class="stat-row">
        <button class="btn btn-primary" data-action="inquire">Inquire Now</button>
        <button class="btn btn-secondary" data-action="details">Details</button>
      </div>
    </article>
  `;
}

export function renderReviewCard(review) {
  return `
    <article class="card">
      ${review.image_url ? `<img src="${review.image_url}" alt="Review proof" loading="lazy" />` : ""}
      <div class="review-stars">${formatStars(review.rating)}</div>
      <p>${escapeHtml(review.message)}</p>
      <p class="muted">${escapeHtml(review.profiles?.full_name || "Customer")} | ${formatDate(review.created_at)}</p>
    </article>
  `;
}
