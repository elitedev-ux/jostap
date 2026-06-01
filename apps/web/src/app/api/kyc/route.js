import { badRequest, json, readJson, unauthorized } from "../utils/http.js";
import { getSessionUser } from "../utils/session.js";
import { getSupabaseAdmin } from "../utils/supabase.js";
import { kycProfileFromRow } from "../utils/profile.js";

const REQUIRED_FIELDS = [
  "phone",
  "jobTitle",
  "businessName",
  "businessType",
  "country",
  "city",
  "primaryGoal",
];

function clean(value) {
  return String(value || "").trim();
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

  const payload = {
    phone: clean(body.phone),
    jobTitle: clean(body.jobTitle),
    businessName: clean(body.businessName),
    businessType: clean(body.businessType),
    country: clean(body.country),
    city: clean(body.city),
    website: clean(body.website) || null,
    primaryGoal: clean(body.primaryGoal),
  };

  const missing = REQUIRED_FIELDS.filter((field) => !payload[field]);

  if (missing.length) {
    return badRequest("Please complete all required fields.", { missing });
  }

  const supabase = getSupabaseAdmin();
  const { data: row, error } = await supabase
    .from("kyc_profiles")
    .upsert(
      {
        user_id: user.id,
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
