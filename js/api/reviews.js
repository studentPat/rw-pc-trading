import { supabase } from "../supabaseClient.js";

export async function submitReview({ userId, reservationId, rating, message, proofFile }) {
  let image_url = null;
  let storage_path = null;

  if (proofFile?.size) {
    storage_path = `reviews/${userId}/${Date.now()}-${proofFile.name.replaceAll(/\s+/g, "-")}`;
    const { error: uploadError } = await supabase.storage.from("review-proofs").upload(storage_path, proofFile);
    if (uploadError) throw uploadError;

    image_url = supabase.storage.from("review-proofs").getPublicUrl(storage_path).data.publicUrl;
  }

  const { data, error } = await supabase
    .from("reviews")
    .insert({
      user_id: userId,
      reservation_id: reservationId || null,
      rating,
      message,
      image_url,
      storage_path,
      status: "pending"
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function listPublicReviews(limit = 12) {
  const { data, error } = await supabase
    .from("reviews")
    .select("id, rating, message, image_url, created_at, profiles ( full_name, avatar_url )")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function listAdminReviews() {
  const { data, error } = await supabase
    .from("reviews")
    .select(
      "id, user_id, rating, message, image_url, status, created_at, profiles ( full_name, email ), reservations ( id )"
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function updateReviewStatus(id, status) {
  const { error } = await supabase.from("reviews").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function deleteReview(id) {
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) throw error;
}
