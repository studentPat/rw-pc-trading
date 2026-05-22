import { SHOP_INFO } from "../config.js";
import { getCurrentProfile, getSession, signOut } from "../api/auth.js";
import { hasSupabaseConfig } from "../supabaseClient.js";
import { showToast } from "../utils/notifications.js";

function getActive(pathname) {
  return pathname.split("/").pop() || "index.html";
}

function buildNavLinks(profile, activePage) {
  const baseLinks = [
    { href: "index.html", label: "Home" },
    { href: "products.html", label: "Products" },
    { href: "services.html", label: "Services" },
    { href: "reviews.html", label: "Reviews" },
    { href: "pc-builder.html", label: "PC Builder" }
  ];

  if (profile) {
    baseLinks.push({ href: "cart.html", label: "Cart" });
    baseLinks.push({ href: "reservations.html", label: "Reservations" });
    baseLinks.push({ href: "profile.html", label: "Profile" });
  }

  if (profile && ["admin", "staff"].includes(profile.role)) {
    baseLinks.push({ href: "admin.html", label: "Admin" });
  }

  return baseLinks
    .map(
      (link) =>
        `<a class="nav-link ${activePage === link.href ? "active" : ""}" href="${link.href}">${link.label}</a>`
    )
    .join("");
}

function buildAuthActions(profile) {
  if (!profile) {
    return `
      <a class="nav-pill" href="login.html">Login</a>
      <a class="nav-pill" href="register.html">Create Account</a>
    `;
  }

  return `
    <span class="nav-link">Hi, ${profile.full_name || profile.email || "Customer"}</span>
    <button class="btn btn-secondary" id="logout-btn" type="button">Logout</button>
  `;
}

function renderHeader(profile) {
  const activePage = getActive(window.location.pathname);
  return `
    <header class="topbar">
      <div class="container">
        <a class="brand" href="index.html">
          <img class="brand-logo" src="assets/images/logo.jpg" alt="${SHOP_INFO.name} logo" />
          <div>
            <h1>${SHOP_INFO.name}</h1>
            <span>${SHOP_INFO.tagline}</span>
          </div>
        </a>
        <nav class="nav-links" id="main-nav-links">
          ${buildNavLinks(profile, activePage)}
        </nav>
        <div class="nav-links" id="auth-links">${buildAuthActions(profile)}</div>
      </div>
    </header>
  `;
}

function renderFooter() {
  return `
    <footer class="footer">
      <div class="container grid grid-3">
        <div>
          <h4>${SHOP_INFO.name}</h4>
          <p class="muted">${SHOP_INFO.description}</p>
        </div>
        <div>
          <h4>Contact</h4>
          <p>Phone: ${SHOP_INFO.phone}</p>
          <p>Email: <a href="mailto:${SHOP_INFO.email}">${SHOP_INFO.email}</a></p>
          <p><a href="${SHOP_INFO.facebook}" target="_blank" rel="noreferrer">Facebook Page</a></p>
        </div>
        <div>
          <h4>Visit Us</h4>
          <p>${SHOP_INFO.address}</p>
          <p>${SHOP_INFO.operatingDays} | ${SHOP_INFO.operatingHours}</p>
        </div>
      </div>
    </footer>
  `;
}

export async function bootstrapLayout({ requiresAuth = false, allowedRoles = [] } = {}) {
  const headerMount = document.getElementById("site-header");
  const footerMount = document.getElementById("site-footer");

  let profile = null;
  let session = null;

  if (!hasSupabaseConfig()) {
    if (headerMount) headerMount.innerHTML = renderHeader(null);
    if (footerMount) footerMount.innerHTML = renderFooter();
    showToast("Add Supabase credentials in js/env.js to enable live data.", "info");
    return { session: null, profile: null, notConfigured: true };
  }

  session = await getSession();

  if (session?.user) {
    profile = await getCurrentProfile(session.user.id);
  }

  if (requiresAuth && !session?.user) {
    window.location.href = `login.html?next=${encodeURIComponent(window.location.pathname.split("/").pop())}`;
    return null;
  }

  if (allowedRoles.length && (!profile || !allowedRoles.includes(profile.role))) {
    showToast("You do not have access to this page.", "error");
    window.location.href = "index.html";
    return null;
  }

  if (headerMount) headerMount.innerHTML = renderHeader(profile);
  if (footerMount) footerMount.innerHTML = renderFooter();

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        await signOut();
        showToast("Logged out successfully.", "success");
        window.location.href = "index.html";
      } catch (error) {
        showToast(error.message, "error");
      }
    });
  }

  return { session, profile };
}
