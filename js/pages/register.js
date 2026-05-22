import { bootstrapLayout } from "../components/layout.js";
import { signUpCustomer } from "../api/auth.js";
import { setLoading } from "../utils/dom.js";
import { showNotice } from "../utils/notifications.js";

await bootstrapLayout();

const form = document.getElementById("register-form");
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = form.querySelector("button[type='submit']");
  setLoading(button, true, "Creating...");

  try {
    const formData = new FormData(form);
    await signUpCustomer({
      fullName: formData.get("fullName"),
      phone: formData.get("phone"),
      email: formData.get("email"),
      password: formData.get("password")
    });
    showNotice(
      "Account created. Please verify your account first using the confirmation email sent to your Gmail inbox before logging in.",
      "success"
    );
    form.reset();
  } catch (error) {
    showNotice(error.message, "error");
  } finally {
    setLoading(button, false);
  }
});
