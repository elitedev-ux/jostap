import { randomUUID } from "node:crypto";
import { json } from "../../utils/http.js";

const STATE_COOKIE = "jostap_google_state";
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

function cookieFlags(request) {
  const secure =
    process.env.NODE_ENV === "production" || request.url.startsWith("https://");

  return [
    "HttpOnly",
    "Path=/",
    "SameSite=Lax",
    "Max-Age=600",
    secure ? "Secure" : "",
  ].filter(Boolean);
}

export async function GET(request) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return json(
      {
        error:
          "Google sign in is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
      },
      { status: 503 },
    );
  }

  const url = new URL(request.url);
  const state = randomUUID();
  const callbackUrl = new URL("/api/auth/google/callback", url.origin);
  const authUrl = new URL(GOOGLE_AUTH_URL);

  authUrl.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", callbackUrl.toString());
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("prompt", "select_account");

  return new Response(null, {
    status: 302,
    headers: {
      Location: authUrl.toString(),
      "Set-Cookie": `${STATE_COOKIE}=${encodeURIComponent(state)}; ${cookieFlags(request).join("; ")}`,
    },
  });
}
