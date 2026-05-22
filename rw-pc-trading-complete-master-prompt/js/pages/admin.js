import { bootstrapLayout } from "../components/layout.js";
import { ADMIN_SECTIONS, RESERVATION_STATUSES } from "../config.js";
import {
  adjustStock,
  getBusinessSettings,
  getDashboardStats,
  listInventoryLogs,
  listProfiles,
  updateBusinessSettings,
  updateUserRole
} from "../api/admin.js";
import {
  archiveProduct,
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  deleteProductImage,
  getProductById,
  listCategories,
  listProducts,
  restoreProduct,
  updateCategory,
  updateProduct,
  uploadProductImage
} from "../api/products.js";
import { createService, deleteService, listServices, updateService, uploadServiceImage } from "../api/services.js";
import {
  listPaymentProofsForAdmin,
  listReservationsForAdmin,
  reviewPaymentProof,
  updateReservationStatus
} from "../api/reservations.js";
import { deleteReview, listAdminReviews, updateReviewStatus } from "../api/reviews.js";
import { deleteFeedback, listFeedback } from "../api/feedback.js";
import { escapeHtml, renderEmptyState, setLoading } from "../utils/dom.js";
import { formatCurrency, formatDate } from "../utils/format.js";
import { showNotice, showToast } from "../utils/notifications.js";

const context = await bootstrapLayout({ requiresAuth: true, allowedRoles: ["admin", "staff"] });
const content = document.getElementById("admin-content");
const modal = document.getElementById("admin-modal");
let activeSection = new URLSearchParams(window.location.search).get("section") || "dashboard";

function renderSidebar() {
  document.getElementById("admin-sidebar").innerHTML = ADMIN_SECTIONS.map(
    (section) =>
      `<a class="sidebar-link ${section.key === activeSection ? "active" : ""}" href="#${section.key}" data-section="${section.key}">${section.label}</a>`
  ).join("");
}

document.getElementById("admin-sidebar").addEventListener("click", (event) => {
  const link = event.target.closest("[data-section]");
  if (!link) return;
  event.preventDefault();
  activeSection = link.dataset.section;
  window.history.replaceState(null, "", `admin.html?section=${activeSection}`);
  renderAdmin();
});

function openModal(html) {
  modal.innerHTML = `<div class="modal-card">${html}</div>`;
  modal.classList.add("open");
  modal.querySelector("[data-close-modal]")?.addEventListener("click", closeModal);
}

function closeModal() {
  modal.classList.remove("open");
  modal.innerHTML = "";
}

modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});

function renderTable({ title, rows, columns, actions = "", searchPlaceholder = "Search..." }) {
  const tableId = `table-${title.toLowerCase().replaceAll(/\W+/g, "-")}`;
  const serialColumns = columns.map((column) => ({
    key: column.key,
    label: column.label,
    html: Boolean(column.html || column.render)
  }));
  if (!rows.length) {
    return `<div class="section-title"><h3>${title}</h3>${actions}</div><div id="${tableId}">${emptyHtml("No records found.")}</div>`;
  }

  return `
    <div class="section-title">
      <h3>${title}</h3>
      ${actions}
    </div>
    <div class="toolbar card" data-table-tools="${tableId}">
      <div class="left">
        <input placeholder="${searchPlaceholder}" data-table-search />
        <select data-table-page-size>
          <option value="10">10 rows</option>
          <option value="25">25 rows</option>
          <option value="50">50 rows</option>
        </select>
      </div>
      <div class="right"><span class="muted" data-table-count></span></div>
    </div>
    <div class="table-wrap" id="${tableId}" data-table-source='${escapeHtml(JSON.stringify(rows))}' data-columns='${escapeHtml(JSON.stringify(serialColumns))}'></div>
  `;
}

