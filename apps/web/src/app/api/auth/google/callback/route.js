import { createSession } from "../../../utils/session.js";
import { getSupabaseAdmin, hasSupabase } from "../../../utils/supabase.js";
import { createEmailVerificationChallenge } from "../../../utils/authSecurity.js";

const STATE_COOKIE = "jostap_google_state";
const RETURN_COOKIE = "jostap_google_return_to";
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

function cookieDomainFlag(request) {
  const hostname = new URL(request.url).hostname.toLowerCase();

  return hostname === "jostap.com" || hostname.endsWith(".jostap.com")
    ? "Domain=.jostap.com"
    : "";
}

function clearCookie(request, name, includeDomain = false) {
  const secure =
    process.env.NODE_ENV === "production" || request.url.startsWith("https://");

  return [
    `${name}=`,
    "Max-Age=0",
    "Path=/",
    "SameSite=Lax",
    "HttpOnly",
    includeDomain ? cookieDomainFlag(request) : "",
    secure ? "Secure" : "",
  ].filter(Boolean).join("; ");
}

function appendGoogleCookieClears(headers, request) {
  headers.append("Set-Cookie", clearCookie(request, STATE_COOKIE));
  headers.append("Set-Cookie", clearCookie(request, RETURN_COOKIE));

  if (cookieDomainFlag(request)) {
    headers.append("Set-Cookie", clearCookie(request, STATE_COOKIE, true));
    headers.append("Set-Cookie", clearCookie(request, RETURN_COOKIE, true));
  }
}

function safeReturnTo(value) {
  if (!value || typeof value !== "string") {
    return "/dashboard";
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

function destinationForUser(user, returnTo, isNewUser) {
  if (isNewUser) {
    return "/kyc";
  }

  if (returnTo && returnTo !== "/dashboard") {
    return returnTo;
  }

  return user?.role === "admin" ? "/admin" : "/dashboard";
}

function appOrigin(request) {
  return (
    process.env.GOOGLE_REDIRECT_ORIGIN ||
    process.env.APP_ORIGIN ||
    new URL(request.url).origin
  ).replace(/\/$/, "");
}

function redirectWithError(request, message) {
  const url = new URL("/auth/signin", request.url);
  url.searchParams.set("error", message);
  const headers = new Headers({
    Location: url.toString(),
  });

  appendGoogleCookieClears(headers, request);

  return new Response(null, {
    status: 302,
    headers,
  });
}

function redirectForEmailVerification(request, user, returnTo) {
  const url = new URL("/auth/signin", request.url);
  url.searchParams.set("verifyEmail", user.email);
  url.searchParams.set("callbackUrl", returnTo || "/dashboard");

  const headers = new Headers({
    Location: url.toString(),
  });

  appendGoogleCookieClears(headers, request);

  return new Response(null, {
    status: 302,
    headers,
  });
}

function splitName(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);

  return {
    firstName: parts[0] || "Google",
    lastName: parts.slice(1).join(" ") || "User",
  };
}

export async function GET(request) {
  if (!hasSupabase()) {
    return redirectWithError(request, "Supabase is not configured.");
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return redirectWithError(request, "Google sign in is not configured.");
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookies = parseCookie(request.headers.get("Cookie"));
  const storedState = cookies[STATE_COOKIE];
  const returnTo = safeReturnTo(cookies[RETURN_COOKIE]);

  if (!code || !state || !storedState || state !== storedState) {
    return redirectWithError(request, "Google sign in could not be verified.");
  }

  const callbackUrl = new URL("/api/auth/google/callback", appOrigin(request));
  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: callbackUrl.toString(),
    }),
  });

  if (!tokenResponse.ok) {
    return redirectWithError(request, "Google sign in failed.");
  }

  const tokenData = await tokenResponse.json();
  const profileResponse = await fetch(GOOGLE_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
    },
  });

  if (!profileResponse.ok) {
    return redirectWithError(request, "Google profile could not be loaded.");
  }

  const profile = await profileResponse.json();
  const email = String(profile.email || "").trim().toLowerCase();

  if (!email || profile.email_verified === false) {
    return redirectWithError(request, "Google account email is not verified.");
  }

  const supabase = getSupabaseAdmin();
  const { data: existingUser, error: existingError } = await supabase
    .from("users")
    .select("id, first_name, last_name, company, email, role, status, email_verified_at, created_at")
    .ilike("email", email)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  let user = existingUser;
  let isNewUser = false;

  if (!user) {
    const { firstName, lastName } = splitName(profile.name);
    const { data: insertedUser, error: insertError } = await supabase
      .from("users")
      .insert({
        first_name: firstName,
        last_name: lastName,
        company: null,
        email,
        password_hash: `google:${profile.sub}`,
      })
      .select("id, first_name, last_name, company, email, role, status, email_verified_at, created_at")
      .single();

    if (insertError) {
      throw insertError;
    }

    user = insertedUser;
    isNewUser = true;
  }

  if (user.status === "suspended") {
    return redirectWithError(request, "This account has been suspended.");
  }

  if (!user.email_verified_at) {
    await createEmailVerificationChallenge(supabase, user);
    return redirectForEmailVerification(request, user, isNewUser ? "/kyc" : returnTo);
  }

  const session = await createSession(user.id, request);
  const headers = new Headers({
    Location: new URL(destinationForUser(user, returnTo, isNewUser), url.origin).toString(),
  });

  appendGoogleCookieClears(headers, request);
  headers.append("Set-Cookie", session.cookie);

  return new Response(null, {
    status: 302,
    headers,
  });
}
