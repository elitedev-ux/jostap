import { badRequest, json, readJson, unauthorized } from "../../utils/http.js";
import { createSession } from "../../utils/session.js";
import { verifyPassword } from "../../utils/password.js";
import { getSupabaseAdmin, hasSupabase } from "../../utils/supabase.js";
import { authRateLimit } from "../../utils/rateLimit.js";
import {
  createEmailVerificationChallenge,
  normalizeEmail,
} from "../../utils/authSecurity.js";

export async function POST(request) {
  if (!hasSupabase()) {
    return json(
      { error: "Supabase is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env." },
      { status: 503 },
    );
  }

  const body = await readJson(request);

  if (!body) {
    return badRequest("Invalid request body.");
  }

  const email = normalizeEmail(body.email);
  const password = String(body.password || "");
  const limited = authRateLimit(request, "signin", email || "missing-email");
  if (limited) return limited;

  if (!email || !password) {
    return badRequest("Email and password are required.");
  }

  const supabase = getSupabaseAdmin();
  const { data: record, error } = await supabase
    .from("users")
    .select("id, first_name, last_name, company, email, role, status, password_hash, email_verified_at, created_at")
    .ilike("email", email)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!record || !(await verifyPassword(record.password_hash, password))) {
    return unauthorized("Invalid email or password.");
  }

  if (record.status === "suspended") {
    return unauthorized("This account has been suspended.");
  }

  const { password_hash: _passwordHash, ...user } = record;

  if (!record.email_verified_at) {
    await createEmailVerificationChallenge(supabase, record);

    return json({
      requiresVerification: true,
      email: record.email,
      message: "Enter the verification code sent to your email.",
    });
  }

  const session = await createSession(user.id, request);
  await supabase.from("users").update({ last_login_at: new Date().toISOString() }).eq("id", user.id);

  return json(
    { user },
    {
      headers: {
        "Set-Cookie": session.cookie,
      },
    },
  );
}
