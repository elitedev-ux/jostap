import { badRequest, json, readJson, unauthorized } from "../utils/http.js";
import { getSessionUser } from "../utils/session.js";
import { getSupabaseAdmin } from "../utils/supabase.js";
import { kycProfileFromRow } from "../utils/profile.js";

const ACCOUNT_TYPES = new Set(["individual", "company"]);

function clean(value) {
  return String(value || "").trim();
}

function normalizeAccountType(value) {
  const accountType = clean(value).toLowerCase();
  return ACCOUNT_TYPES.has(accountType) ? accountType : "individual";
}

const ACCOUNT_TYPE_ADMIN_EMAILS = new Set([
  "oluwatobijam199@gmail.com",
  "tosinsamuel51@gmail.com",
]);

function canManageAccountType(user) {
  return ACCOUNT_TYPE_ADMIN_EMAILS.has(String(user?.email || "").trim().toLowerCase());
}

export async function GET(request) {
  const user = await getSessionUser(request);

  if (!user) {
    return unauthorized();
  }

  const supabase = getSupabaseAdmin();
  const { data: row, error } = await supabase
    .from("kyc_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return json({
    profile: kycProfileFromRow(row),
    completed: Boolean(row),
  });
}

export async function POST(request) {
  const user = await getSessionUser(request);

  if (!user) {
    return unauthorized();
  }

  const body = await readJson(request);

  if (!body) {
    return badRequest("Invalid request body.");
  }

  const supabase = getSupabaseAdmin();
  const requestedAccountType = normalizeAccountType(body.accountType);
  const { data: existingProfile, error: existingProfileError } = await supabase
    .from("kyc_profiles")
    .select("account_type")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingProfileError) {
    throw existingProfileError;
  }

  const accountType =
    !existingProfile || canManageAccountType(user)
      ? requestedAccountType
      : existingProfile.account_type || "individual";
  const businessName = clean(body.businessName);
  const fallbackIndividualName =
    [user.first_name, user.last_name].map(clean).filter(Boolean).join(" ") ||
    "Personal profile";
  const payload = {
    accountType,
    phone: clean(body.phone),
    jobTitle: clean(body.jobTitle),
    businessName: accountType === "company" ? businessName : businessName || fallbackIndividualName,
    businessType: clean(body.businessType) || (accountType === "individual" ? "Solo professional" : ""),
    country: clean(body.country),
    city: clean(body.city),
    website: clean(body.website) || null,
    primaryGoal: clean(body.primaryGoal),
  };

  const requiredFields =
    payload.accountType === "company"
      ? ["accountType", "phone", "jobTitle", "businessName", "businessType", "country", "city", "primaryGoal"]
      : ["accountType", "phone", "jobTitle", "businessType", "country", "city", "primaryGoal"];
  const missing = requiredFields.filter((field) => !payload[field]);

  if (missing.length) {
    return badRequest("Please complete all required fields.", { missing });
  }

  const { data: row, error } = await supabase
    .from("kyc_profiles")
    .upsert(
      {
        user_id: user.id,
        account_type: payload.accountType,
        phone: payload.phone,
        job_title: payload.jobTitle,
        business_name: payload.businessName,
        business_type: payload.businessType,
        country: payload.country,
        city: payload.city,
        website: payload.website,
        primary_goal: payload.primaryGoal,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return json({ profile: kycProfileFromRow(row), completed: true });
}
