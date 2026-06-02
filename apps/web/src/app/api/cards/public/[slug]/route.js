import { cardFromRow } from "../../../utils/cards.js";
import { json } from "../../../utils/http.js";
import { getSupabaseAdmin, hasSupabase } from "../../../utils/supabase.js";
import { cardProfileUrl, cardQrUrl } from "../../../../../utils/publicUrl.js";

export async function GET(request, { params }) {
  if (!hasSupabase()) {
    return json({ error: "Card not found." }, { status: 404 });
  }

  const supabase = getSupabaseAdmin();
  const { data: row, error } = await supabase
    .from("cards")
    .select("*")
    .eq("slug", params.slug)
    .eq("active", true)
    .maybeSingle();

  if (error) {
    throw error;
  }

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

    if (subscriptionError) {
      throw subscriptionError;
    }

    subscription = data;
  }

  return json({
    card: {
      ...cardFromRow(row),
      plan: subscription?.plan || "free",
      publicUrl: cardProfileUrl(row.slug, { request }),
      qrUrl: cardQrUrl(row, { request }),
    },
  });
}

export async function POST(_request, { params }) {
  if (!hasSupabase()) {
    return json({ ok: true });
  }

  const supabase = getSupabaseAdmin();
  const { data: row, error } = await supabase
    .from("cards")
    .select("id, contact_downloads")
    .eq("slug", params.slug)
    .eq("active", true)
    .maybeSingle();

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
