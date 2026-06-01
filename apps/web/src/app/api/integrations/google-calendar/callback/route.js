import { badRequest } from "../../../utils/http.js";
import { getSessionUser } from "../../../utils/session.js";
import { getSupabaseAdmin, hasSupabase } from "../../../utils/supabase.js";
import { googleCalendarCallbackUrl, hasGoogleCalendarConfig } from "../../../utils/googleCalendar.js";

const STATE_COOKIE = "jostap_google_calendar_state";
const RETURN_COOKIE = "jostap_google_calendar_return_to";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

function parseCookie(header) {
  return Object.fromEntries(
    (header || "")
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        return index === -1
          ? [part, ""]
          : [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
      }),
  );
}

function clearCookie(name, request) {
  const secure =
    process.env.NODE_ENV === "production" || request.url.startsWith("https://");

  return [
    `${name}=`,
    "Max-Age=0",
    "Path=/",
    "SameSite=Lax",
    "HttpOnly",
    secure ? "Secure" : "",
  ].filter(Boolean).join("; ");
}

function safeReturnTo(value) {
  if (!value || typeof value !== "string") return "/dashboard/appointments";
  if (!value.startsWith("/") || value.startsWith("//")) return "/dashboard/appointments";
  return value;
}

function redirectWithMessage(request, message, kind = "error") {
  const url = new URL("/dashboard/appointments", request.url);
  url.searchParams.set(kind, message);
  const headers = new Headers({ Location: url.toString() });
  headers.append("Set-Cookie", clearCookie(STATE_COOKIE, request));
  headers.append("Set-Cookie", clearCookie(RETURN_COOKIE, request));
  return new Response(null, { status: 302, headers });
}

export async function GET(request) {
  if (!hasSupabase()) return badRequest("Supabase is not configured.");
  if (!hasGoogleCalendarConfig()) return badRequest("Google Calendar is not configured.");

  const user = await getSessionUser(request);
  if (!user) {
    const signInUrl = new URL("/auth/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", "/dashboard/appointments");
    signInUrl.searchParams.set("error", "Sign in to connect Google Calendar.");
    return new Response(null, {
      status: 302,
      headers: { Location: signInUrl.toString() },
    });
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookies = parseCookie(request.headers.get("Cookie"));
  const storedState = cookies[STATE_COOKIE];
  const returnTo = safeReturnTo(cookies[RETURN_COOKIE]);

  if (!code || !state || !storedState || state !== storedState) {
    return redirectWithMessage(request, "Google Calendar connect could not be verified.");
  }

  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      code,
      grant_type: "authorization_code",
      redirect_uri: googleCalendarCallbackUrl(request),
    }),
  });

  if (!tokenResponse.ok) {
    return redirectWithMessage(request, "Google Calendar authorization failed.");
  }

  const tokenData = await tokenResponse.json();
  const profileResponse = await fetch(GOOGLE_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
    },
  });

  if (!profileResponse.ok) {
    return redirectWithMessage(request, "Google account details could not be loaded.");
  }

  const profile = await profileResponse.json();
  const googleEmail = String(profile.email || "").trim().toLowerCase() || null;

  const expiresAt = tokenData.expires_in
    ? new Date(Date.now() + Number(tokenData.expires_in) * 1000).toISOString()
    : null;

  const supabase = getSupabaseAdmin();
  const { data: existing, error: existingError } = await supabase
    .from("google_calendar_connections")
    .select("id,refresh_token")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingError) throw existingError;

  const payload = {
    user_id: user.id,
    google_email: googleEmail,
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token || existing?.refresh_token || null,
    token_type: tokenData.token_type || null,
    scope: tokenData.scope || null,
    expires_at: expiresAt,
  };

  const query = existing
    ? supabase.from("google_calendar_connections").update(payload).eq("id", existing.id)
    : supabase.from("google_calendar_connections").insert(payload);

  const { error } = await query;
  if (error) throw error;

  const destination = new URL(returnTo, url.origin);
  destination.searchParams.set("success", "Google Calendar connected.");

  const headers = new Headers({ Location: destination.toString() });
  headers.append("Set-Cookie", clearCookie(STATE_COOKIE, request));
  headers.append("Set-Cookie", clearCookie(RETURN_COOKIE, request));
  return new Response(null, { status: 302, headers });
}
