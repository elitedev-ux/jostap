import { badRequest, json, readJson, unauthorized } from "../utils/http.js";
import { activePlanForUser, applyPlanLimits, cardFromRow, cardPayload } from "../utils/cards.js";
import { getSessionUser } from "../utils/session.js";
import { getSupabaseAdmin, isUniqueViolation } from "../utils/supabase.js";
import { cardProfileUrl, cardQrUrl } from "../../../utils/publicUrl.js";

function cardResponse(row, request) {
  return {
    ...cardFromRow(row),
    publicUrl: cardProfileUrl(row.slug, { request }),
    qrUrl: cardQrUrl(row, { request }),
  };
}

export async function GET(request) {
  const user = await getSessionUser(request);

  if (!user) {
    return unauthorized();
  }

  const supabase = getSupabaseAdmin();
  const { data: rows, error } = await supabase
    .from("cards")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return json({ cards: (rows || []).map((row) => cardResponse(row, request)) });
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

  try {
    const supabase = getSupabaseAdmin();
    const plan = await activePlanForUser(supabase, user.id);
    const card = applyPlanLimits(cardPayload(body), plan);

    if (!card.name || !card.email || !card.slug) {
      return badRequest("Name, email, and public slug are required.");
    }

    const { data: row, error } = await supabase
      .from("cards")
      .insert({
        user_id: user.id,
        name: card.name,
        title: card.title,
        company: card.company,
        slug: card.slug,
        bio: card.bio,
        email: card.email,
        phone: card.phone,
        website: card.website,
        avatar_url: card.avatarUrl,
        theme: card.theme,
        social_links: card.socialLinks,
        active: card.active,
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return json({ card: cardResponse(row, request) }, { status: 201 });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return badRequest("This public slug is already in use.");
    }

    throw error;
  }
}