function hydrateTables() {
  document.querySelectorAll("[data-table-source]").forEach((tableMount) => {
    const tools = document.querySelector(`[data-table-tools="${tableMount.id}"]`);
    let rows = JSON.parse(tableMount.dataset.tableSource || "[]");
    const columns = JSON.parse(tableMount.dataset.columns || "[]");
    let state = { query: "", page: 1, pageSize: 10, sortKey: columns[0]?.key || "", sortDir: "asc" };

    const render = () => {
      const filtered = rows.filter((row) => JSON.stringify(row).toLowerCase().includes(state.query.toLowerCase()));
      const sorted = [...filtered].sort((a, b) => {
        const av = String(a[state.sortKey] || "");
        const bv = String(b[state.sortKey] || "");
        return state.sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      });
      const start = (state.page - 1) * state.pageSize;
      const visible = sorted.slice(start, start + state.pageSize);
      const maxPage = Math.max(1, Math.ceil(sorted.length / state.pageSize));

      tableMount.innerHTML = `
        <table class="table">
          <thead>
            <tr>
              ${columns
                .map(
                  (column) =>
                    `<th><button class="btn btn-muted" data-sort="${column.key}" type="button">${column.label}</button></th>`
                )
                .join("")}
            </tr>
          </thead>
          <tbody>
            ${visible
              .map(
                (row) =>
                  `<tr>${columns
                    .map((column) => `<td>${column.html ? row[column.key] || "" : escapeHtml(row[column.key] ?? "")}</td>`)
                    .join("")}</tr>`
              )
              .join("")}
          </tbody>
        </table>
        <div class="toolbar card">
          <button class="btn btn-muted" data-page-prev type="button">Prev</button>
          <span class="muted">Page ${state.page} of ${maxPage}</span>
          <button class="btn btn-muted" data-page-next type="button">Next</button>
        </div>
      `;

      tools.querySelector("[data-table-count]").textContent = `${filtered.length} record(s)`;
      tableMount.querySelectorAll("[data-sort]").forEach((button) => {
        button.addEventListener("click", () => {
          state.sortDir = state.sortKey === button.dataset.sort && state.sortDir === "asc" ? "desc" : "asc";
          state.sortKey = button.dataset.sort;
          render();
        });
      });
      tableMount.querySelector("[data-page-prev]").addEventListener("click", () => {
        state.page = Math.max(1, state.page - 1);
        render();
      });
      tableMount.querySelector("[data-page-next]").addEventListener("click", () => {
        state.page = Math.min(maxPage, state.page + 1);
        render();
      });
    };

    tools.querySelector("[data-table-search]").addEventListener("input", (event) => {
      state.query = event.target.value;
      state.page = 1;
      render();
    });
    tools.querySelector("[data-table-page-size]").addEventListener("change", (event) => {
      state.pageSize = Number(event.target.value);
      state.page = 1;
      render();
    });
    render();
  });
}

function emptyHtml(message) {
  return `<div class="notice info">${escapeHtml(message)}</div>`;
}

async function renderAdmin() {
  renderSidebar();
  content.innerHTML = `<div class="notice info">Loading ${escapeHtml(activeSection)}...</div>`;

  const renderers = {
    dashboard: renderDashboard,
    products: renderProducts,
    archived: renderArchivedProducts,
    categories: renderCategories,
    inventory: renderInventory,
    services: renderServices,
    reservations: renderReservations,
    payments: renderPayments,
    customers: renderCustomers,
    reviews: renderReviews,
    feedback: renderFeedback,
    users: renderUsers,
    settings: renderSettings
  };

  try {
    await (renderers[activeSection] || renderDashboard)();
    hydrateTables();
  } catch (error) {
    showNotice(error.message, "error");
    content.innerHTML = emptyHtml(error.message);
  }
}

async function renderDashboard() {
  const [stats, logs] = await Promise.all([getDashboardStats(), listInventoryLogs()]);
  content.innerHTML = `
    <div class="kpis">
      ${[
        ["Products", stats.totalProducts],
        ["Categories", stats.totalCategories],
        ["Services", stats.totalServices],
        ["Customers", stats.totalCustomers],
        ["Low Stock", stats.lowStockItems],
        ["Out of Stock", stats.outOfStockItems],
        ["Pending Reservations", stats.pendingReservations],
        ["Payment Checks", stats.pendingProofs]
      ]
        .map(([label, value]) => `<div class="kpi"><span>${label}</span><strong>${value}</strong></div>`)
        .join("")}
    </div>
    ${renderTable({
      title: "Recent Activity",
      rows: logs.slice(0, 12).map((log) => ({
        product: log.products?.name || "-",
        type: log.change_type,
        change: log.quantity_change,
        reason: log.reason || "-",
        date: formatDate(log.created_at)
      })),
      columns: [
        { key: "product", label: "Product" },
        { key: "type", label: "Type" },
        { key: "change", label: "Qty" },
        { key: "reason", label: "Reason" },
        { key: "date", label: "Date" }
      ]
    })}
  `;
}

