import { badRequest, json, readJson, unauthorized } from "../../../utils/http.js";
import { createSession, getSessionUser } from "../../../utils/session.js";
import { getSupabaseAdmin } from "../../../utils/supabase.js";
import { verifyTotp } from "../../../utils/authSecurity.js";

async function verifyLoginChallenge(supabase, request, challengeId, code) {
  const { data: challenge, error } = await supabase
    .from("auth_challenges")
    .select("*")
    .eq("id", challengeId)
    .eq("purpose", "two_factor_login")
    .is("consumed_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (error) throw error;
  if (!challenge) return unauthorized("Two-factor challenge expired. Sign in again.");

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, first_name, last_name, company, email, role, status, email_verified_at, two_factor_enabled, two_factor_secret, created_at")
    .eq("id", challenge.user_id)
    .maybeSingle();

  if (userError) throw userError;
  if (!user || user.status === "suspended") return unauthorized("Invalid two-factor challenge.");

  if (!verifyTotp(user.two_factor_secret, code)) {
    await supabase
      .from("auth_challenges")
      .update({ attempts: Number(challenge.attempts || 0) + 1 })
      .eq("id", challenge.id);

    return badRequest("Invalid two-factor code.");
  }

  await supabase
    .from("auth_challenges")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", challenge.id);

  const { two_factor_secret: _secret, ...safeUser } = user;
  const session = await createSession(user.id, request);
  await supabase.from("users").update({ last_login_at: new Date().toISOString() }).eq("id", user.id);

  return json(
    { user: safeUser },
    {
      headers: {
        "Set-Cookie": session.cookie,
      },
    },
  );
}

export async function POST(request) {
  const body = await readJson(request);

  if (!body) return badRequest("Invalid request body.");

  const code = String(body.code || "").trim();
  const challengeId = String(body.challengeId || "").trim();

  if (!code) return badRequest("Two-factor code is required.");

  const supabase = getSupabaseAdmin();

  if (challengeId) {
    return verifyLoginChallenge(supabase, request, challengeId, code);
  }

  const user = await getSessionUser(request);
  if (!user) return unauthorized();

  const { data: record, error } = await supabase
    .from("users")
    .select("id, two_factor_secret")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (!record?.two_factor_secret) return badRequest("Start two-factor setup first.");

  if (!verifyTotp(record.two_factor_secret, code)) {
    return badRequest("Invalid two-factor code.");
  }

  const { error: updateError } = await supabase
    .from("users")
    .update({
      two_factor_enabled: true,
      two_factor_verified_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (updateError) throw updateError;

  return json({ enabled: true });
}
