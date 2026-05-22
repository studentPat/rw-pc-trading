import { bootstrapLayout } from "../components/layout.js";
import { updateProfile, uploadProfileImage } from "../api/auth.js";
import { listSavedBuilds } from "../api/pcbuilder.js";
import { listUserReservations } from "../api/reservations.js";
import { escapeHtml, renderEmptyState, setLoading } from "../utils/dom.js";
import { formatCurrency, formatDate } from "../utils/format.js";
import { showNotice } from "../utils/notifications.js";

const context = await bootstrapLayout({ requiresAuth: true });

function fillProfileForm() {
  const form = document.getElementById("profile-form");
  form.full_name.value = context.profile?.full_name || "";
  form.email.value = context.profile?.email || context.session.user.email || "";
  form.phone.value = context.profile?.phone || "";
}

async function loadSavedBuilds() {
  const builds = await listSavedBuilds(context.session.user.id);
  const mount = document.getElementById("saved-builds");
  if (!builds.length) {
    renderEmptyState(mount, "Saved PC builds will appear here.");
    return;
  }

  mount.innerHTML = builds
    .map(
      (build) => `
        <article class="card">
          <h5>${escapeHtml(build.name)}</h5>
          <p>${formatCurrency(build.total_price)} | ${build.estimated_wattage}W estimated</p>
          <p class="muted">${formatDate(build.created_at)}</p>
        </article>
      `
    )
    .join("");
}

async function loadProfileReservations() {
  const reservations = await listUserReservations(context.session.user.id);
  const mount = document.getElementById("profile-reservations");
  if (!reservations.length) {
    renderEmptyState(mount, "No reservations yet.");
    return;
  }

  mount.innerHTML = reservations
    .slice(0, 5)
    .map(
      (reservation) => `
        <article class="card">
          <div class="toolbar">
            <strong>Reservation ${reservation.id.slice(0, 8)}</strong>
            <span class="badge badge-warning">${escapeHtml(reservation.status)}</span>
          </div>
          <p>${formatCurrency(reservation.total_amount)} | ${formatDate(reservation.created_at)}</p>
        </article>
      `
    )
    .join("");
}

document.getElementById("profile-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector("button[type='submit']");
  setLoading(button, true, "Updating...");

  try {
    const formData = new FormData(form);
    const payload = {
      full_name: formData.get("full_name"),
      phone: formData.get("phone")
    };
    const avatar = formData.get("avatar");
    if (avatar?.size) {
      payload.avatar_url = await uploadProfileImage(context.session.user.id, avatar);
    }
    await updateProfile(context.session.user.id, payload);
    showNotice("Profile updated.", "success");
  } catch (error) {
    showNotice(error.message, "error");
  } finally {
    setLoading(button, false);
  }
});

fillProfileForm();
await Promise.all([loadSavedBuilds(), loadProfileReservations()]).catch((error) => showNotice(error.message, "error"));
