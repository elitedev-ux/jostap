import { createHash, randomBytes } from "node:crypto";
import { getSupabaseAdmin, hasSupabase } from "./supabase.js";

export const SESSION_COOKIE = "jostap_session";
const SESSION_DAYS = Math.min(
  Math.max(Number.parseInt(process.env.SESSION_DAYS || "14", 10) || 14, 1),
  30,
);

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function parseCookie(header) {
  return Object.fromEntries(
    (header || "")
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        const rawValue = index === -1 ? "" : part.slice(index + 1);
        let value = rawValue;

        try {
          value = decodeURIComponent(rawValue);
        } catch {
          value = rawValue;
        }

        return index === -1
          ? [part, ""]
          : [part.slice(0, index), value];
      }),
  );
}

function cookieFlags(request) {
  const secure =
    process.env.NODE_ENV === "production" || request.url.startsWith("https://");

  return [
    "HttpOnly",
    "Path=/",
    "SameSite=Lax",
    "Priority=High",
    secure ? "Secure" : "",
  ].filter(Boolean);
}

export async function createSession(userId, request) {
  const supabase = getSupabaseAdmin();
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  const { error } = await supabase.from("sessions").insert({
    user_id: userId,
    token_hash: tokenHash,
    expires_at: expiresAt.toISOString(),
  });

  if (error) {
    throw error;
  }

  return {
    token,
    cookie: [
      `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
      `Max-Age=${SESSION_DAYS * 24 * 60 * 60}`,
      ...cookieFlags(request),
    ].join("; "),
  };
}

export function clearSessionCookie(request) {
  return [
    `${SESSION_COOKIE}=`,
    "Max-Age=0",
    ...cookieFlags(request),
  ].join("; ");
}

export async function destroySession(request) {
  if (!hasSupabase()) {
    return;
  }

  const supabase = getSupabaseAdmin();
  const token = parseCookie(request.headers.get("Cookie"))[SESSION_COOKIE];

  if (token) {
    const { error } = await supabase
      .from("sessions")
      .delete()
      .eq("token_hash", hashToken(token));

    if (error) {
      throw error;
    }
  }
}

export async function getSessionUser(request) {
  if (!hasSupabase()) {
    return null;
  }

  const supabase = getSupabaseAdmin();
  const token = parseCookie(request.headers.get("Cookie"))[SESSION_COOKIE];

  if (!token) {
    return null;
  }

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("user_id, expires_at")
    .eq("token_hash", hashToken(token))
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (sessionError) {
    throw sessionError;
  }

  if (!session) {
    return null;
  }

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, first_name, last_name, company, email, role, status, email_verified_at, created_at")
    .eq("id", session.user_id)
    .maybeSingle();

  if (userError) {
    throw userError;
  }

  if (user?.status === "suspended") {
    return null;
  }

  return user || null;
}
