import { supabase } from "../supabaseClient.js";

let activeNoticeTimeout;

export function showNotice(message, type = "info", containerSelector = "#app-notice") {
  const mount = document.querySelector(containerSelector);
  if (!mount) return;

  mount.innerHTML = `<div class="notice ${type}">${message}</div>`;
  clearTimeout(activeNoticeTimeout);
  activeNoticeTimeout = setTimeout(() => {
    mount.innerHTML = "";
  }, 4800);
}

export function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `notice ${type}`;
  toast.style.position = "fixed";
  toast.style.bottom = "16px";
  toast.style.right = "16px";
  toast.style.zIndex = "9999";
  toast.style.boxShadow = "var(--shadow-md)";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

export async function getCurrentSession() {
  const {
    data: { session },
    error
  } = await supabase.auth.getSession();

  if (error) throw error;
  return session;
}