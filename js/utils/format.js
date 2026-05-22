export function formatCurrency(amount = 0) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2
  }).format(Number(amount) || 0);
}

export function formatDate(date) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(date));
}

export function computeStockStatus(stockQuantity = 0) {
  if (stockQuantity <= 0) return "Out of Stock";
  if (stockQuantity <= 5) return "Limited Stock";
  return "Available";
}

export function formatStars(rating = 0) {
  const safe = Math.max(0, Math.min(5, Number(rating) || 0));
  return `${safe} ${safe === 1 ? "star" : "stars"}`;
}
