import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let adminClient;

export function hasSupabase() {
  return Boolean(supabaseUrl && supabaseServiceRoleKey);
}

export function getSupabaseAdmin() {
  if (!hasSupabase()) {
    throw new Error(
      "Supabase is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.",
    );
  }

  if (!adminClient) {
    adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return adminClient;
}

export function isUniqueViolation(error) {
  return error?.code === "23505" || /duplicate key/i.test(error?.message || "");
}

export function requireRow(data, error) {
  if (error) {
    throw error;
  }

  return data;
}
