import { supabase } from "../supabaseClient.js";

export async function signUpCustomer({ fullName, phone, email, password }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone
      }
    }
  });

  if (error) throw error;

  if (data.user?.id) {
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        phone
      })
      .eq("id", data.user.id);

    if (profileError) {
      console.warn("Profile will be completed after email confirmation.", profileError.message);
    }
  }

  return data;
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function sendResetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/login.html`
  });
  if (error) throw error;
}

export async function getSession() {
  const {
    data: { session },
    error
  } = await supabase.auth.getSession();

  if (error) throw error;
  return session;
}

export async function getCurrentProfile(userId) {
  const session = await getSession();
  const id = userId || session?.user?.id;
  if (!id) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, phone, role, avatar_url, created_at")
    .eq("id", id)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data || null;
}

export async function updateProfile(id, payload) {
  const { data, error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function uploadProfileImage(userId, file) {
  const path = `profiles/${userId}/${Date.now()}-${file.name.replaceAll(/\s+/g, "-")}`;
  const { error: uploadError } = await supabase.storage.from("profile-images").upload(path, file, {
    cacheControl: "3600",
    upsert: true
  });

  if (uploadError) throw uploadError;

  return supabase.storage.from("profile-images").getPublicUrl(path).data.publicUrl;
}

export async function onAuthStateChange(callback) {
  const {
    data: { subscription }
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return subscription;
}
