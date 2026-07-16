import { accessFromPlanAndTrial, isCustomBrandingPlan, isPremiumPlan, trialStateFromUser } from "./trial.js";
import { toCdnStorageUrl, toOriginStorageUrl } from "./storageUrls.js";

export function normalizeSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ""));
}

const FREE_CARD_LIMIT = 1;
export const COMPANY_CARD_PURCHASE_PLANS = ["jostap_nfc", "custom_nfc"];
const MULTI_VALUE_SOCIAL_FIELDS = new Set([
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
]);
const ALLOWED_ACTIVE_FIELDS = new Set([
  "name",
  "title",
  "company",
  "email",
  "phone",
  "website",
  "headline",
  "portfolio",
  "address",
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
  "calendly",
  "spotify",
  "appleMusic",
  "boomplay",
  "audiomack",
  "youtubeMusic",
  "videoUrl",
  "gallery",
  "saveContact",
  "exchangeContact",
]);
const GALLERY_IMAGE_LIMIT = 6;

function sanitizeActiveFields(value) {
  if (!Array.isArray(value)) return [];
  const list = [];
  for (const field of value) {
    const key = String(field || "").trim();
    if (!key || !ALLOWED_ACTIVE_FIELDS.has(key) || list.includes(key)) continue;
    list.push(key);
  }
  return list;
}

function normalizeText(value, max = 500) {
  return String(value || "").trim().slice(0, max);
}

function normalizeMultiText(value) {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeText(item, 500)).filter(Boolean).slice(0, 20);
  }
  const one = normalizeText(value, 500);
  return one ? [one] : [];
}

function fromSocialValue(key, value) {
  if (MULTI_VALUE_SOCIAL_FIELDS.has(key)) {
    return normalizeMultiText(value);
  }
  return normalizeText(value);
}

function toSocialValue(key, value) {
  if (MULTI_VALUE_SOCIAL_FIELDS.has(key)) {
    return normalizeMultiText(value);
  }
  return normalizeText(value) || "";
}

function normalizeGalleryImages(value) {
  if (!Array.isArray(value)) return [];

  const images = [];
  for (const item of value) {
    const url = toOriginStorageUrl(normalizeText(item?.url || item, 1000));
    if (!url) continue;

    images.push({
      id: normalizeText(item?.id, 80) || `gallery-${images.length + 1}`,
      url,
      caption: normalizeText(item?.caption, 160),
    });

    if (images.length >= GALLERY_IMAGE_LIMIT) break;
  }

  return images;
}

export function planCapabilities(plan) {
  const value = String(plan || "free").toLowerCase();
  if (value === "trial") {
    return {
      hasPremiumFeatures: true,
      hasCustomBranding: true,
    };
  }

  return {
    hasPremiumFeatures: isPremiumPlan(value),
    hasCustomBranding: isCustomBrandingPlan(value),
  };
}

function hasConfirmedPlanAccess(row) {
  if (!row || row.status !== "active") return false;
  if (row.plan === "free") return true;
  if (row.current_period_end && new Date(row.current_period_end).getTime() <= Date.now()) return false;

  return !["free", "free_upgrade"].includes(String(row.provider || "").toLowerCase());
}

export async function activePlanForUser(supabase, userId) {
  const [{ data, error }, { data: user, error: userError }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("plan,status,provider,current_period_end")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("users")
      .select("created_at")
      .eq("id", userId)
      .maybeSingle(),
  ]);

  if (error || userError) {
    throw error || userError;
  }

  if (!user) {
    return hasConfirmedPlanAccess(data) ? data.plan : "free";
  }

  const trial = trialStateFromUser(user);
  const plan = hasConfirmedPlanAccess(data) ? data.plan : "free";
  return accessFromPlanAndTrial(plan, trial).effectivePlan;
}

export function cardLimitForPlan(plan) {
  return String(plan || "free").toLowerCase() === "free" ? FREE_CARD_LIMIT : null;
}

export function isCompanyAccount(profile) {
  return String(profile?.account_type || profile?.accountType || "").toLowerCase() === "company";
}

export async function purchasedCardSlotsForUser(supabase, userId) {
  const { data, error } = await supabase
    .from("payments")
    .select("order_account")
    .eq("user_id", userId)
    .eq("provider", "paystack")
    .eq("status", "succeeded")
    .in("order_plan", COMPANY_CARD_PURCHASE_PLANS);

  if (error) throw error;

  return (data || []).reduce((slots, payment) => {
    const quantity = Math.floor(Number(payment.order_account?.quantity || 1));
    return slots + (Number.isFinite(quantity) ? Math.max(1, quantity) : 1);
  }, 0);
}

