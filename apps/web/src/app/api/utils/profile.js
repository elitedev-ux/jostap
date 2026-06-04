import { toCdnStorageUrl } from "./storageUrls.js";

export function userFullName(user) {
  return [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim();
}

export function splitFullName(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);

  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" ") || "",
  };
}

export function kycProfileFromRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    phone: row.phone || "",
    jobTitle: row.job_title || "",
    businessName: row.business_name || "",
    businessType: row.business_type || "",
    country: row.country || "",
    city: row.city || "",
    website: row.website || "",
    primaryGoal: row.primary_goal || "",
    bio: row.bio || "",
    profileSlug: row.profile_slug || "",
    avatarUrl: toCdnStorageUrl(row.avatar_url || ""),
    completedAt: row.completed_at || "",
  };
}

export function accountFromUserAndKyc(user, kyc) {
  const profile = kycProfileFromRow(kyc);

  return {
    id: user.id,
    firstName: user.first_name || "",
    lastName: user.last_name || "",
    name: userFullName(user),
    email: user.email || "",
    company: profile?.businessName || user.company || "",
    role: user.role || "user",
    status: user.status || "active",
    createdAt: user.created_at || "",
    trialStartedAt: user.trial_started_at || "",
    trialEndsAt: user.trial_ends_at || "",
    kycComplete: Boolean(profile),
    kyc: profile,
  };
}
