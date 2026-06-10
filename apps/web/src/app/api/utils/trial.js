export const TRIAL_DAYS = 14;
export const TRIAL_PLAN = "trial";

const PREMIUM_PLANS = new Set(["jostap_nfc", "custom_nfc", "premium_renewal"]);
const CUSTOM_BRANDING_PLANS = new Set(["jostap_nfc", "custom_nfc", "premium_renewal"]);

function dateFrom(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export function isPremiumPlan(plan) {
  return PREMIUM_PLANS.has(String(plan || "").toLowerCase());
}

export function isCustomBrandingPlan(plan) {
  return CUSTOM_BRANDING_PLANS.has(String(plan || "").toLowerCase());
}

export function trialStateFromUser(user, nowValue = new Date()) {
  const now = dateFrom(nowValue) || new Date();
  const startedAt = dateFrom(user?.trial_started_at) || dateFrom(user?.created_at) || now;
  const endsAt = dateFrom(user?.trial_ends_at) || addDays(startedAt, TRIAL_DAYS);
  const msRemaining = Math.max(0, endsAt.getTime() - now.getTime());
  const daysRemaining = Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));

  return {
    active: endsAt.getTime() > now.getTime(),
    startedAt: startedAt.toISOString(),
    endsAt: endsAt.toISOString(),
    daysRemaining,
    expired: endsAt.getTime() <= now.getTime(),
  };
}

export function accessFromPlanAndTrial(plan, trial) {
  const value = String(plan || "free").toLowerCase();
  const trialActive = Boolean(trial?.active);
  const premium = isPremiumPlan(value);

  return {
    effectivePlan: premium ? value : trialActive ? TRIAL_PLAN : value || "free",
    hasPremiumFeatures: premium || trialActive,
    hasDownloadableQr: premium || trialActive,
    hasCustomBranding: isCustomBrandingPlan(value) || trialActive,
  };
}
