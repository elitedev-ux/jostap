const CACHE_MS = 45 * 1000;
const cache = new Map();
const inFlight = new Map();

function keyFor({ period, cardId } = {}) {
  return JSON.stringify({
    period: String(period || "30d"),
    cardId: String(cardId || "all"),
  });
}

async function requestDashboardData({ period, cardId } = {}) {
  const normalizedPeriod = String(period || "30d");
  const normalizedCardId = String(cardId || "all");
  const params = new URLSearchParams({ period: normalizedPeriod });
  if (normalizedCardId !== "all") {
    params.set("cardId", normalizedCardId);
  }

  const response = await fetch(`/api/dashboard?${params.toString()}`, {
    credentials: "same-origin",
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || "Unable to load dashboard data.");
    error.status = response.status;
    throw error;
  }

  return data;
}

export function clearDashboardDataCache() {
  cache.clear();
  inFlight.clear();
}

export async function getDashboardData({ period = "30d", cardId = "all", force = false } = {}) {
  const key = keyFor({ period, cardId });
  const cached = cache.get(key);
  const now = Date.now();

  if (!force && cached && now - cached.loadedAt < CACHE_MS) {
    return cached.data;
  }

  if (!force && inFlight.has(key)) {
    return inFlight.get(key);
  }

  const promise = requestDashboardData({ period, cardId })
    .then((data) => {
      cache.set(key, { data, loadedAt: Date.now() });
      inFlight.delete(key);
      return data;
    })
    .catch((error) => {
      inFlight.delete(key);
      throw error;
    });

  inFlight.set(key, promise);
  return promise;
}
