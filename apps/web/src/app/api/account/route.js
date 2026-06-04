import { badRequest, json, readJson, unauthorized } from "../utils/http.js";
import { normalizeSlug } from "../utils/cards.js";
import { getSessionUser } from "../utils/session.js";
import { getSupabaseAdmin, isUniqueViolation } from "../utils/supabase.js";
import { accountFromUserAndKyc, splitFullName } from "../utils/profile.js";
import { toOriginStorageUrl } from "../utils/storageUrls.js";

function clean(value) {
  return String(value || "").trim();
}

export async function PATCH(request) {
  const user = await getSessionUser(request);

  if (!user) {
    return unauthorized();
  }

  const body = await readJson(request);

  if (!body) {
    return badRequest("Invalid request body.");
  }

  const name = clean(body.name);
  const email = clean(body.email).toLowerCase();
  const title = clean(body.title);
  const company = clean(body.company);
  const phone = clean(body.phone);
  const website = clean(body.website);
  const country = clean(body.country);
  const city = clean(body.city);
  const bio = clean(body.bio);
  const avatarUrl = toOriginStorageUrl(clean(body.avatarUrl));
  const profileSlug = normalizeSlug(body.slug || body.profileSlug);
  const businessType = clean(body.businessType) || "Small business";
  const primaryGoal =
    clean(body.primaryGoal) || "Share my digital business card";

  if (!name || !email || !title || !company || !phone || !country || !city) {
    return badRequest("Name, email, job title, company, phone, country, and city are required.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return badRequest("Enter a valid email address.");
  }

  const { firstName, lastName } = splitFullName(name);
  const supabase = getSupabaseAdmin();
  const { data: updatedUser, error: userError } = await supabase
    .from("users")
    .update({
      first_name: firstName,
      last_name: lastName || firstName,
      company,
      email,
    })
    .eq("id", user.id)
    .select("id, first_name, last_name, company, email, role, created_at")
    .single();

  if (isUniqueViolation(userError)) {
    return badRequest("An account with this email already exists.");
  }

  if (userError) {
    throw userError;
  }

  const { data: profile, error: profileError } = await supabase
    .from("kyc_profiles")
    .upsert(
      {
        user_id: user.id,
        phone,
        job_title: title,
        business_name: company,
        business_type: businessType,
        country,
        city,
        website: website || null,
        primary_goal: primaryGoal,
        bio: bio || null,
        profile_slug: profileSlug || null,
        avatar_url: avatarUrl || null,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select("*")
    .single();

  if (profileError) {
    throw profileError;
  }

  return json({ user: accountFromUserAndKyc(updatedUser, profile) });
}
