import { badRequest, json, readJson, unauthorized } from "../../utils/http.js";
import { activePlanForUser, applyPlanLimits, cardFromRow, cardPayload } from "../../utils/cards.js";
import { getSessionUser } from "../../utils/session.js";
import { getSupabaseAdmin, isUniqueViolation } from "../../utils/supabase.js";
import { cardProfileUrl, cardQrUrl } from "../../../../utils/publicUrl.js";

function cardResponse(row, request) {
  return {
    ...cardFromRow(row),
    publicUrl: cardProfileUrl(row.slug, { request }),
    qrUrl: cardQrUrl(row, { request }),
  };
}

async function findCard(userId, id) {
  const supabase = getSupabaseAdmin();
  const { data: row, error } = await supabase
    .from("cards")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return row || null;
}

export async function GET(request, { params }) {
  const user = await getSessionUser(request);

  if (!user) {
    return unauthorized();
  }

  const row = await findCard(user.id, params.id);

  if (!row) {
    return json({ error: "Card not found." }, { status: 404 });
  }

  return json({ card: cardResponse(row, request) });
}

export async function PUT(request, { params }) {
  const user = await getSessionUser(request);

  if (!user) {
    return unauthorized();
  }

  const body = await readJson(request);

  if (!body) {
    return badRequest("Invalid request body.");
  }

  const existing = await findCard(user.id, params.id);

  if (!existing) {
    return json({ error: "Card not found." }, { status: 404 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const plan = await activePlanForUser(supabase, user.id);
    const card = applyPlanLimits(cardPayload({ ...cardFromRow(existing), ...body }), plan);

    if (!card.name || !card.email || !card.slug) {
      return badRequest("Name, email, and public slug are required.");
    }

    const { data: row, error } = await supabase
      .from("cards")
      .update({
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
      .eq("id", params.id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return json({ card: cardResponse(row, request) });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return badRequest("This public slug is already in use.");
    }

    throw error;
  }
}

export async function DELETE(request, { params }) {
  const user = await getSessionUser(request);

  if (!user) {
    return unauthorized();
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("cards")
    .delete()
    .eq("id", params.id)
    .eq("user_id", user.id);

  if (error) {
    throw error;
  }

  return json({ ok: true });
}
