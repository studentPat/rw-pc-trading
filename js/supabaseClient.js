import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ENV } from "./env.js";

const isConfigured =
  ENV.SUPABASE_URL &&
  ENV.SUPABASE_ANON_KEY &&
  !ENV.SUPABASE_URL.includes("YOUR-PROJECT") &&
  !ENV.SUPABASE_ANON_KEY.includes("YOUR-ANON-KEY");

export const supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

export function assertSupabaseConfig() {
  if (!isConfigured) {
    throw new Error("Supabase is not configured. Update js/env.js with your project URL and anon key.");
  }
}

export function hasSupabaseConfig() {
  return isConfigured;
}