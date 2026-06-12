import { badRequest, json, readJson, unauthorized } from "../../utils/http.js";
import { hashPassword, validatePassword, verifyPassword } from "../../utils/password.js";
import { authRateLimit } from "../../utils/rateLimit.js";
import { clearSessionCookie, getSessionUser } from "../../utils/session.js";
import { getSupabaseAdmin, hasSupabase } from "../../utils/supabase.js";

export async function PATCH(request) {
  if (!hasSupabase()) {
    return json(
      { error: "Supabase is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env." },
      { status: 503 },
    );
  }

  const user = await getSessionUser(request);

  if (!user) {
    return unauthorized();
  }

  const limited = authRateLimit(request, "account-password", user.id, {
    limit: 6,
    windowMs: 15 * 60_000,
  });
  if (limited) return limited;

  const body = await readJson(request);
  if (!body) return badRequest("Invalid request body.");

  const currentPassword = String(body.currentPassword || "");
  const newPassword = String(body.newPassword || "");

  if (!currentPassword || !newPassword) {
    return badRequest("Current password and new password are required.");
  }

  if (!validatePassword(newPassword)) {
    return badRequest("Password must include at least 8 characters, 1 capital letter, 1 number, and 1 symbol.");
  }

  if (currentPassword === newPassword) {
    return badRequest("New password must be different from your current password.");
  }

  const supabase = getSupabaseAdmin();
  const { data: record, error: lookupError } = await supabase
    .from("users")
    .select("id, password_hash")
    .eq("id", user.id)
    .maybeSingle();

  if (lookupError) throw lookupError;

  if (!record || !(await verifyPassword(record.password_hash, currentPassword))) {
    return unauthorized("Current password is incorrect.");
  }

  const passwordHash = await hashPassword(newPassword);
  const [{ error: updateError }, { error: sessionError }] = await Promise.all([
    supabase
      .from("users")
      .update({ password_hash: passwordHash })
      .eq("id", user.id),
    supabase.from("sessions").delete().eq("user_id", user.id),
  ]);

  if (updateError || sessionError) throw updateError || sessionError;

  return json(
    { message: "Password updated successfully. Please sign in again." },
    {
      headers: {
        "Set-Cookie": clearSessionCookie(request),
      },
    },
  );
}
