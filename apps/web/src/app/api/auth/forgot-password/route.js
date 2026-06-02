import { badRequest, json, readJson } from "../../utils/http.js";
import { createPasswordResetChallenge, normalizeEmail } from "../../utils/authSecurity.js";
import { getSupabaseAdmin, hasSupabase } from "../../utils/supabase.js";

const GENERIC_MESSAGE = "If an account exists for that email, a reset code has been sent.";

export async function POST(request) {
  if (!hasSupabase()) {
    return json(
      { error: "Supabase is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env." },
      { status: 503 },
    );
  }

  const body = await readJson(request);
  if (!body) return badRequest("Invalid request body.");

  const email = normalizeEmail(body.email);
  if (!email) return badRequest("Email is required.");

  const supabase = getSupabaseAdmin();
  const { data: user, error } = await supabase
    .from("users")
    .select("id,email,status")
    .ilike("email", email)
    .maybeSingle();

  if (error) throw error;

  if (user?.status === "active") {
    await createPasswordResetChallenge(supabase, user);
  }

  return json({ message: GENERIC_MESSAGE });
}
