const CACHE_MS = 45 * 1000;
const cache = new Map();
const inFlight = new Map();

function keyFor(period) {
  return String(period || "30d");
}

async function requestDashboardData(period) {
  const params = new URLSearchParams({ period: keyFor(period) });
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

export async function getDashboardData({ period = "30d", force = false } = {}) {
  const key = keyFor(period);
  const cached = cache.get(key);
  const now = Date.now();

  if (!force && cached && now - cached.loadedAt < CACHE_MS) {
    return cached.data;
  }

  if (!force && inFlight.has(key)) {
    return inFlight.get(key);
  }

  const promise = requestDashboardData(key)
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
