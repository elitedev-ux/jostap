import { randomUUID } from "node:crypto";
import { badRequest, unauthorized } from "../../../utils/http.js";
import { getSessionUser } from "../../../utils/session.js";
import { googleCalendarCallbackUrl, hasGoogleCalendarConfig } from "../../../utils/googleCalendar.js";

const STATE_COOKIE = "jostap_google_calendar_state";
const RETURN_COOKIE = "jostap_google_calendar_return_to";
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

function safeReturnTo(value) {
  if (!value || typeof value !== "string") {
    return "/dashboard/appointments";
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard/appointments";
  }

  return value;
}

export async function GET(request) {
  const user = await getSessionUser(request);
  if (!user) return unauthorized();

  if (!hasGoogleCalendarConfig()) {
    return badRequest("Google Calendar is not configured on the server.");
  }

  const url = new URL(request.url);
  const state = randomUUID();
  const returnTo = safeReturnTo(url.searchParams.get("callbackUrl"));
  const callbackUrl = googleCalendarCallbackUrl(request);
  const authUrl = new URL(GOOGLE_AUTH_URL);

  authUrl.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID || "");
  authUrl.searchParams.set("redirect_uri", callbackUrl);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile https://www.googleapis.com/auth/calendar.events");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("include_granted_scopes", "true");

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
    ],
  });
}
