import { createHash } from "node:crypto";

const EVENT_COUNTERS = {
  profile_view: "views",
  qr_scan: "qr_scans",
  nfc_tap: "taps",
  contact_download: "contact_downloads",
};

export function engagementTypeFromSource(source) {
  const value = String(source || "").trim().toLowerCase();
  if (value === "qr" || value === "qr_scan" || value === "qrcode") return "qr_scan";
  if (value === "nfc" || value === "nfc_tap" || value === "tap") return "nfc_tap";
  return "profile_view";
}

function cleanHeader(value, max = 500) {
  return String(value || "").trim().slice(0, max) || null;
}

function referrerFromRequest(request) {
  const referrer = cleanHeader(
    request?.headers?.get?.("x-jostap-referrer") ||
      request?.headers?.get?.("referer") ||
      request?.headers?.get?.("referrer"),
    1000,
  );

  return isIgnoredReferrer(referrer) ? null : referrer;
}

function referrerHost(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.toLowerCase() === "jostap") return "jostap";

  try {
    return new URL(raw).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return raw.replace(/^www\./, "").toLowerCase();
  }
}

function isIgnoredReferrer(value) {
  const host = referrerHost(value);
  return (
    !host ||
    host === "jostap" ||
    host === "jostap.com" ||
    host.endsWith(".jostap.com") ||
    host === "jostap.vercel.app" ||
    host.endsWith(".jostap.vercel.app") ||
    host === "example.com" ||
    host.endsWith(".example.com")
  );
}

function userAgentFromRequest(request) {
  return cleanHeader(request?.headers?.get?.("user-agent"), 1000);
}

function clientIp(request) {
  const forwarded = request?.headers?.get?.("x-forwarded-for");
  return cleanHeader(forwarded?.split(",")[0] || request?.headers?.get?.("x-real-ip"), 120);
}

function ipHash(request) {
  const ip = clientIp(request);
  if (!ip) return null;
  return createHash("sha256").update(ip).digest("hex");
}

async function incrementCardCounter(supabase, cardId, column, currentValue) {
  const { error } = await supabase
    .from("cards")
    .update({ [column]: Number(currentValue || 0) + 1 })
    .eq("id", cardId);

  if (error) throw error;
}

export async function recordCardEngagement(supabase, { card, type, request }) {
  const counter = EVENT_COUNTERS[type];
  if (!card?.id) return;

  if (counter) {
    await incrementCardCounter(supabase, card.id, counter, card[counter]);
  }

  const payload = {
    card_id: card.id,
    user_id: card.user_id || null,
    event_type: type,
    referrer: referrerFromRequest(request),
    user_agent: userAgentFromRequest(request),
    ip_hash: ipHash(request),
    metadata: card.metadata || {},
  };

  const { error } = await supabase.from("card_engagement_events").insert(payload);

  if (error?.code === "42703" || error?.code === "PGRST204") {
    const { metadata: _metadata, ...fallbackPayload } = payload;
    const fallback = await supabase.from("card_engagement_events").insert(fallbackPayload);
    if (fallback.error && fallback.error.code !== "42P01" && fallback.error.code !== "23514") {
      throw fallback.error;
    }
    return;
  }

  if (error && error.code !== "42P01" && error.code !== "23514") {
    throw error;
  }
}