async function renderProducts() {
  const products = (await listProducts({ includeArchived: true, limit: 500 })).filter((product) => !product.is_archived);
  content.innerHTML = renderTable({
    title: "Products",
    actions: `<button class="btn btn-primary" id="add-product-btn" type="button">Add Product</button>`,
    rows: products.map(productAdminRow),
    columns: productColumns()
  });
  document.getElementById("add-product-btn").addEventListener("click", () => openProductForm());
}

async function renderArchivedProducts() {
  const products = (await listProducts({ includeArchived: true, limit: 500 })).filter((product) => product.is_archived);
  content.innerHTML = renderTable({
    title: "Archived Products",
    rows: products.map(productAdminRow),
    columns: productColumns(true)
  });
}

function productAdminRow(product) {
  return {
    id: product.id,
    name: product.name,
    category: product.categories?.name || "-",
    price: formatCurrency(product.price),
    stock: product.stock_quantity,
    status: product.stock_status,
    actions: product.is_archived
      ? `<button class="btn btn-success" data-action="restore-product" data-id="${product.id}" type="button">Restore</button>`
      : `<button class="btn btn-muted" data-action="edit-product" data-id="${product.id}" type="button">Edit</button>
         <button class="btn btn-danger" data-action="archive-product" data-id="${product.id}" type="button">Archive</button>
         <button class="btn btn-danger" data-action="delete-product" data-id="${product.id}" type="button">Delete</button>`
  };
}

function productColumns() {
  return [
    { key: "name", label: "Name" },
    { key: "category", label: "Category" },
    { key: "price", label: "Price" },
    { key: "stock", label: "Stock" },
    { key: "status", label: "Status" },
    { key: "actions", label: "Actions", render: (row) => row.actions }
  ];
}

content.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const id = button.dataset.id;

  try {
    if (button.dataset.action === "edit-product") await openProductForm(id);
    if (button.dataset.action === "archive-product" && confirm("Archive this product?")) await archiveProduct(id);
    if (button.dataset.action === "restore-product") await restoreProduct(id);
    if (button.dataset.action === "delete-product" && confirm("Delete this product permanently?")) await deleteProduct(id);
    if (button.dataset.action === "edit-category") await openCategoryForm(id);
    if (button.dataset.action === "delete-category" && confirm("Delete this category?")) await deleteCategory(id);
    if (button.dataset.action === "edit-service") await openServiceForm(id);
    if (button.dataset.action === "delete-service" && confirm("Delete this service?")) await deleteService(id);
    if (button.dataset.action === "adjust-stock") await openStockForm(id);
    if (button.dataset.action === "approve-review") await updateReviewStatus(id, "approved");
    if (button.dataset.action === "reject-review") await updateReviewStatus(id, "rejected");
    if (button.dataset.action === "delete-review" && confirm("Delete this review?")) await deleteReview(id);
    if (button.dataset.action === "delete-feedback" && confirm("Delete this feedback?")) await deleteFeedback(id);
    if (button.dataset.action === "approve-payment") await reviewPaymentProof({ proofId: id, reservationId: button.dataset.reservation, approve: true, adminNote: "Payment verified." });
    if (button.dataset.action === "reject-payment") await reviewPaymentProof({ proofId: id, reservationId: button.dataset.reservation, approve: false, adminNote: "Payment proof rejected." });
    if (button.dataset.action === "status-reservation") await openReservationStatusForm(id);
    if (button.dataset.action === "change-role") await updateUserRole(id, button.dataset.role);

    if (!["edit-product", "edit-category", "edit-service", "adjust-stock", "status-reservation"].includes(button.dataset.action)) {
      showToast("Admin action completed.", "success");
      await renderAdmin();
    }
  } catch (error) {
    showToast(error.message, "error");
  }
});

