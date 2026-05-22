import { supabase } from "../supabaseClient.js";

export async function listProfiles() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, role, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function updateUserRole(id, role) {
  const { data, error } = await supabase.from("profiles").update({ role }).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function listInventoryLogs() {
  const { data, error } = await supabase
    .from("inventory_logs")
    .select(
      "id, product_id, change_type, quantity_change, previous_quantity, new_quantity, reason, created_at, products ( name ), profiles ( full_name )"
    )
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return data || [];
}

export async function adjustStock({ productId, quantityChange, changeType, reason }) {
  const { error } = await supabase.rpc("admin_adjust_stock", {
    p_product_id: productId,
    p_quantity_change: quantityChange,
    p_change_type: changeType,
    p_reason: reason || null
  });

  if (error) throw error;
}

export async function getDashboardStats() {
  const [
    { count: totalProducts },
    { count: totalCategories },
    { count: totalServices },
    { count: totalCustomers },
    { count: lowStockItems },
    { count: outOfStockItems },
    { count: pendingReservations },
    { count: pendingProofs }
  ] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }).eq("is_archived", false),
    supabase.from("categories").select("id", { count: "exact", head: true }),
    supabase.from("services").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "customer"),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .gt("stock_quantity", 0)
      .lte("stock_quantity", 5)
      .eq("is_archived", false),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("stock_quantity", 0)
      .eq("is_archived", false),
    supabase
      .from("reservations")
      .select("id", { count: "exact", head: true })
      .in("status", ["Pending Deposit", "Under Verification"]),
    supabase.from("payment_proofs").select("id", { count: "exact", head: true }).eq("status", "pending")
  ]);

  return {
    totalProducts: totalProducts || 0,
    totalCategories: totalCategories || 0,
    totalServices: totalServices || 0,
    totalCustomers: totalCustomers || 0,
    lowStockItems: lowStockItems || 0,
    outOfStockItems: outOfStockItems || 0,
    pendingReservations: pendingReservations || 0,
    pendingProofs: pendingProofs || 0
  };
}

export async function getBusinessSettings() {
  const { data, error } = await supabase.from("site_settings").select("key, value").eq("key", "business").maybeSingle();
  if (error) throw error;
  return data?.value || {};
}

export async function updateBusinessSettings(value) {
  const { data, error } = await supabase
    .from("site_settings")
    .upsert({ key: "business", value })
    .select()
    .single();
  if (error) throw error;
  return data;
}
