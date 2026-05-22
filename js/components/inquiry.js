import { SHOP_INFO } from "../config.js";
import { escapeHtml } from "../utils/dom.js";

const MESSENGER_LINK = "https://www.facebook.com/messages/t/608332249037742";

export function buildInquiryMessage(itemName) {
  const text = `Hello, I'd like to inquire about ${itemName}.`;
  return encodeURIComponent(text);
}

export function openInquiry(itemName = "this item") {
  const message = buildInquiryMessage(itemName);
  const facebookLink = `${SHOP_INFO.facebook}&app=fbl`;
  const safeItemName = escapeHtml(itemName);

  const modal = document.getElementById("inquiry-modal");
  if (!modal) return;

  modal.innerHTML = `
    <div class="modal-card">
      <div class="toolbar">
        <h3>Inquire About ${safeItemName}</h3>
        <button class="btn btn-muted" id="close-inquiry" type="button">Close</button>
      </div>
      <p class="muted">Use any contact channel below. The message is pre-filled for you.</p>
      <div class="grid grid-2">
        <a class="btn btn-primary" href="${facebookLink}" target="_blank" rel="noreferrer">Open Facebook</a>
        <a class="btn btn-secondary" href="mailto:${SHOP_INFO.email}?subject=Product Inquiry&body=${message}">Email Us</a>
        <a class="btn btn-secondary" href="tel:${SHOP_INFO.phone}">Call ${SHOP_INFO.phone}</a>
        <a class="btn btn-secondary" href="${MESSENGER_LINK}" target="_blank" rel="noreferrer">Send Message</a>
      </div>
      <p style="margin-top:.8rem;"><strong>Message:</strong> Hello, I'd like to inquire about ${safeItemName}.</p>
    </div>
  `;

  modal.classList.add("open");
  document.getElementById("close-inquiry")?.addEventListener("click", () => {
    modal.classList.remove("open");
  });
}

export function wireInquiryModal() {
  const modal = document.getElementById("inquiry-modal");
  if (!modal) return;
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.classList.remove("open");
    }
  });
}
