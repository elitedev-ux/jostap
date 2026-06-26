import { randomUUID } from "node:crypto";
import { json } from "../../utils/http.js";
import { appOrigin } from "../../utils/origin.js";

const STATE_COOKIE = "jostap_google_state";
const RETURN_COOKIE = "jostap_google_return_to";
const INTENT_COOKIE = "jostap_google_intent";
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

function cookieFlags(request) {
  const hostname = new URL(request.url).hostname.toLowerCase();
  const secure =
    process.env.NODE_ENV === "production" || request.url.startsWith("https://");

  return [
    "HttpOnly",
    "Path=/",
    "SameSite=Lax",
    "Max-Age=600",
    hostname === "jostap.com" || hostname.endsWith(".jostap.com")
      ? "Domain=.jostap.com"
      : "",
    secure ? "Secure" : "",
  ].filter(Boolean);
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

function safeIntent(value) {
  return value === "signup" ? "signup" : "signin";
}

function authPageFromRequest(request) {
  const referer = request.headers.get("Referer");

  if (!referer) {
    return "/auth/signin";
  }

  const refererUrl = new URL(referer);

  if (refererUrl.pathname === "/auth/signup") {
    return "/auth/signup";
  }

  return "/auth/signin";
}

function redirectWithError(request, message) {
  const url = new URL(authPageFromRequest(request), request.url);
  url.searchParams.set("error", message);

  return new Response(null, {
    status: 302,
    headers: {
      Location: url.toString(),
    },
  });
}

export async function GET(request) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    const acceptsHtml = request.headers.get("Accept")?.includes("text/html");
    const message =
      "Google sign in is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.";

    if (acceptsHtml) {
      return redirectWithError(request, message);
    }

    return json({ error: message }, { status: 503 });
  }

  const url = new URL(request.url);
  const state = randomUUID();
  const returnTo = safeReturnTo(url.searchParams.get("callbackUrl"));
  const intent = safeIntent(url.searchParams.get("intent"));
  const callbackUrl = new URL("/api/auth/google/callback", appOrigin(request));
  const authUrl = new URL(GOOGLE_AUTH_URL);

  authUrl.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", callbackUrl.toString());
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("prompt", "select_account");

  return new Response(null, {
    status: 302,
    headers: [
      ["Location", authUrl.toString()],
      [
        "Set-Cookie",
        `${STATE_COOKIE}=${encodeURIComponent(state)}; ${cookieFlags(request).join("; ")}`,
      ],
      [
        "Set-Cookie",
        `${RETURN_COOKIE}=${encodeURIComponent(returnTo)}; ${cookieFlags(request).join("; ")}`,
      ],
      [
        "Set-Cookie",
        `${INTENT_COOKIE}=${encodeURIComponent(intent)}; ${cookieFlags(request).join("; ")}`,
      ],
    ],
  });
}