async function openProductForm(productId = null) {
  const [categories, product] = await Promise.all([
    listCategories(true),
    productId ? getProductById(productId) : Promise.resolve(null)
  ]);

  openModal(`
    <form id="product-form">
      <div class="toolbar">
        <h3>${product ? "Edit Product" : "Add Product"}</h3>
        <button class="btn btn-muted" data-close-modal type="button">Close</button>
      </div>
      <div class="form-grid">
        <label class="field"><span>Name</span><input name="name" required value="${escapeHtml(product?.name || "")}" /></label>
        <label class="field"><span>Brand</span><input name="brand" value="${escapeHtml(product?.brand || "")}" /></label>
        <label class="field"><span>Model</span><input name="model" value="${escapeHtml(product?.model || "")}" /></label>
        <label class="field"><span>Category</span><select name="category_id">${categories
          .map((category) => `<option value="${category.id}" ${product?.category_id === category.id ? "selected" : ""}>${escapeHtml(category.name)}</option>`)
          .join("")}</select></label>
        <label class="field"><span>Part Type</span><select name="part_type">
          <option value="">General Product</option>
          ${["CPU", "Motherboard", "RAM", "GPU", "PSU", "Storage", "Case", "CPU Cooler"]
            .map((type) => `<option ${product?.part_type === type ? "selected" : ""}>${type}</option>`)
            .join("")}
        </select></label>
        <label class="field"><span>Price</span><input type="number" name="price" min="0" step="0.01" required value="${product?.price || 0}" /></label>
        <label class="field"><span>Warranty Months</span><input type="number" name="warranty_months" min="0" value="${product?.warranty_months || 0}" /></label>
        <label class="field"><span>Stock Quantity</span><input type="number" name="stock_quantity" min="0" value="${product?.stock_quantity || 0}" /></label>
        <label class="field"><span>Power Draw Watts</span><input type="number" name="power_draw_watts" min="0" value="${product?.power_draw_watts || 0}" /></label>
      </div>
      <label class="field"><span>Description</span><textarea name="description">${escapeHtml(product?.description || "")}</textarea></label>
      <label class="field"><span>Compatibility JSON</span><textarea name="compatibility">${escapeHtml(JSON.stringify(product?.compatibility || {}, null, 2))}</textarea></label>
      <label class="field"><span>Product Images</span><input type="file" name="images" accept="image/*" multiple /></label>
      ${
        product?.product_images?.length
          ? `<div class="grid grid-3">${product.product_images
              .map(
                (image) =>
                  `<div class="card"><img src="${image.image_url}" alt="Product image" /><button class="btn btn-danger" data-delete-image="${image.id}" type="button">Delete Image</button></div>`
              )
              .join("")}</div>`
          : ""
      }
      <button class="btn btn-primary" type="submit">${product ? "Save Product" : "Create Product"}</button>
    </form>
  `);

  modal.querySelectorAll("[data-delete-image]").forEach((button) => {
    button.addEventListener("click", async () => {
      await deleteProductImage(button.dataset.deleteImage);
      await openProductForm(productId);
    });
  });

  modal.querySelector("#product-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector("button[type='submit']");
    setLoading(button, true, "Saving...");
    try {
      const formData = new FormData(form);
      const payload = {
        name: formData.get("name"),
        brand: formData.get("brand"),
        model: formData.get("model"),
        category_id: formData.get("category_id"),
        part_type: formData.get("part_type") || null,
        price: Number(formData.get("price")),
        warranty_months: Number(formData.get("warranty_months")),
        stock_quantity: Number(formData.get("stock_quantity")),
        power_draw_watts: Number(formData.get("power_draw_watts")),
        description: formData.get("description"),
        compatibility: JSON.parse(formData.get("compatibility") || "{}")
      };
      const saved = productId ? await updateProduct(productId, payload) : await createProduct(payload);
      const files = formData.getAll("images").filter((file) => file.size);
      for (const [index, file] of files.entries()) {
        await uploadProductImage(saved.id, file, { isPrimary: index === 0 && !productId, sortOrder: index });
      }
      closeModal();
      showToast("Product saved.", "success");
      await renderAdmin();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(button, false);
    }
  });
}

async function renderCategories() {
  const categories = await listCategories(true);
  content.innerHTML = renderTable({
    title: "Categories",
    actions: `<button class="btn btn-primary" id="add-category-btn" type="button">Add Category</button>`,
    rows: categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      active: category.is_active ? "Yes" : "No",
      actions: `<button class="btn btn-muted" data-action="edit-category" data-id="${category.id}" type="button">Edit</button>
        <button class="btn btn-danger" data-action="delete-category" data-id="${category.id}" type="button">Delete</button>`
    })),
    columns: [
      { key: "name", label: "Name" },
      { key: "slug", label: "Slug" },
      { key: "active", label: "Active" },
      { key: "actions", label: "Actions", render: (row) => row.actions }
    ]
  });
  document.getElementById("add-category-btn").addEventListener("click", () => openCategoryForm());
}

