import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { sendOtpEmail } from "./email.js";

const OTP_MINUTES = 10;
const PASSWORD_RESET_OTP_MINUTES = 15;
const OTP_DIGITS = 6;

export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function generateOtp() {
  return String(randomInt(0, 10 ** OTP_DIGITS)).padStart(OTP_DIGITS, "0");
}

function hashCode(code) {
  return createHash("sha256")
    .update(String(code || ""))
    .digest("hex");
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));

  return left.length === right.length && timingSafeEqual(left, right);
}

export async function createEmailVerificationChallenge(supabase, user) {
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_MINUTES * 60 * 1000).toISOString();

  await supabase
    .from("auth_challenges")
    .update({ consumed_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("purpose", "email_verification")
    .is("consumed_at", null);

  const { data, error } = await supabase
    .from("auth_challenges")
    .insert({
      user_id: user.id,
      purpose: "email_verification",
      code_hash: hashCode(code),
      expires_at: expiresAt,
    })
    .select("id")
    .single();

  if (error) throw error;

  await sendOtpEmail({ to: user.email, code, purpose: "verify" });
  return data;
}

export async function createPasswordResetChallenge(supabase, user) {
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_OTP_MINUTES * 60 * 1000).toISOString();

  await supabase
    .from("auth_challenges")
    .update({ consumed_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("purpose", "password_reset")
    .is("consumed_at", null);

  const { data, error } = await supabase
    .from("auth_challenges")
    .insert({
      user_id: user.id,
      purpose: "password_reset",
      code_hash: hashCode(code),
      expires_at: expiresAt,
    })
    .select("id")
    .single();

  if (error) throw error;

  await sendOtpEmail({ to: user.email, code, purpose: "password_reset" });
  return data;
}

export async function verifyPasswordResetChallenge(supabase, userId, code, { consume = true } = {}) {
  const { data: challenge, error } = await supabase
    .from("auth_challenges")
    .select("*")
    .eq("user_id", userId)
    .eq("purpose", "password_reset")
    .is("consumed_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  if (!challenge) {
    return { ok: false, error: "Reset code expired. Request a new code." };
  }

  if (challenge.attempts >= 5) {
    return { ok: false, error: "Too many attempts. Request a new reset code." };
  }

  const ok = safeEqual(challenge.code_hash, hashCode(code));

  if (!ok) {
    await supabase
      .from("auth_challenges")
      .update({ attempts: Number(challenge.attempts || 0) + 1 })
      .eq("id", challenge.id);

    return { ok: false, error: "Invalid reset code." };
  }

  if (consume) {
    await supabase
      .from("auth_challenges")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", challenge.id);
  }

  return { ok: true, challengeId: challenge.id };
}

export async function verifyEmailChallenge(supabase, userId, code) {
  const { data: challenge, error } = await supabase
    .from("auth_challenges")
    .select("*")
    .eq("user_id", userId)
    .eq("purpose", "email_verification")
    .is("consumed_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  if (!challenge) {
    return { ok: false, error: "Verification code expired. Request a new code." };
  }

  if (challenge.attempts >= 5) {
    return { ok: false, error: "Too many attempts. Request a new code." };
  }

  const ok = safeEqual(challenge.code_hash, hashCode(code));

  if (!ok) {
    await supabase
      .from("auth_challenges")
      .update({ attempts: Number(challenge.attempts || 0) + 1 })
      .eq("id", challenge.id);

    return { ok: false, error: "Invalid verification code." };
  }

  const now = new Date().toISOString();
  const [{ error: updateUserError }, { error: updateChallengeError }] = await Promise.all([
    supabase.from("users").update({ email_verified_at: now }).eq("id", userId),
    supabase.from("auth_challenges").update({ consumed_at: now }).eq("id", challenge.id),
  ]);

  if (updateUserError || updateChallengeError) {
    throw updateUserError || updateChallengeError;
  }

  return { ok: true };
}
