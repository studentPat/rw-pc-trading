import { supabase } from "../supabaseClient.js";

export async function listServices({ includeInactive = false } = {}) {
  let query = supabase
    .from("services")
    .select("id, title, description, price_from, icon, image_url, is_active, created_at")
    .order("created_at", { ascending: false });

  if (!includeInactive) query = query.eq("is_active", true);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createService(payload) {
  const { data, error } = await supabase.from("services").insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function updateService(id, payload) {
  const { data, error } = await supabase.from("services").update(payload).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteService(id) {
  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) throw error;
}

export async function uploadServiceImage(file) {
  const path = `services/${Date.now()}-${file.name.replaceAll(/\s+/g, "-")}`;
  const { error } = await supabase.storage.from("service-images").upload(path, file, {
    cacheControl: "3600"
  });
  if (error) throw error;
  return supabase.storage.from("service-images").getPublicUrl(path).data.publicUrl;
}