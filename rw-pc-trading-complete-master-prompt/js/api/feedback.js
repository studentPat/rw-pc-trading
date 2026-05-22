import { supabase } from "../supabaseClient.js";

export async function submitFeedback({ userId = null, name, contact, message }) {
  const { data, error } = await supabase
    .from("feedback")
    .insert({ user_id: userId, name, contact, message })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function listFeedback() {
  const { data, error } = await supabase
    .from("feedback")
    .select("id, name, contact, message, created_at, profiles ( full_name, email )")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function deleteFeedback(id) {
  const { error } = await supabase.from("feedback").delete().eq("id", id);
  if (error) throw error;
}