async function profileForUser(supabase, userId) {
  const { data, error } = await supabase
    .from("kyc_profiles")
    .select("account_type")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export async function cardLimitForUserAccount(supabase, userId, plan, profile = null) {
  const kycProfile = profile || (await profileForUser(supabase, userId));

  if (isCompanyAccount(kycProfile)) {
    const purchasedSlots = await purchasedCardSlotsForUser(supabase, userId);
    return {
      limit: purchasedSlots,
      reason: "company_purchase_limit",
      purchasedSlots,
    };
  }

  const limit = cardLimitForPlan(plan);
  return {
    limit,
    reason: limit === null ? "unlimited" : "plan_card_limit",
    purchasedSlots: null,
  };
}

export async function assertCanCreateCard(supabase, userId, plan) {
  const { limit, reason } = await cardLimitForUserAccount(supabase, userId, plan);
  if (limit === null) return;

  const { count, error } = await supabase
    .from("cards")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) throw error;

  if (Number(count || 0) >= limit) {
    const message =
      reason === "company_purchase_limit"
        ? `Company accounts can create ${limit} card profile${limit === 1 ? "" : "s"}, matching successful card purchases. Purchase another card to create more profiles.`
        : "Free users can create 1 card. Upgrade to create additional cards.";
    const error = new Error(message);
    error.code = "PLAN_CARD_LIMIT";
    error.status = 402;
    error.reason = reason;
    error.limit = limit;
    error.used = Number(count || 0);
    throw error;
  }
}

export function applyPlanLimits(card, plan) {
  const capabilities = planCapabilities(plan);
  const next = {
    ...card,
    theme: { ...(card.theme || {}) },
    socialLinks: { ...(card.socialLinks || {}) },
  };

  if (!capabilities.hasCustomBranding) {
    next.theme.brandColor = "";
  }

  if (!capabilities.hasPremiumFeatures) {
    next.theme.videoUrl = "";
    next.theme.activeFields = (next.theme.activeFields || []).filter(
      (field) => field !== "calendly" && field !== "videoUrl",
    );
    next.theme.showServices = false;
    next.theme.showTestimonials = false;
    next.theme.showGallery = false;
    next.theme.galleryImages = [];
    next.theme.showFaq = false;
    next.socialLinks.calendly = "";
  }

  return next;
}

