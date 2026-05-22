import { bootstrapLayout } from "../components/layout.js";
import { renderReviewCard } from "../components/cards.js";
import { listPublicReviews, submitReview } from "../api/reviews.js";
import { renderEmptyState, setLoading } from "../utils/dom.js";
import { showNotice } from "../utils/notifications.js";

const context = await bootstrapLayout();

async function loadReviews() {
  const reviews = await listPublicReviews(24);
  const mount = document.getElementById("reviews-list");
  if (!reviews.length) {
    renderEmptyState(mount, "Approved reviews will appear here.");
    return;
  }
  mount.innerHTML = reviews.map(renderReviewCard).join("");
}

document.getElementById("review-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!context?.session?.user) {
    window.location.href = "login.html?next=reviews.html";
    return;
  }

  const form = event.currentTarget;
  const button = form.querySelector("button[type='submit']");
  setLoading(button, true, "Submitting...");

  try {
    const formData = new FormData(form);
    await submitReview({
      userId: context.session.user.id,
      rating: Number(formData.get("rating")),
      message: formData.get("message"),
      proofFile: formData.get("proof")
    });
    form.reset();
    showNotice("Review submitted for admin approval.", "success");
  } catch (error) {
    showNotice(error.message, "error");
  } finally {
    setLoading(button, false);
  }
});

loadReviews().catch((error) => showNotice(error.message, "error"));
