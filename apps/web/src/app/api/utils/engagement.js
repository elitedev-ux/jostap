const EVENT_COUNTERS = {
  profile_view: "views",
  qr_scan: "qr_scans",
  nfc_tap: "taps",
  contact_download: "contact_downloads",
};

function cleanHeader(value, max = 500) {
  return String(value || "").trim().slice(0, max) || null;
}

function referrerFromRequest(request) {
  return cleanHeader(
    request?.headers?.get?.("x-jostap-referrer") ||
      request?.headers?.get?.("referer") ||
      request?.headers?.get?.("referrer"),
    1000,
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
  if (!card?.id || !counter) return;

  await incrementCardCounter(supabase, card.id, counter, card[counter]);

  const { error } = await supabase.from("card_engagement_events").insert({
    card_id: card.id,
    user_id: card.user_id || null,
    event_type: type,
    referrer: referrerFromRequest(request),
    user_agent: userAgentFromRequest(request),
    ip_hash: ipHash(request),
  });

  if (error && error.code !== "42P01") {
    throw error;
  }
}
import { createHash } from "node:crypto";
