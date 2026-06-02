import { json, unauthorized } from "../../../utils/http.js";
import { activePlanForUser, assertCanCreateCard, cardFromRow } from "../../../utils/cards.js";
import { getSessionUser } from "../../../utils/session.js";
import { getSupabaseAdmin } from "../../../utils/supabase.js";
import { publicCardUrl, cardQrUrl } from "../../../../../utils/publicUrl.js";

function cardResponse(row, request) {
  return {
    ...cardFromRow(row),
    publicUrl: publicCardUrl(row, { request }),
    qrUrl: cardQrUrl(row, { request }),
  };
}

export async function POST(request, { params }) {
  const user = await getSessionUser(request);

  if (!user) {
    return unauthorized();
  }

  const supabase = getSupabaseAdmin();
  const plan = await activePlanForUser(supabase, user.id);
  try {
    await assertCanCreateCard(supabase, user.id, plan);
  } catch (error) {
    if (error.code === "PLAN_CARD_LIMIT") {
      return json({ error: error.message, upgradeRequired: true }, { status: 402 });
    }
    throw error;
  }

  const { data: source, error: sourceError } = await supabase
    .from("cards")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (sourceError) {
    throw sourceError;
  }

  if (!source) {
    return json({ error: "Card not found." }, { status: 404 });
  }

  const { data: row, error } = await supabase
    .from("cards")
    .insert({
      user_id: user.id,
      name: `${source.name} Copy`,
      title: source.title,
      company: source.company,
      slug: `${source.slug}-copy-${Date.now().toString().slice(-4)}`,
      bio: source.bio,
      email: source.email,
      phone: source.phone,
      website: source.website,
      theme: source.theme || {},
      social_links: source.social_links || {},
      active: source.active,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return json({ card: cardResponse(row, request) }, { status: 201 });
}
