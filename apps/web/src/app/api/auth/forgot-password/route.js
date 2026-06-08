import { badRequest, json, readJson } from "../../utils/http.js";
import { createPasswordResetChallenge, normalizeEmail } from "../../utils/authSecurity.js";
import { hasEmailDelivery } from "../../utils/email.js";
import { authRateLimit } from "../../utils/rateLimit.js";
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

  const limited = authRateLimit(request, "forgot-password", email, {
    limit: 4,
    windowMs: 30 * 60_000,
  });
  if (limited) return limited;

  if (!hasEmailDelivery()) {
    return json(
      { error: "Password reset email is not configured. Add RESEND_API_KEY or POSTMARK_SERVER_TOKEN in your hosting environment." },
      { status: 503 },
    );
  }

  const supabase = getSupabaseAdmin();
  const { data: user, error } = await supabase
    .from("users")
    .select("id,email,status")
    .ilike("email", email)
    .maybeSingle();

  if (error) throw error;

  if (user?.status === "active") {
    try {
      await createPasswordResetChallenge(supabase, user);
    } catch (error) {
      if (/email failed|email is not configured/i.test(error?.message || "")) {
        console.error("[forgot-password:email]", error);
        return json(
          { error: "Password reset email could not be sent. Check your RESEND_API_KEY or POSTMARK_SERVER_TOKEN settings." },
          { status: 502 },
        );
      }

      throw error;
    }
  }

  return json({ message: GENERIC_MESSAGE });
}