async function openCategoryForm(categoryId = null) {
  const categories = await listCategories(true);
  const category = categories.find((item) => item.id === categoryId);
  openModal(`
    <form id="category-form">
      <div class="toolbar">
        <h3>${category ? "Edit Category" : "Add Category"}</h3>
        <button class="btn btn-muted" data-close-modal type="button">Close</button>
      </div>
      <label class="field"><span>Name</span><input name="name" required value="${escapeHtml(category?.name || "")}" /></label>
      <label class="field"><span>Slug</span><input name="slug" required value="${escapeHtml(category?.slug || "")}" /></label>
      <label class="field"><span>Description</span><textarea name="description">${escapeHtml(category?.description || "")}</textarea></label>
      <label><input type="checkbox" name="is_active" ${category?.is_active !== false ? "checked" : ""} /> Active</label>
      <button class="btn btn-primary" type="submit">Save Category</button>
    </form>
  `);
  modal.querySelector("#category-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = {
      name: formData.get("name"),
      slug: formData.get("slug"),
      description: formData.get("description"),
      is_active: formData.has("is_active")
    };
    categoryId ? await updateCategory(categoryId, payload) : await createCategory(payload);
    closeModal();
    showToast("Category saved.", "success");
    await renderAdmin();
  });
}

async function renderInventory() {
  const [products, logs] = await Promise.all([listProducts({ includeArchived: true, limit: 500 }), listInventoryLogs()]);
  content.innerHTML = `
    ${renderTable({
      title: "Inventory",
      rows: products.map((product) => ({
        id: product.id,
        name: product.name,
        stock: product.stock_quantity,
        status: product.stock_status,
        actions: `<button class="btn btn-primary" data-action="adjust-stock" data-id="${product.id}" type="button">Adjust</button>`
      })),
      columns: [
        { key: "name", label: "Product" },
        { key: "stock", label: "Qty" },
        { key: "status", label: "Status" },
        { key: "actions", label: "Actions", render: (row) => row.actions }
      ]
    })}
    ${renderTable({
      title: "Inventory Logs",
      rows: logs.map((log) => ({
        product: log.products?.name || "-",
        changedBy: log.profiles?.full_name || "-",
        type: log.change_type,
        change: log.quantity_change,
        previous: log.previous_quantity,
        current: log.new_quantity,
        reason: log.reason || "-",
        date: formatDate(log.created_at)
      })),
      columns: [
        { key: "product", label: "Product" },
        { key: "changedBy", label: "By" },
        { key: "type", label: "Type" },
        { key: "change", label: "Change" },
        { key: "previous", label: "Previous" },
        { key: "current", label: "Current" },
        { key: "reason", label: "Reason" },
        { key: "date", label: "Date" }
      ]
    })}
  `;
}

async function openStockForm(productId) {
  openModal(`
    <form id="stock-form">
      <div class="toolbar">
        <h3>Adjust Stock</h3>
        <button class="btn btn-muted" data-close-modal type="button">Close</button>
      </div>
      <label class="field"><span>Change Type</span><select name="changeType">
        <option value="stock_in">Stock In</option>
        <option value="stock_out">Stock Out</option>
        <option value="adjustment">Manual Adjustment</option>
      </select></label>
      <label class="field"><span>Quantity Change</span><input type="number" name="quantityChange" required placeholder="Use negative for stock out" /></label>
      <label class="field"><span>Reason</span><textarea name="reason"></textarea></label>
      <button class="btn btn-primary" type="submit">Apply Stock Change</button>
    </form>
  `);
  modal.querySelector("#stock-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await adjustStock({
      productId,
      quantityChange: Number(formData.get("quantityChange")),
      changeType: formData.get("changeType"),
      reason: formData.get("reason")
    });
    closeModal();
    showToast("Stock adjusted.", "success");
    await renderAdmin();
  });
}

