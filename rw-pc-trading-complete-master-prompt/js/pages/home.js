import { bootstrapLayout } from "../components/layout.js";
import { renderProductCard, renderReviewCard, renderServiceCard } from "../components/cards.js";
import { openInquiry, wireInquiryModal } from "../components/inquiry.js";
import { listProducts } from "../api/products.js";
import { listServices } from "../api/services.js";
import { listPublicReviews } from "../api/reviews.js";
import { addToCart } from "../api/cart.js";
import { submitFeedback } from "../api/feedback.js";
import { renderEmptyState, setLoading } from "../utils/dom.js";
import { showNotice, showToast } from "../utils/notifications.js";

const context = await bootstrapLayout();
wireInquiryModal();

async function loadHome() {
  const [products, services, reviews] = await Promise.all([
    listProducts({ limit: 4 }),
    listServices(),
    listPublicReviews(3)
  ]);

  const productMount = document.getElementById("featured-products");
  const servicesMount = document.getElementById("featured-services");
  const reviewsMount = document.getElementById("home-reviews");

  productMount.innerHTML = products.map(renderProductCard).join("");
  servicesMount.innerHTML = services.slice(0, 3).map(renderServiceCard).join("");

  if (reviews.length) {
    reviewsMount.innerHTML = reviews.map(renderReviewCard).join("");
  } else {
    renderEmptyState(reviewsMount, "Approved customer reviews will appear here.");
  }

  wireProductActions(products);
  wireServiceActions(services);
}

function wireProductActions(products) {
  document.getElementById("featured-products")?.addEventListener("click", async (event) => {
    const button = event.target.closest("button");
    const card = event.target.closest("[data-id]");
    if (!button || !card) return;

    const product = products.find((item) => item.id === card.dataset.id);
    if (!product) return;

    if (button.dataset.action === "inquire") openInquiry(product.name);
    if (button.dataset.action === "details") window.location.href = `products.html?product=${product.id}`;
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
}

function wireServiceActions(services) {
  document.getElementById("featured-services")?.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    const card = event.target.closest("[data-id]");
    if (!button || !card) return;

    const service = services.find((item) => item.id === card.dataset.id);
    if (!service) return;

    if (button.dataset.action === "inquire") openInquiry(service.title);
    if (button.dataset.action === "details") window.location.href = "services.html";
  });
}

document.getElementById("feedback-form")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const submitBtn = form.querySelector("button[type='submit']");
  setLoading(submitBtn, true, "Sending...");

  try {
    const formData = new FormData(form);
    await submitFeedback({
      userId: context?.session?.user?.id || null,
      name: formData.get("name"),
      contact: formData.get("contact"),
      message: formData.get("message")
    });
    form.reset();
    showNotice("Feedback submitted. Thank you for helping us improve.", "success");
  } catch (error) {
    showNotice(error.message, "error");
  } finally {
    setLoading(submitBtn, false);
  }
});

loadHome().catch((error) => showNotice(error.message, "error"));
