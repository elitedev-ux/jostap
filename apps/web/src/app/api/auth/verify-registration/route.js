import { badRequest, json, readJson, unauthorized } from "../../utils/http.js";
import { createSession } from "../../utils/session.js";
import { getSupabaseAdmin, hasSupabase } from "../../utils/supabase.js";
import { normalizeEmail, verifyEmailChallenge } from "../../utils/authSecurity.js";

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

  if (!email || !code) {
    return badRequest("Email and verification code are required.");
  }

  const supabase = getSupabaseAdmin();
  const { data: user, error } = await supabase
    .from("users")
    .select("id, first_name, last_name, company, email, role, status, email_verified_at, created_at")
    .ilike("email", email)
    .maybeSingle();

  if (error) throw error;
  if (!user) return unauthorized("Invalid verification code.");

  const result = await verifyEmailChallenge(supabase, user.id, code);

  if (!result.ok) {
    return badRequest(result.error);
  }

  const verifiedUser = { ...user, email_verified_at: new Date().toISOString() };
  const session = await createSession(user.id, request);
  await supabase.from("users").update({ last_login_at: new Date().toISOString() }).eq("id", user.id);

  return json(
    { user: verifiedUser },
    {
      headers: {
        "Set-Cookie": session.cookie,
      },
    },
  );
}
