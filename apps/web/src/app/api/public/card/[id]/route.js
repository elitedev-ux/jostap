import { activePlanForUser, cardFromRow } from "../../../utils/cards.js";
import { engagementTypeFromSource, recordCardEngagement } from "../../../utils/engagement.js";
import { json } from "../../../utils/http.js";
import { getSupabaseAdmin, hasSupabase } from "../../../utils/supabase.js";
import { cardNfcUrl, publicCardUrl, cardQrUrl } from "../../../../../utils/publicUrl.js";

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

  const source = new URL(request.url).searchParams.get("source");
  await recordCardEngagement(supabase, {
    card: row,
    type: engagementTypeFromSource(source),
    request,
  });

  let plan = "free";

  if (row.user_id) {
    plan = await activePlanForUser(supabase, row.user_id);
  }

  return json({
    card: {
      ...safePublicCard(row),
      plan,
      publicUrl: publicCardUrl(row, { request }),
      qrUrl: cardQrUrl(row, { request }),
      nfcUrl: cardNfcUrl(row, { request }),
    },
  });
}

export async function POST(request, { params }) {
  if (!hasSupabase()) {
    return json({ ok: true });
  }

  const supabase = getSupabaseAdmin();
  const { data: row, error } = await findPublicCard(supabase, params.id, "id, user_id, contact_downloads");

  if (error) throw error;

  if (!row) {
    return json({ error: "Card not found." }, { status: 404 });
  }

  await recordCardEngagement(supabase, { card: row, type: "contact_download", request });

  return json({ ok: true });
}
