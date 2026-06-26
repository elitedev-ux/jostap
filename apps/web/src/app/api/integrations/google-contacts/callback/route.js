import { getSessionUser } from "../../../utils/session.js";
import { getSupabaseAdmin } from "../../../utils/supabase.js";
import {
  GOOGLE_CONTACTS_PROVIDER,
  GOOGLE_CONTACTS_SCOPE,
  encryptToken,
  exchangeGoogleCode,
  fetchGoogleProfileEmail,
  googleContactsCallbackUrl,
} from "../../../utils/googleContacts.js";

const STATE_COOKIE = "jostap_google_contacts_state";

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

        return index === -1 ? [part, ""] : [part.slice(0, index), value];
      }),
  );
}

function cookieDomainFlag(request) {
  const hostname = new URL(request.url).hostname.toLowerCase();

  return hostname === "jostap.com" || hostname.endsWith(".jostap.com")
    ? "Domain=.jostap.com"
    : "";
}

function clearCookie(request, includeDomain = false) {
  const secure = process.env.NODE_ENV === "production" || request.url.startsWith("https://");

  return [
    `${STATE_COOKIE}=`,
    "Max-Age=0",
    "Path=/",
    "SameSite=Lax",
    "HttpOnly",
    includeDomain ? cookieDomainFlag(request) : "",
    secure ? "Secure" : "",
  ].filter(Boolean).join("; ");
}

function settingsRedirect(request, params = {}) {
  const url = new URL("/dashboard/settings", request.url);
  url.searchParams.set("tab", "Integrations");

  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }

  const headers = new Headers({ Location: url.toString() });
  headers.append("Set-Cookie", clearCookie(request));
  if (cookieDomainFlag(request)) {
    headers.append("Set-Cookie", clearCookie(request, true));
  }

  return new Response(null, { status: 302, headers });
}

export async function GET(request) {
  const user = await getSessionUser(request);

  if (!user) {
    return settingsRedirect(request, { googleContacts: "signin_required" });
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const storedState = parseCookie(request.headers.get("Cookie"))[STATE_COOKIE];

  if (!code || !state || !storedState || state !== storedState) {
    return settingsRedirect(request, { googleContacts: "failed" });
  }

  try {
    const tokenData = await exchangeGoogleCode({
      code,
      redirectUri: googleContactsCallbackUrl(request),
    });
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;

    if (!accessToken) {
      return settingsRedirect(request, { googleContacts: "failed" });
    }

    const supabase = getSupabaseAdmin();
    const { data: existing, error: existingError } = await supabase
      .from("contact_integrations")
      .select("refresh_token_ciphertext")
      .eq("user_id", user.id)
      .eq("provider", GOOGLE_CONTACTS_PROVIDER)
      .maybeSingle();

    if (existingError) throw existingError;

    const accountEmail = await fetchGoogleProfileEmail(accessToken);
    const expiresIn = Number(tokenData.expires_in || 3600);
    const scopes = String(tokenData.scope || GOOGLE_CONTACTS_SCOPE)
      .split(/\s+/)
      .filter(Boolean);
    const now = new Date().toISOString();

    const { error } = await supabase
      .from("contact_integrations")
      .upsert({
        user_id: user.id,
        provider: GOOGLE_CONTACTS_PROVIDER,
        provider_account_email: accountEmail || user.email,
        access_token_ciphertext: encryptToken(accessToken),
        refresh_token_ciphertext: refreshToken
          ? encryptToken(refreshToken)
          : existing?.refresh_token_ciphertext || null,
        token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
        scopes,
        sync_enabled: true,
        status: "active",
        last_error: null,
        updated_at: now,
      }, { onConflict: "user_id,provider" });

    if (error) throw error;

    return settingsRedirect(request, { googleContacts: "connected" });
  } catch {
    return settingsRedirect(request, { googleContacts: "failed" });
  }
}
