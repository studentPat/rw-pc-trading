import { bootstrapLayout } from "../components/layout.js";
import { sendResetPassword, signIn } from "../api/auth.js";
import { setLoading } from "../utils/dom.js";
import { showNotice } from "../utils/notifications.js";

await bootstrapLayout();

const form = document.getElementById("login-form");
const params = new URLSearchParams(window.location.search);

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = form.querySelector("button[type='submit']");
  setLoading(button, true, "Logging in...");

  try {
    const formData = new FormData(form);
    await signIn({
      email: formData.get("email"),
      password: formData.get("password")
    });
    window.location.href = params.get("next") || "profile.html";
  } catch (error) {
    showNotice(error.message, "error");
  } finally {
    setLoading(button, false);
  }
});

document.getElementById("reset-password-btn").addEventListener("click", async () => {
  const email = form.email.value;
  if (!email) {
    showNotice("Enter your email first so we know where to send the reset link.", "info");
    return;
  }
  try {
    await sendResetPassword(email);
    showNotice("Password reset link sent.", "success");
  } catch (error) {
    showNotice(error.message, "error");
  }
});
