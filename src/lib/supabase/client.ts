import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Server-only client (service role key). Never import this from a
// client component — the key must not reach the browser bundle.
let cached: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return null;

  if (!cached) {
    cached = createClient(url, key, {
      auth: { persistSession: false },
    });
  }
  return cached;
}
