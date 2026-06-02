import { cardFromRow } from "../../../utils/cards.js";
import { json } from "../../../utils/http.js";
import { getSupabaseAdmin, hasSupabase } from "../../../utils/supabase.js";
import { publicCardUrl, cardQrUrl } from "../../../../../utils/publicUrl.js";

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || ""));
}

function safePublicCard(row) {
  const {
    userId: _userId,
    assignmentStatus: _assignmentStatus,
    updatedAt: _updatedAt,
    ...card
  } = cardFromRow(row);

  return card;
}

async function findPublicCard(supabase, token, select = "*") {
  const value = String(token || "").trim();
  if (!value) return { data: null, error: null };

  if (isUuid(value)) {
    const byId = await supabase
      .from("cards")
      .select(select)
      .eq("active", true)
      .eq("id", value)
      .maybeSingle();

    if (byId.error || byId.data) return byId;
  }

  return supabase
    .from("cards")
    .select(select)
    .eq("active", true)
    .eq("slug", value)
    .maybeSingle();
}

export async function GET(request, { params }) {
  if (!hasSupabase()) {
    return json({ error: "Card not found." }, { status: 404 });
  }

  const supabase = getSupabaseAdmin();
  const { data: row, error } = await findPublicCard(supabase, params.id);

  if (error) throw error;

  if (!row) {
    return json({ error: "Card not found." }, { status: 404 });
  }

  await supabase
    .from("cards")
    .update({ views: Number(row.views || 0) + 1 })
    .eq("id", row.id);

  let subscription = null;

  if (row.user_id) {
    const { data, error: subscriptionError } = await supabase
      .from("subscriptions")
      .select("plan,status")
      .eq("user_id", row.user_id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subscriptionError) throw subscriptionError;
    subscription = data;
  }

  return json({
    card: {
      ...safePublicCard(row),
      plan: subscription?.plan || "free",
      publicUrl: publicCardUrl(row, { request }),
      qrUrl: cardQrUrl(row, { request }),
    },
  });
}

export async function POST(_request, { params }) {
  if (!hasSupabase()) {
    return json({ ok: true });
  }

  const supabase = getSupabaseAdmin();
  const { data: row, error } = await findPublicCard(supabase, params.id, "id, contact_downloads");

  if (error) throw error;

  if (!row) {
    return json({ error: "Card not found." }, { status: 404 });
  }

  const { error: updateError } = await supabase
    .from("cards")
    .update({ contact_downloads: Number(row.contact_downloads || 0) + 1 })
    .eq("id", row.id);

  if (updateError) throw updateError;

  return json({ ok: true });
}
