import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";
const GOOGLE_CREATE_CONTACT_URL = "https://people.googleapis.com/v1/people:createContact";
export const GOOGLE_CONTACTS_PROVIDER = "google_contacts";
export const GOOGLE_CONTACTS_SCOPE = "https://www.googleapis.com/auth/contacts";

function tokenSecret() {
  const secret =
    process.env.CONTACTS_TOKEN_SECRET ||
    process.env.SESSION_SECRET ||
    process.env.GOOGLE_CLIENT_SECRET ||
    "";

  if (!secret) {
    throw new Error("Set CONTACTS_TOKEN_SECRET before connecting Google Contacts.");
  }

  return createHash("sha256").update(secret).digest();
}

export function encryptToken(value) {
  if (!value) return "";

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", tokenSecret(), iv);
  const encrypted = Buffer.concat([cipher.update(String(value), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [iv.toString("base64url"), tag.toString("base64url"), encrypted.toString("base64url")].join(".");
}

export function decryptToken(value) {
  if (!value) return "";

  const [ivRaw, tagRaw, encryptedRaw] = String(value).split(".");
  if (!ivRaw || !tagRaw || !encryptedRaw) return "";

  const decipher = createDecipheriv("aes-256-gcm", tokenSecret(), Buffer.from(ivRaw, "base64url"));
  decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedRaw, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function appOrigin(request) {
  return (
    process.env.GOOGLE_REDIRECT_ORIGIN ||
    process.env.APP_ORIGIN ||
    new URL(request.url).origin
  ).replace(/\/$/, "");
}

export function googleContactsCallbackUrl(request) {
  return new URL("/api/integrations/google-contacts/callback", appOrigin(request)).toString();
}

export async function exchangeGoogleCode({ code, redirectUri }) {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    throw new Error("Google Contacts could not be connected.");
  }

  return response.json();
}

export async function refreshGoogleAccessToken(refreshToken) {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error("Google Contacts access has expired. Please reconnect Google Contacts.");
  }

  return response.json();
}

export async function fetchGoogleProfileEmail(accessToken) {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) return "";

  const profile = await response.json();
  return String(profile.email || "").trim().toLowerCase();
}

function splitName(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  return {
    givenName: parts[0] || name || "Contact",
    familyName: parts.slice(1).join(" "),
  };
}

function googlePersonFromLead(lead) {
  const { givenName, familyName } = splitName(lead.name);
  const person = {
    names: [
      {
        givenName,
        ...(familyName ? { familyName } : {}),
      },
    ],
    emailAddresses: lead.email ? [{ value: lead.email }] : [],
    phoneNumbers: lead.phone ? [{ value: lead.phone }] : [],
  };

  if (lead.company || lead.jobTitle) {
    person.organizations = [
      {
        ...(lead.company ? { name: lead.company } : {}),
        ...(lead.jobTitle ? { title: lead.jobTitle } : {}),
      },
    ];
  }

  return person;
}

async function upsertSyncRow(supabase, payload) {
  await supabase
    .from("lead_contact_syncs")
    .upsert(payload, { onConflict: "lead_id,provider" });
}

export async function validGoogleAccessToken(supabase, integration) {
  const expiresAt = integration.token_expires_at ? new Date(integration.token_expires_at).getTime() : 0;
  const stillValid = expiresAt && expiresAt - Date.now() > 60_000;

  if (stillValid) {
    return decryptToken(integration.access_token_ciphertext);
  }

  const refreshToken = decryptToken(integration.refresh_token_ciphertext);
  if (!refreshToken) {
    throw new Error("Google Contacts needs to be reconnected.");
  }

  const refreshed = await refreshGoogleAccessToken(refreshToken);
  const nextAccessToken = refreshed.access_token;
  const expiresIn = Number(refreshed.expires_in || 3600);

  await supabase
    .from("contact_integrations")
    .update({
      access_token_ciphertext: encryptToken(nextAccessToken),
      token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
      status: "active",
      last_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", integration.id);

  return nextAccessToken;
}

export async function syncLeadToGoogleContacts(supabase, lead) {
  const { data: integration, error } = await supabase
    .from("contact_integrations")
    .select("*")
    .eq("user_id", lead.userId)
    .eq("provider", GOOGLE_CONTACTS_PROVIDER)
    .eq("status", "active")
    .eq("sync_enabled", true)
    .maybeSingle();

  if (error) throw error;
  if (!integration) return { skipped: true };

  try {
    const accessToken = await validGoogleAccessToken(supabase, integration);
    const response = await fetch(GOOGLE_CREATE_CONTACT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(googlePersonFromLead(lead)),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error?.message || "Google Contacts sync failed.");
    }

    const now = new Date().toISOString();
    await upsertSyncRow(supabase, {
      user_id: lead.userId,
      lead_id: lead.id,
      provider: GOOGLE_CONTACTS_PROVIDER,
      status: "synced",
      provider_resource_name: data.resourceName || "",
      error: null,
      synced_at: now,
      updated_at: now,
    });
    await supabase
      .from("contact_integrations")
      .update({ last_synced_at: now, last_error: null, updated_at: now })
      .eq("id", integration.id);

    return { synced: true };
  } catch (syncError) {
    const message = syncError.message || "Google Contacts sync failed.";
    const now = new Date().toISOString();
    await upsertSyncRow(supabase, {
      user_id: lead.userId,
      lead_id: lead.id,
      provider: GOOGLE_CONTACTS_PROVIDER,
      status: "failed",
      error: message,
      synced_at: null,
      updated_at: now,
    });
    await supabase
      .from("contact_integrations")
      .update({ status: "error", last_error: message, updated_at: now })
      .eq("id", integration.id);

    return { synced: false, error: message };
  }
}