async function renderServices() {
  const services = await listServices({ includeInactive: true });
  content.innerHTML = renderTable({
    title: "Services",
    actions: `<button class="btn btn-primary" id="add-service-btn" type="button">Add Service</button>`,
    rows: services.map((service) => ({
      id: service.id,
      title: service.title,
      price: service.price_from ? formatCurrency(service.price_from) : "-",
      active: service.is_active ? "Yes" : "No",
      actions: `<button class="btn btn-muted" data-action="edit-service" data-id="${service.id}" type="button">Edit</button>
        <button class="btn btn-danger" data-action="delete-service" data-id="${service.id}" type="button">Delete</button>`
    })),
    columns: [
      { key: "title", label: "Title" },
      { key: "price", label: "Price From" },
      { key: "active", label: "Active" },
      { key: "actions", label: "Actions", render: (row) => row.actions }
    ]
  });
  document.getElementById("add-service-btn").addEventListener("click", () => openServiceForm());
}

async function openServiceForm(serviceId = null) {
  const services = await listServices({ includeInactive: true });
  const service = services.find((item) => item.id === serviceId);
  openModal(`
    <form id="service-form">
      <div class="toolbar">
        <h3>${service ? "Edit Service" : "Add Service"}</h3>
        <button class="btn btn-muted" data-close-modal type="button">Close</button>
      </div>
      <label class="field"><span>Title</span><input name="title" required value="${escapeHtml(service?.title || "")}" /></label>
      <label class="field"><span>Icon Label</span><input name="icon" value="${escapeHtml(service?.icon || "Wrench")}" /></label>
      <label class="field"><span>Price From</span><input type="number" name="price_from" min="0" step="0.01" value="${service?.price_from || ""}" /></label>
      <label class="field"><span>Description</span><textarea name="description" required>${escapeHtml(service?.description || "")}</textarea></label>
      <label class="field"><span>Service Image</span><input type="file" name="image" accept="image/*" /></label>
      <label><input type="checkbox" name="is_active" ${service?.is_active !== false ? "checked" : ""} /> Active</label>
      <button class="btn btn-primary" type="submit">Save Service</button>
    </form>
  `);
  modal.querySelector("#service-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = {
      title: formData.get("title"),
      icon: formData.get("icon"),
      price_from: formData.get("price_from") ? Number(formData.get("price_from")) : null,
      description: formData.get("description"),
      is_active: formData.has("is_active")
    };
    const image = formData.get("image");
    if (image?.size) payload.image_url = await uploadServiceImage(image);
    serviceId ? await updateService(serviceId, payload) : await createService(payload);
    closeModal();
    showToast("Service saved.", "success");
    await renderAdmin();
  });
}

async function renderReservations() {
  const reservations = await listReservationsForAdmin();
  content.innerHTML = renderTable({
    title: "Reservations",
    rows: reservations.map((reservation) => ({
      id: reservation.id,
      customer: reservation.profiles?.full_name || "-",
      contact: reservation.profiles?.phone || reservation.profiles?.email || "-",
      status: reservation.status,
      total: formatCurrency(reservation.total_amount),
      date: formatDate(reservation.created_at),
      actions: `<button class="btn btn-primary" data-action="status-reservation" data-id="${reservation.id}" type="button">Update Status</button>`
    })),
    columns: [
      { key: "customer", label: "Customer" },
      { key: "contact", label: "Contact" },
      { key: "status", label: "Status" },
      { key: "total", label: "Total" },
      { key: "date", label: "Date" },
      { key: "actions", label: "Actions", render: (row) => row.actions }
    ]
  });
}

async function openReservationStatusForm(reservationId) {
  openModal(`
    <form id="reservation-status-form">
      <div class="toolbar">
        <h3>Update Reservation</h3>
        <button class="btn btn-muted" data-close-modal type="button">Close</button>
      </div>
      <label class="field"><span>Status</span><select name="status">
        ${RESERVATION_STATUSES.map((status) => `<option>${status}</option>`).join("")}
      </select></label>
      <label class="field"><span>Admin Notes</span><textarea name="adminNotes"></textarea></label>
      <button class="btn btn-primary" type="submit">Save Status</button>
    </form>
  `);
  modal.querySelector("#reservation-status-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await updateReservationStatus(reservationId, formData.get("status"), formData.get("adminNotes"));
    closeModal();
    showToast("Reservation updated.", "success");
    await renderAdmin();
  });
}

