import { supabase } from "../supabaseClient.js";
import { clearCart, listCartItems } from "./cart.js";

const DEPOSIT_RATE = 0.2;

export async function createReservationFromCart(userId, payload = {}) {
  const cartItems = await listCartItems(userId);
  if (!cartItems.length) {
    throw new Error("Your cart is empty.");
  }

  for (const item of cartItems) {
    if (!item.products || item.products.stock_quantity <= 0 || item.quantity > item.products.stock_quantity) {
      throw new Error(`Insufficient stock for ${item.products?.name || "an item"}.`);
    }
  }

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + Number(item.products.price || 0) * Number(item.quantity || 0),
    0
  );
  const depositAmount = Math.round(totalAmount * DEPOSIT_RATE * 100) / 100;

  const { data: reservation, error: reservationError } = await supabase
    .from("reservations")
    .insert({
      user_id: userId,
      total_amount: totalAmount,
      deposit_amount: depositAmount,
      status: "Pending Deposit",
      notes: payload.notes || null
    })
    .select()
    .single();

  if (reservationError) throw reservationError;

  const reservationItemsPayload = cartItems.map((item) => ({
    reservation_id: reservation.id,
    product_id: item.product_id,
    quantity: item.quantity,
    price_each: item.products.price,
    subtotal: Number(item.products.price) * Number(item.quantity)
  }));

  const { error: itemsError } = await supabase.from("reservation_items").insert(reservationItemsPayload);
  if (itemsError) throw itemsError;

  await clearCart(userId);
  return reservation;
}

export async function listUserReservations(userId) {
  const { data, error } = await supabase
    .from("reservations")
    .select(
      `
      id,
      status,
      total_amount,
      deposit_amount,
      notes,
      admin_notes,
      created_at,
      updated_at,
      reservation_items (
        id,
        quantity,
        price_each,
        subtotal,
        products ( id, name )
      ),
      payment_proofs (
        id,
        payment_method,
        status,
        image_url,
        reference_no,
        created_at
      )
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function listReservationsForAdmin() {
  const { data, error } = await supabase
    .from("reservations")
    .select(
      `
      id,
      status,
      total_amount,
      deposit_amount,
      notes,
      admin_notes,
      created_at,
      updated_at,
      user_id,
      profiles ( id, full_name, email, phone ),
      reservation_items (
        id,
        quantity,
        price_each,
        subtotal,
        products ( id, name )
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function uploadPaymentProof({ reservationId, userId, file, paymentMethod, referenceNo, note }) {
  const path = `payment-proofs/${userId}/${reservationId}/${Date.now()}-${file.name.replaceAll(/\s+/g, "-")}`;

  const { error: uploadError } = await supabase.storage.from("payment-proofs").upload(path, file, {
    cacheControl: "3600"
  });
  if (uploadError) throw uploadError;

  const {
    data: { publicUrl }
  } = supabase.storage.from("payment-proofs").getPublicUrl(path);

  const { data, error } = await supabase
    .from("payment_proofs")
    .insert({
      reservation_id: reservationId,
      uploaded_by: userId,
      payment_method: paymentMethod,
      reference_no: referenceNo,
      note,
      image_url: publicUrl,
      storage_path: path,
      status: "pending"
    })
    .select()
    .single();

  if (error) throw error;

  await supabase.from("reservations").update({ status: "Under Verification" }).eq("id", reservationId);

  return data;
}

export async function listPaymentProofsForAdmin() {
  const { data, error } = await supabase
    .from("payment_proofs")
    .select(
      `
      id,
      reservation_id,
      payment_method,
      reference_no,
      note,
      image_url,
      status,
      created_at,
      reservations ( id, status, user_id, total_amount, deposit_amount, profiles ( full_name, email ) )
    `
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function reviewPaymentProof({ proofId, reservationId, approve, adminNote }) {
  const targetStatus = approve ? "approved" : "rejected";

  const { error: proofError } = await supabase
    .from("payment_proofs")
    .update({ status: targetStatus, admin_note: adminNote || null })
    .eq("id", proofId);

  if (proofError) throw proofError;

  if (approve) {
    const { error: rpcError } = await supabase.rpc("admin_approve_reservation", {
      p_reservation_id: reservationId,
      p_admin_note: adminNote || null
    });

    if (rpcError) throw rpcError;
  } else {
    const { error: resError } = await supabase
      .from("reservations")
      .update({ status: "Rejected", admin_notes: adminNote || null })
      .eq("id", reservationId);

    if (resError) throw resError;
  }
}

export async function updateReservationStatus(reservationId, status, adminNotes = null) {
  if (status === "Approved") {
    const { error: rpcError } = await supabase.rpc("admin_approve_reservation", {
      p_reservation_id: reservationId,
      p_admin_note: adminNotes
    });

    if (rpcError) throw rpcError;
    return;
  }

  const { error } = await supabase
    .from("reservations")
    .update({ status, admin_notes: adminNotes })
    .eq("id", reservationId);

  if (error) throw error;
}
