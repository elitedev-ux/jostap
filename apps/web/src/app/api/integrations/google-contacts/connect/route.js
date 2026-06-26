import { randomUUID } from "node:crypto";
import { json, unauthorized } from "../../../utils/http.js";
import { getSessionUser } from "../../../utils/session.js";
import {
  GOOGLE_CONTACTS_SCOPE,
  googleContactsCallbackUrl,
} from "../../../utils/googleContacts.js";

const STATE_COOKIE = "jostap_google_contacts_state";
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

function cookieFlags(request) {
  const hostname = new URL(request.url).hostname.toLowerCase();
  const secure = process.env.NODE_ENV === "production" || request.url.startsWith("https://");

  return [
    "HttpOnly",
    "Path=/",
    "SameSite=Lax",
    "Max-Age=600",
    hostname === "jostap.com" || hostname.endsWith(".jostap.com") ? "Domain=.jostap.com" : "",
    secure ? "Secure" : "",
  ].filter(Boolean);
}

export async function GET(request) {
  const user = await getSessionUser(request);

  if (!user) return unauthorized();

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return json({ error: "Google Contacts is not configured." }, { status: 503 });
  }

  const state = randomUUID();
  const authUrl = new URL(GOOGLE_AUTH_URL);

  authUrl.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", googleContactsCallbackUrl(request));
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", ["openid", "email", "profile", GOOGLE_CONTACTS_SCOPE].join(" "));
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("include_granted_scopes", "true");
  authUrl.searchParams.set("prompt", "consent");

  return new Response(null, {
    status: 302,
    headers: [
      ["Location", authUrl.toString()],
      [
        "Set-Cookie",
        `${STATE_COOKIE}=${encodeURIComponent(state)}; ${cookieFlags(request).join("; ")}`,
      ],
    ],
  });
}
