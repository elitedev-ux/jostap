import { badRequest, json, readJson, unauthorized } from "../utils/http.js";
import { normalizeSlug } from "../utils/cards.js";
import { clearSessionCookie, getSessionUser } from "../utils/session.js";
import { getSupabaseAdmin, isUniqueViolation } from "../utils/supabase.js";
import { accountFromUserAndKyc, splitFullName } from "../utils/profile.js";
import { toOriginStorageUrl } from "../utils/storageUrls.js";

function clean(value) {
  return String(value || "").trim();
}

async function deleteStorageFolder(supabase, bucket, folder) {
  const { data: files, error: listError } = await supabase.storage
    .from(bucket)
    .list(folder);

  if (listError) {
    if (/not found|does not exist/i.test(listError.message || "")) return;
    throw listError;
  }

  const paths = (files || [])
    .filter((file) => file?.name)
    .map((file) => `${folder}/${file.name}`);

  if (paths.length === 0) return;

  const { error: removeError } = await supabase.storage.from(bucket).remove(paths);

  if (removeError) {
    throw removeError;
  }
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
  const supabase = getSupabaseAdmin();

  if (!name || !email || !title || !company || !phone || !country || !city) {
    return badRequest("Name, email, job title, company, phone, country, and city are required.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return badRequest("Enter a valid email address.");
  }

  if (email !== String(user.email || "").toLowerCase()) {
    return badRequest("Email changes require verification. Please contact support to change your account email.");
  }

  const { firstName, lastName } = splitFullName(name);
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

export async function DELETE(request) {
  const user = await getSessionUser(request);

  if (!user) {
    return unauthorized();
  }

  const supabase = getSupabaseAdmin();

  await Promise.all([
    deleteStorageFolder(supabase, "avatars", user.id),
    deleteStorageFolder(supabase, "card-media", user.id),
  ]);

  const { data: cards, error: cardsLookupError } = await supabase
    .from("cards")
    .select("id")
    .eq("user_id", user.id);

  if (cardsLookupError) {
    throw cardsLookupError;
  }

  const cardIds = (cards || []).map((card) => card.id).filter(Boolean);

  if (cardIds.length > 0) {
    const { error: eventsByCardError } = await supabase
      .from("card_engagement_events")
      .delete()
      .in("card_id", cardIds);

    if (eventsByCardError) {
      throw eventsByCardError;
    }
  }

  const deleteSteps = [
    supabase.from("card_engagement_events").delete().eq("user_id", user.id),
    supabase.from("cards").delete().eq("user_id", user.id),
    supabase.from("support_ticket_messages").delete().eq("sender_user_id", user.id),
    supabase.from("support_tickets").delete().eq("user_id", user.id),
    supabase.from("admin_audit_logs").delete().eq("admin_user_id", user.id),
    supabase.from("announcements").delete().eq("admin_user_id", user.id),
    supabase.from("users").delete().eq("id", user.id),
  ];

  for (const step of deleteSteps) {
    const { error } = await step;

    if (error) {
      throw error;
    }
  }

  return json(
    { ok: true },
    {
      headers: {
        "Set-Cookie": clearSessionCookie(request),
      },
    },
  );
}