export function cardFromRow(row) {
  const theme = row.theme || {};
  const social = row.social_links || {};

  return {
    id: row.id,
    userId: row.user_id || null,
    assignmentStatus: row.user_id ? "assigned" : "unassigned",
    name: row.name || "",
    title: row.title || "",
    role: row.title || "",
    company: row.company || "",
    bio: row.bio || "",
    phone: row.phone || "",
    email: row.email || "",
    website: row.website || "",
    avatarUrl: toCdnStorageUrl(row.avatar_url || ""),
    logoUrl: toCdnStorageUrl(theme.logoUrl || ""),
    coverUrl: toCdnStorageUrl(theme.coverUrl || ""),
    brandColor: theme.brandColor || "",
    videoUrl: theme.videoUrl || "",
    activeFields: Array.isArray(theme.activeFields) ? theme.activeFields : [],
    saveContactEnabled: theme.saveContactEnabled !== false,
    exchangeContactEnabled: theme.exchangeContactEnabled !== false,
    whatsapp: fromSocialValue("whatsapp", social.whatsapp),
    linkedin: fromSocialValue("linkedin", social.linkedin),
    twitter: fromSocialValue("twitter", social.twitter),
    instagram: fromSocialValue("instagram", social.instagram),
    portfolio: fromSocialValue("portfolio", social.portfolio),
    address: fromSocialValue("address", social.address),
    department: fromSocialValue("department", social.department),
    accreditation: fromSocialValue("accreditation", social.accreditation),
    headline: fromSocialValue("headline", social.headline),
    youtube: fromSocialValue("youtube", social.youtube),
    facebook: fromSocialValue("facebook", social.facebook),
    threads: fromSocialValue("threads", social.threads),
    snapchat: fromSocialValue("snapchat", social.snapchat),
    tiktok: fromSocialValue("tiktok", social.tiktok),
    twitch: fromSocialValue("twitch", social.twitch),
    yelp: fromSocialValue("yelp", social.yelp),
    signal: fromSocialValue("signal", social.signal),
    discord: fromSocialValue("discord", social.discord),
    skype: fromSocialValue("skype", social.skype),
    telegram: fromSocialValue("telegram", social.telegram),
    github: fromSocialValue("github", social.github),
    behance: fromSocialValue("behance", social.behance),
    dribbble: fromSocialValue("dribbble", social.dribbble),
    calendly: fromSocialValue("calendly", social.calendly),
    spotify: fromSocialValue("spotify", social.spotify),
    appleMusic: fromSocialValue("appleMusic", social.appleMusic),
    boomplay: fromSocialValue("boomplay", social.boomplay),
    audiomack: fromSocialValue("audiomack", social.audiomack),
    youtubeMusic: fromSocialValue("youtubeMusic", social.youtubeMusic),
    paypal: fromSocialValue("paypal", social.paypal),
    venmo: fromSocialValue("venmo", social.venmo),
    cashapp: fromSocialValue("cashapp", social.cashapp),
    slug: row.slug || "",
    template: theme.template || "Navy Pro",
    active: Boolean(row.active),
    showServices: theme.showServices ?? true,
    showTestimonials: theme.showTestimonials ?? true,
    showGallery: theme.showGallery ?? false,
    galleryImages: Array.isArray(theme.galleryImages)
      ? theme.galleryImages
          .map((item, index) => ({
            id: normalizeText(item?.id, 80) || `gallery-${index + 1}`,
            url: toCdnStorageUrl(item?.url || ""),
            caption: normalizeText(item?.caption, 160),
          }))
          .filter((item) => item.url)
          .slice(0, GALLERY_IMAGE_LIMIT)
      : [],
    showFaq: theme.showFaq ?? false,
    views: Number(row.views || 0),
    taps: Number(row.taps || 0),
    qr: Number(row.qr_scans || 0),
    contactDownloads: Number(row.contact_downloads || 0),
    created: row.created_at
      ? new Date(row.created_at).toLocaleDateString("en", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "",
    updatedAt: row.updated_at || row.created_at || "",
  };
}

export function cardPayload(body) {
  const slug = normalizeSlug(body.slug || body.name);
  const activeFields = sanitizeActiveFields(body.activeFields);
  const galleryImages = normalizeGalleryImages(body.galleryImages);

  for (const [key, enabled] of [
    ["saveContact", body.saveContactEnabled],
    ["exchangeContact", body.exchangeContactEnabled],
  ]) {
    const index = activeFields.indexOf(key);
    if (enabled === false && index !== -1) activeFields.splice(index, 1);
    if (enabled === true && index === -1) activeFields.push(key);
  }

  return {
    name: normalizeText(body.name, 120),
    title: normalizeText(body.title || body.role, 120) || null,
    company: normalizeText(body.company, 160) || null,
    bio: normalizeText(body.bio, 2000) || null,
    phone: normalizeText(body.phone, 60) || null,
    email: normalizeText(body.email, 254),
    website: normalizeText(body.website, 500) || null,
    avatarUrl: toOriginStorageUrl(normalizeText(body.avatarUrl, 1000)) || null,
    slug,
    active: body.active ?? true,
    theme: {
      template: body.template || "Navy Pro",
      activeFields,
      showServices: body.showServices ?? true,
      showTestimonials: body.showTestimonials ?? true,
      showGallery: Boolean(body.showGallery && galleryImages.length),
      galleryImages,
      showFaq: body.showFaq ?? false,
      logoUrl: toOriginStorageUrl(normalizeText(body.logoUrl, 1000)),
      coverUrl: toOriginStorageUrl(normalizeText(body.coverUrl, 1000)),
      brandColor: normalizeText(body.brandColor, 32),
      videoUrl: normalizeText(body.videoUrl, 1000),
      saveContactEnabled: activeFields.includes("saveContact"),
      exchangeContactEnabled: activeFields.includes("exchangeContact"),
    },
    socialLinks: {
      whatsapp: toSocialValue("whatsapp", body.whatsapp),
      linkedin: toSocialValue("linkedin", body.linkedin),
      twitter: toSocialValue("twitter", body.twitter),
      instagram: toSocialValue("instagram", body.instagram),
      portfolio: toSocialValue("portfolio", body.portfolio),
      address: toSocialValue("address", body.address),
      department: toSocialValue("department", body.department),
      accreditation: toSocialValue("accreditation", body.accreditation),
      headline: toSocialValue("headline", body.headline),
      youtube: toSocialValue("youtube", body.youtube),
      facebook: toSocialValue("facebook", body.facebook),
      threads: toSocialValue("threads", body.threads),
      snapchat: toSocialValue("snapchat", body.snapchat),
      tiktok: toSocialValue("tiktok", body.tiktok),
      twitch: toSocialValue("twitch", body.twitch),
      yelp: toSocialValue("yelp", body.yelp),
      signal: toSocialValue("signal", body.signal),
      discord: toSocialValue("discord", body.discord),
      skype: toSocialValue("skype", body.skype),
      telegram: toSocialValue("telegram", body.telegram),
      github: toSocialValue("github", body.github),
      behance: toSocialValue("behance", body.behance),
      dribbble: toSocialValue("dribbble", body.dribbble),
      calendly: toSocialValue("calendly", body.calendly),
      spotify: toSocialValue("spotify", body.spotify),
      appleMusic: toSocialValue("appleMusic", body.appleMusic),
      boomplay: toSocialValue("boomplay", body.boomplay),
      audiomack: toSocialValue("audiomack", body.audiomack),
      youtubeMusic: toSocialValue("youtubeMusic", body.youtubeMusic),
      paypal: toSocialValue("paypal", body.paypal),
      venmo: toSocialValue("venmo", body.venmo),
      cashapp: toSocialValue("cashapp", body.cashapp),
    },
  };
}
