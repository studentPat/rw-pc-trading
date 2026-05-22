import { supabase } from "../supabaseClient.js";

export async function listCategories(includeInactive = false) {
  let query = supabase
    .from("categories")
    .select("id, name, slug, description, is_active")
    .order("name", { ascending: true });

  if (!includeInactive) query = query.eq("is_active", true);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createCategory(payload) {
  const { data, error } = await supabase.from("categories").insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function updateCategory(id, payload) {
  const { data, error } = await supabase.from("categories").update(payload).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteCategory(id) {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}

export async function listProducts({ search = "", categoryId = "", includeArchived = false, limit = 24 } = {}) {
  let query = supabase
    .from("products")
    .select(
      `
      id,
      name,
      category_id,
      brand,
      model,
      description,
      price,
      warranty_months,
      stock_quantity,
      power_draw_watts,
      compatibility,
      is_archived,
      is_active,
      created_at,
      categories ( id, name ),
      product_images ( id, image_url, is_primary, sort_order )
    `
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!includeArchived) query = query.eq("is_archived", false);
  if (search.trim()) query = query.ilike("name", `%${search.trim()}%`);
  if (categoryId) query = query.eq("category_id", categoryId);

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map((item) => ({
    ...item,
    cover_image:
      item.product_images?.find((img) => img.is_primary)?.image_url || item.product_images?.[0]?.image_url || "",
    stock_status: getStockStatus(item.stock_quantity)
  }));
}

export async function getProductById(id) {
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      *,
      categories ( id, name ),
      product_images ( id, image_url, is_primary, sort_order )
    `
    )
    .eq("id", id)
    .single();

  if (error) throw error;
  return {
    ...data,
    cover_image:
      data.product_images?.find((img) => img.is_primary)?.image_url || data.product_images?.[0]?.image_url || "",
    stock_status: getStockStatus(data.stock_quantity)
  };
}

export function getStockStatus(stockQuantity = 0) {
  if (stockQuantity <= 0) return "Out of Stock";
  if (stockQuantity <= 5) return "Limited Stock";
  return "Available";
}

export async function createProduct(payload) {
  const { data, error } = await supabase.from("products").insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function updateProduct(id, payload) {
  const { data, error } = await supabase
    .from("products")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function archiveProduct(id) {
  return updateProduct(id, { is_archived: true });
}

export async function restoreProduct(id) {
  return updateProduct(id, { is_archived: false });
}

export async function deleteProduct(id) {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

export async function uploadProductImage(productId, file, { isPrimary = false, sortOrder = 0 } = {}) {
  const path = `products/${productId}/${Date.now()}-${file.name.replaceAll(/\s+/g, "-")}`;

  const { error: uploadError } = await supabase.storage.from("product-images").upload(path, file, {
    cacheControl: "3600",
    upsert: false
  });
  if (uploadError) throw uploadError;

  const {
    data: { publicUrl }
  } = supabase.storage.from("product-images").getPublicUrl(path);

  const { data, error } = await supabase
    .from("product_images")
    .insert({
      product_id: productId,
      image_url: publicUrl,
      storage_path: path,
      is_primary: isPrimary,
      sort_order: sortOrder
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteProductImage(imageRowId) {
  const { data, error } = await supabase
    .from("product_images")
    .select("id, storage_path")
    .eq("id", imageRowId)
    .single();

  if (error) throw error;

  if (data.storage_path) {
    await supabase.storage.from("product-images").remove([data.storage_path]);
  }

  const { error: deleteError } = await supabase.from("product_images").delete().eq("id", imageRowId);
  if (deleteError) throw deleteError;
}
