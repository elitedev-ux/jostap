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

const PREMIUM_FEATURE_PLANS = new Set(["jostap_nfc", "custom_nfc", "premium_renewal"]);
const CUSTOM_BRANDING_PLANS = new Set(["custom_nfc"]);
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
]);

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

export function planCapabilities(plan) {
  const value = String(plan || "free").toLowerCase();
  return {
    hasPremiumFeatures: PREMIUM_FEATURE_PLANS.has(value),
    hasCustomBranding: CUSTOM_BRANDING_PLANS.has(value),
  };
}

export async function activePlanForUser(supabase, userId) {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.plan || "free";
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
    avatarUrl: row.avatar_url || "",
    logoUrl: theme.logoUrl || "",
    coverUrl: theme.coverUrl || "",
    brandColor: theme.brandColor || "",
    videoUrl: theme.videoUrl || "",
    activeFields: Array.isArray(theme.activeFields) ? theme.activeFields : [],
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
  const slug = normalizeSlug(body.slug);

  return {
    name: normalizeText(body.name, 120),
    title: normalizeText(body.title || body.role, 120) || null,
    company: normalizeText(body.company, 160) || null,
    bio: normalizeText(body.bio, 2000) || null,
    phone: normalizeText(body.phone, 60) || null,
    email: normalizeText(body.email, 254),
    website: normalizeText(body.website, 500) || null,
    avatarUrl: normalizeText(body.avatarUrl, 1000) || null,
    slug,
    active: body.active ?? true,
    theme: {
      template: body.template || "Navy Pro",
      activeFields: sanitizeActiveFields(body.activeFields),
      showServices: body.showServices ?? true,
      showTestimonials: body.showTestimonials ?? true,
      showGallery: body.showGallery ?? false,
      showFaq: body.showFaq ?? false,
      logoUrl: normalizeText(body.logoUrl, 1000),
      coverUrl: normalizeText(body.coverUrl, 1000),
      brandColor: normalizeText(body.brandColor, 32),
      videoUrl: normalizeText(body.videoUrl, 1000),
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
