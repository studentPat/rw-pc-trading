import { supabase } from "../supabaseClient.js";
import { getProductById } from "./products.js";

export async function listCartItems(userId) {
  const { data, error } = await supabase
    .from("cart_items")
    .select(
      `
      id,
      user_id,
      product_id,
      quantity,
      created_at,
      products (
        id,
        name,
        price,
        stock_quantity,
        is_archived,
        product_images ( id, image_url, is_primary, sort_order )
      )
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((item) => ({
    ...item,
    products: {
      ...item.products,
      cover_image:
        item.products?.product_images?.find((img) => img.is_primary)?.image_url ||
        item.products?.product_images?.[0]?.image_url ||
        ""
    }
  }));
}

export async function addToCart(userId, productId, quantity = 1) {
  const product = await getProductById(productId);
  if (product.is_archived || product.stock_quantity <= 0) {
    throw new Error("This item is currently unavailable.");
  }

  const { data: existing, error: existingError } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .maybeSingle();

  if (existingError) throw existingError;

  const targetQty = (existing?.quantity || 0) + quantity;
  if (targetQty > product.stock_quantity) {
    throw new Error("Requested quantity is higher than current stock.");
  }

  if (existing?.id) {
    const { error } = await supabase.from("cart_items").update({ quantity: targetQty }).eq("id", existing.id);
    if (error) throw error;
    return existing.id;
  }

  const { data, error } = await supabase
    .from("cart_items")
    .insert({ user_id: userId, product_id: productId, quantity })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

export async function updateCartQuantity(cartItemId, quantity) {
  if (quantity <= 0) {
    return removeCartItem(cartItemId);
  }

  const { data, error } = await supabase
    .from("cart_items")
    .select("id, product_id, quantity, user_id")
    .eq("id", cartItemId)
    .single();

  if (error) throw error;

  const product = await getProductById(data.product_id);
  if (quantity > product.stock_quantity) {
    throw new Error("Quantity exceeds available stock.");
  }

  const { error: updateError } = await supabase.from("cart_items").update({ quantity }).eq("id", cartItemId);
  if (updateError) throw updateError;
}

export async function removeCartItem(cartItemId) {
  const { error } = await supabase.from("cart_items").delete().eq("id", cartItemId);
  if (error) throw error;
}

export async function clearCart(userId) {
  const { error } = await supabase.from("cart_items").delete().eq("user_id", userId);
  if (error) throw error;
}

export function computeCartTotals(items = []) {
  const subtotal = items.reduce((sum, item) => sum + Number(item.products?.price || 0) * Number(item.quantity || 0), 0);
  const itemCount = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  return {
    subtotal,
    itemCount
  };
}