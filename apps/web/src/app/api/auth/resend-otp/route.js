import { badRequest, json, readJson } from "../../utils/http.js";
import { getSupabaseAdmin, hasSupabase } from "../../utils/supabase.js";
import { createEmailVerificationChallenge, normalizeEmail } from "../../utils/authSecurity.js";

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
    .select("id, email, email_verified_at")
    .ilike("email", email)
    .maybeSingle();

  if (error) throw error;

  if (!user || user.email_verified_at) {
    return json({ message: "If verification is needed, a new code has been sent." });
  }

  await createEmailVerificationChallenge(supabase, user);
  return json({ message: "A new verification code has been sent." });
}
