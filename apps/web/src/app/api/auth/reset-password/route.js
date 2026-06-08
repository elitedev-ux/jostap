import { badRequest, json, readJson, unauthorized } from "../../utils/http.js";
import { normalizeEmail, verifyPasswordResetChallenge } from "../../utils/authSecurity.js";
import { hashPassword, validatePassword } from "../../utils/password.js";
import { authRateLimit } from "../../utils/rateLimit.js";
import { getSupabaseAdmin, hasSupabase } from "../../utils/supabase.js";

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
  const code = String(body.code || "").trim();
  const password = String(body.password || "");
  const limited = authRateLimit(request, "reset-password", email || "missing-email");
  if (limited) return limited;

  if (!email || !code || !password) {
    return badRequest("Email, reset code, and new password are required.");
  }

  if (!validatePassword(password)) {
    return badRequest("Password must include at least 8 characters, 1 capital letter, 1 number, and 1 symbol.");
  }

  const supabase = getSupabaseAdmin();
  const { data: user, error } = await supabase
    .from("users")
    .select("id,email,status")
    .ilike("email", email)
    .maybeSingle();

  if (error) throw error;
  if (!user || user.status !== "active") return unauthorized("Invalid or expired reset code.");

  const result = await verifyPasswordResetChallenge(supabase, user.id, code);
  if (!result.ok) return badRequest(result.error);

  const passwordHash = await hashPassword(password);
  const [{ error: updateError }, { error: sessionError }] = await Promise.all([
    supabase.from("users").update({ password_hash: passwordHash }).eq("id", user.id),
    supabase.from("sessions").delete().eq("user_id", user.id),
  ]);

  if (updateError || sessionError) throw updateError || sessionError;

  return json({ message: "Password reset successfully. Please sign in with your new password." });
}
