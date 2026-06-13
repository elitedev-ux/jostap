import { clearDashboardDataCache } from "./dashboardDataStore";

export const CARD_THEMES = [
  { name: "Navy Pro", c1: "#1e3a8a", c2: "#0d6ffd", color1: "#1e3a8a", color2: "#0d6ffd" },
  { name: "Midnight", c1: "#0f172a", c2: "#1e293b", color1: "#0f172a", color2: "#1e293b" },
  { name: "Emerald", c1: "#065f46", c2: "#059669", color1: "#065f46", color2: "#059669" },
  { name: "Sunset", c1: "#7c2d12", c2: "#EA580C", color1: "#7c2d12", color2: "#EA580C" },
  { name: "Violet", c1: "#4c1d95", c2: "#ff9f0d", color1: "#4c1d95", color2: "#ff9f0d" },
  { name: "Rose", c1: "#881337", c2: "#E11D48", color1: "#881337", color2: "#E11D48" },
];

export const EMPTY_CARD = {
  name: "",
  title: "",
  role: "",
  company: "",
  bio: "",
  phone: "",
  email: "",
  website: "",
  videoUrl: "",
  avatarUrl: "",
  coverUrl: "",
  whatsapp: "",
  linkedin: "",
  twitter: "",
  instagram: "",
  portfolio: "",
  youtube: "",
  facebook: "",
  threads: "",
  snapchat: "",
  tiktok: "",
  twitch: "",
  yelp: "",
  signal: "",
  discord: "",
  skype: "",
  telegram: "",
  github: "",
  behance: "",
  dribbble: "",
  calendly: "",
  spotify: "",
  appleMusic: "",
  boomplay: "",
  audiomack: "",
  youtubeMusic: "",
  slug: "",
  template: "Navy Pro",
  active: true,
  showServices: true,
  showTestimonials: true,
  showGallery: false,
  showFaq: false,
};

async function requestJson(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || "Request failed.");
    error.status = response.status;
    throw error;
  }

  return data;
}

function notifyCardsChanged() {
  clearDashboardDataCache();

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("jostap-cards-change"));
  }
}

export async function getCards() {
  const data = await requestJson("/api/cards");
  return data.cards || [];
}

export async function getCard(id) {
  const data = await requestJson(`/api/cards/${id}`);
  return data.card || null;
}

export async function getPublicCard(slug, options = {}) {
  const params = new URLSearchParams();
  if (options.source) params.set("source", options.source);
  const query = params.toString() ? `?${params.toString()}` : "";
  const headers = options.referrer ? { "x-jostap-referrer": options.referrer } : undefined;
  const data = await requestJson(`/api/public/card/${slug}${query}`, { headers });
  return data.card || null;
}

export async function createCard(card) {
  const data = await requestJson("/api/cards", {
    method: "POST",
    body: JSON.stringify({ ...EMPTY_CARD, ...card }),
  });

  notifyCardsChanged();
  return data.card;
}

export async function updateCard(id, updates) {
  const data = await requestJson(`/api/cards/${id}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });

  notifyCardsChanged();
  return data.card;
}

export async function deleteCard(id) {
  await requestJson(`/api/cards/${id}`, { method: "DELETE" });
  notifyCardsChanged();
}

export async function duplicateCard(id) {
  const data = await requestJson(`/api/cards/${id}/duplicate`, {
    method: "POST",
  });

  notifyCardsChanged();
  return data.card;
}
