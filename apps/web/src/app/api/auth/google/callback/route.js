import sql, { hasDatabase } from "../../../utils/sql.js";
import { createSession } from "../../../utils/session.js";

const STATE_COOKIE = "jostap_google_state";
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

function clearStateCookie(request) {
  const secure =
    process.env.NODE_ENV === "production" || request.url.startsWith("https://");

  return [
    `${STATE_COOKIE}=`,
    "Max-Age=0",
    "Path=/",
    "SameSite=Lax",
    "HttpOnly",
    secure ? "Secure" : "",
  ].filter(Boolean).join("; ");
}

function redirectWithError(request, message) {
  const url = new URL("/auth/signin", request.url);
  url.searchParams.set("error", message);

  return new Response(null, {
    status: 302,
    headers: {
      Location: url.toString(),
      "Set-Cookie": clearStateCookie(request),
    },
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
  if (!hasDatabase()) {
    return redirectWithError(request, "Database is not configured.");
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return redirectWithError(request, "Google sign in is not configured.");
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const storedState = parseCookie(request.headers.get("Cookie"))[STATE_COOKIE];

  if (!code || !state || !storedState || state !== storedState) {
    return redirectWithError(request, "Google sign in could not be verified.");
  }

  const callbackUrl = new URL("/api/auth/google/callback", url.origin);
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

  const [existingUser] = await sql(
    `SELECT id, first_name, last_name, company, email, role, created_at
     FROM users
     WHERE lower(email) = lower($1)
     LIMIT 1`,
    [email],
  );

  let user = existingUser;

  if (!user) {
    const { firstName, lastName } = splitName(profile.name);
    [user] = await sql(
      `INSERT INTO users (first_name, last_name, company, email, password_hash)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, first_name, last_name, company, email, role, created_at`,
      [firstName, lastName, null, email, `google:${profile.sub}`],
    );
  }

  const session = await createSession(user.id, request);
  const headers = new Headers({
    Location: new URL("/dashboard", url.origin).toString(),
  });

  headers.append("Set-Cookie", clearStateCookie(request));
  headers.append("Set-Cookie", session.cookie);

  return new Response(null, {
    status: 302,
    headers,
  });
}
