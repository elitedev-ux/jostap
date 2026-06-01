import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { sendOtpEmail } from "./email.js";

const OTP_MINUTES = 10;
const OTP_DIGITS = 6;
const TOTP_STEP_SECONDS = 30;
const TOTP_DIGITS = 6;
const TOTP_WINDOW = 1;
const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

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

export async function createTwoFactorLoginChallenge(supabase, userId) {
  const { data, error } = await supabase
    .from("auth_challenges")
    .insert({
      user_id: userId,
      purpose: "two_factor_login",
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    })
    .select("id")
    .single();

  if (error) throw error;
  return data;
}

export function generateTotpSecret() {
  const bytes = randomBytes(20);
  let bits = "";
  let output = "";

  for (const byte of bytes) {
    bits += byte.toString(2).padStart(8, "0");
  }

  for (let index = 0; index + 5 <= bits.length; index += 5) {
    output += BASE32[parseInt(bits.slice(index, index + 5), 2)];
  }

  return output;
}

function base32ToBuffer(secret) {
  const clean = String(secret || "").replace(/=+$/g, "").toUpperCase();
  let bits = "";

  for (const char of clean) {
    const value = BASE32.indexOf(char);
    if (value === -1) continue;
    bits += value.toString(2).padStart(5, "0");
  }

  const bytes = [];
  for (let index = 0; index + 8 <= bits.length; index += 8) {
    bytes.push(parseInt(bits.slice(index, index + 8), 2));
  }

  return Buffer.from(bytes);
}

function totpAt(secret, counter) {
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));

  const hmac = createHmac("sha1", base32ToBuffer(secret)).update(buffer).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return String(binary % 10 ** TOTP_DIGITS).padStart(TOTP_DIGITS, "0");
}

export function verifyTotp(secret, code) {
  const cleanCode = String(code || "").replace(/\s+/g, "");
  const currentCounter = Math.floor(Date.now() / 1000 / TOTP_STEP_SECONDS);

  for (let offset = -TOTP_WINDOW; offset <= TOTP_WINDOW; offset += 1) {
    if (safeEqual(totpAt(secret, currentCounter + offset), cleanCode)) {
      return true;
    }
  }

  return false;
}

export function totpUri({ email, secret }) {
  const label = encodeURIComponent(`JOSTAP:${email}`);
  const issuer = encodeURIComponent("JOSTAP");

  return `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&digits=${TOTP_DIGITS}&period=${TOTP_STEP_SECONDS}`;
}
