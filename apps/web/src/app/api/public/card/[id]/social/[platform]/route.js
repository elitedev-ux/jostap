import { activePlanForUser, cardFromRow } from "../../../../../utils/cards.js";
import { recordCardEngagement } from "../../../../../utils/engagement.js";
import { json } from "../../../../../utils/http.js";
import { rateLimit, rateLimitKey } from "../../../../../utils/rateLimit.js";
import { getSupabaseAdmin, hasSupabase } from "../../../../../utils/supabase.js";

const PREMIUM_FEATURE_PLANS = new Set(["trial", "jostap_nfc", "custom_nfc", "basic_renewal", "premium_renewal"]);
const SOCIAL_FIELDS = new Set([
  "twitter",
  "instagram",
  "threads",
  "linkedin",
  "facebook",
  "youtube",
  "snapchat",
  "tiktok",
  "twitch",
  "yelp",
  "whatsapp",
  "signal",
  "discord",
  "skype",
  "telegram",
  "github",
  "behance",
  "dribbble",
  "spotify",
  "appleMusic",
  "boomplay",
  "audiomack",
  "youtubeMusic",
]);

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || ""));
}

function normalizedValues(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }
  const one = String(value || "").trim();
  return one ? [one] : [];
}

function normalizedUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    const url = new URL(candidate);
    return ["http:", "https:"].includes(url.protocol) && url.hostname ? url.toString() : "";
  } catch {
    return "";
  }
}

function safeHandle(value) {
  return String(value || "")
    .trim()
    .replace(/^@/, "")
    .replace(/[\s/#?&]+/g, "")
    .slice(0, 80);
}

function cleanHandle(value) {
  const raw = String(value || "").trim();
  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      return safeHandle(url.pathname.split("/").filter(Boolean).pop() || "");
    } catch {
      return safeHandle(raw);
    }
  }
  return safeHandle(raw);
}

function normalizeSkype(value) {
  const handle = String(value || "")
    .trim()
    .replace(/^skype:/i, "")
    .replace(/\?.*$/g, "");

  if (!/^[a-z0-9._,+-]{1,80}$/i.test(handle)) return "";
  return `skype:${encodeURIComponent(handle)}?chat`;
}

function normalizeWhatsapp(value) {
  return String(value || "").replace(/[^\d]/g, "");
}

function platformUrl(field, value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return normalizedUrl(raw);
  if (/^skype:/i.test(raw)) return field === "skype" ? normalizeSkype(raw) : "";

  const handle = cleanHandle(raw);
  const urls = {
    linkedin: normalizedUrl(raw.includes("linkedin.com") ? raw : `linkedin.com/in/${handle}`),
    twitter: normalizedUrl(`x.com/${handle}`),
    instagram: normalizedUrl(`instagram.com/${handle}`),
    threads: normalizedUrl(`threads.net/@${handle}`),
    facebook: normalizedUrl(raw.includes("facebook.com") ? raw : `facebook.com/${handle}`),
    youtube: normalizedUrl(raw.includes("youtube.com") ? raw : `youtube.com/@${handle}`),
    snapchat: normalizedUrl(`snapchat.com/add/${handle}`),
    tiktok: normalizedUrl(`tiktok.com/@${handle}`),
    twitch: normalizedUrl(`twitch.tv/${handle}`),
    yelp: normalizedUrl(raw),
    whatsapp: normalizeWhatsapp(raw) ? `https://wa.me/${normalizeWhatsapp(raw)}` : normalizedUrl(raw),
    signal: normalizedUrl(raw),
    discord: normalizedUrl(raw),
    skype: normalizeSkype(raw),
    telegram: normalizedUrl(`t.me/${handle}`),
    github: normalizedUrl(raw.includes("github.com") ? raw : `github.com/${handle}`),
    behance: normalizedUrl(raw.includes("behance.net") ? raw : `behance.net/${handle}`),
    dribbble: normalizedUrl(raw.includes("dribbble.com") ? raw : `dribbble.com/${handle}`),
    spotify: normalizedUrl(raw),
    appleMusic: normalizedUrl(raw),
    boomplay: normalizedUrl(raw),
    audiomack: normalizedUrl(raw.includes("audiomack.com") ? raw : `audiomack.com/${handle}`),
    youtubeMusic: normalizedUrl(raw),
  };

  return urls[field] || "";
}

async function findPublicCard(supabase, token, select = "*") {
  const value = String(token || "").trim();
  if (!value) return { data: null, error: null };

  if (isUuid(value)) {
    const byId = await supabase
      .from("cards")
      .select(select)
      .eq("active", true)
      .eq("id", value)
      .limit(1)
      .maybeSingle();
    if (byId.error || byId.data) return byId;
  }

  return supabase
    .from("cards")
    .select(select)
    .eq("active", true)
    .eq("slug", value)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
}

async function safeActivePlanForUser(supabase, userId) {
  if (!userId) return "free";

  try {
    return await activePlanForUser(supabase, userId);
  } catch (error) {
    console.error("Unable to resolve public card social plan", {
      userId,
      message: error?.message,
      code: error?.code,
    });
    return "free";
  }
}

async function safeRecordCardEngagement(supabase, payload) {
  try {
    await recordCardEngagement(supabase, payload);
  } catch (error) {
    console.error("Unable to record public card social engagement", {
      cardId: payload?.card?.id,
      type: payload?.type,
      message: error?.message,
      code: error?.code,
    });
  }
}

function redirectTo(url) {
  return new Response(null, {
    status: 302,
    headers: {
      Location: url,
      "Cache-Control": "no-store",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
  });
}

export async function GET(request, { params }) {
  const fallback = normalizedUrl(new URL(request.url).searchParams.get("fallback"));

  if (!hasSupabase()) {
    return fallback ? redirectTo(fallback) : json({ error: "Card not found." }, { status: 404 });
  }

  const platform = String(params.platform || "").trim();
  if (!SOCIAL_FIELDS.has(platform)) {
    return json({ error: "Unsupported social link." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: row, error } = await findPublicCard(supabase, params.id);
  if (error) throw error;
  if (!row) return fallback ? redirectTo(fallback) : json({ error: "Card not found." }, { status: 404 });

  const plan = await safeActivePlanForUser(supabase, row.user_id);

  const includePremium = PREMIUM_FEATURE_PLANS.has(String(plan || "").toLowerCase());
  const card = cardFromRow(row);
  const activeFields = Array.isArray(card.activeFields) && card.activeFields.length ? card.activeFields : [];
  if (!includePremium && (platform === "calendly" || platform === "videoUrl")) {
    return json({ error: "This link is not available." }, { status: 403 });
  }
  if (activeFields.length && !activeFields.includes(platform)) {
    return json({ error: "This link is not active." }, { status: 404 });
  }

  const index = Math.max(0, Math.floor(Number(new URL(request.url).searchParams.get("index") || 0)));
  const rawValue = normalizedValues(card[platform])[index] || normalizedValues(card[platform])[0] || "";
  const target = platformUrl(platform, rawValue);
  if (!target) {
    return fallback ? redirectTo(fallback) : json({ error: "Social link not found." }, { status: 404 });
  }

  const limited = rateLimit(request, {
    key: rateLimitKey(request, "public-card-social", [row.id, platform]),
    limit: 60,
    windowMs: 60_000,
  });

  if (!limited) {
    await safeRecordCardEngagement(supabase, {
      card: {
        ...row,
        metadata: { platform, index },
      },
      type: "social_click",
      request,
    });
  }

  return redirectTo(target);
}