async function renderPayments() {
  const proofs = await listPaymentProofsForAdmin();
  content.innerHTML = renderTable({
    title: "Payment Verification",
    rows: proofs.map((proof) => ({
      id: proof.id,
      customer: proof.reservations?.profiles?.full_name || "-",
      method: proof.payment_method,
      reference: proof.reference_no || "-",
      status: proof.status,
      image: `<a href="${proof.image_url}" target="_blank" rel="noreferrer">View Proof</a>`,
      date: formatDate(proof.created_at),
      actions: `<button class="btn btn-success" data-action="approve-payment" data-id="${proof.id}" data-reservation="${proof.reservation_id}" type="button">Approve</button>
        <button class="btn btn-danger" data-action="reject-payment" data-id="${proof.id}" data-reservation="${proof.reservation_id}" type="button">Reject</button>`
    })),
    columns: [
      { key: "customer", label: "Customer" },
      { key: "method", label: "Method" },
      { key: "reference", label: "Reference" },
      { key: "status", label: "Status" },
      { key: "image", label: "Proof", render: (row) => row.image },
      { key: "date", label: "Date" },
      { key: "actions", label: "Actions", render: (row) => row.actions }
    ]
  });
}

async function renderCustomers() {
  const users = (await listProfiles()).filter((user) => user.role === "customer");
  content.innerHTML = renderUserTable("Customers", users);
}

async function renderUsers() {
  const users = await listProfiles();
  content.innerHTML = renderUserTable("Users/Staff", users);
}

function renderUserTable(title, users) {
  return renderTable({
    title,
    rows: users.map((user) => ({
      id: user.id,
      name: user.full_name || "-",
      email: user.email || "-",
      phone: user.phone || "-",
      role: user.role,
      date: formatDate(user.created_at),
      actions: ["customer", "staff", "admin"]
        .filter((role) => role !== user.role)
        .map((role) => `<button class="btn btn-muted" data-action="change-role" data-id="${user.id}" data-role="${role}" type="button">Make ${role}</button>`)
        .join(" ")
    })),
    columns: [
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
      { key: "role", label: "Role" },
      { key: "date", label: "Created" },
      { key: "actions", label: "Actions", render: (row) => row.actions }
    ]
  });
}

async function renderReviews() {
  const reviews = await listAdminReviews();
  content.innerHTML = renderTable({
    title: "Reviews",
    rows: reviews.map((review) => ({
      customer: review.profiles?.full_name || "-",
      rating: review.rating,
      message: review.message,
      status: review.status,
      image: review.image_url ? `<a href="${review.image_url}" target="_blank" rel="noreferrer">View</a>` : "-",
      actions: `<button class="btn btn-success" data-action="approve-review" data-id="${review.id}" type="button">Approve</button>
        <button class="btn btn-muted" data-action="reject-review" data-id="${review.id}" type="button">Reject</button>
        <button class="btn btn-danger" data-action="delete-review" data-id="${review.id}" type="button">Delete</button>`
    })),
    columns: [
      { key: "customer", label: "Customer" },
      { key: "rating", label: "Rating" },
      { key: "message", label: "Message" },
      { key: "status", label: "Status" },
      { key: "image", label: "Proof", render: (row) => row.image },
      { key: "actions", label: "Actions", render: (row) => row.actions }
    ]
  });
}

async function renderFeedback() {
  const feedbackRows = await listFeedback();
  content.innerHTML = renderTable({
    title: "Feedback",
    rows: feedbackRows.map((item) => ({
      name: item.name || item.profiles?.full_name || "-",
      contact: item.contact || item.profiles?.email || "-",
      message: item.message,
      date: formatDate(item.created_at),
      actions: `<button class="btn btn-danger" data-action="delete-feedback" data-id="${item.id}" type="button">Delete</button>`
    })),
    columns: [
      { key: "name", label: "Name" },
      { key: "contact", label: "Contact" },
      { key: "message", label: "Message" },
      { key: "date", label: "Date" },
      { key: "actions", label: "Actions", render: (row) => row.actions }
    ]
  });
}

async function renderSettings() {
  const settings = await getBusinessSettings();
  content.innerHTML = `
    <form class="card" id="settings-form">
      <h3>Business Settings</h3>
      <div class="form-grid">
        ${["name", "phone", "email", "facebook", "address", "hours", "days"]
          .map(
            (key) =>
              `<label class="field"><span>${key}</span><input name="${key}" value="${escapeHtml(settings[key] || "")}" /></label>`
          )
          .join("")}
      </div>
      <button class="btn btn-primary" type="submit">Save Settings</button>
    </form>
  `;
  document.getElementById("settings-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const value = Object.fromEntries(formData.entries());
    await updateBusinessSettings(value);
    showNotice("Settings updated.", "success");
  });
}

renderAdmin();
