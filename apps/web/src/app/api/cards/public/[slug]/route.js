import { activePlanForUser, cardFromRow } from "../../../utils/cards.js";
import { engagementTypeFromSource, recordCardEngagement } from "../../../utils/engagement.js";
import { json } from "../../../utils/http.js";
import { rateLimit, rateLimitKey } from "../../../utils/rateLimit.js";
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

async function recordPublicEngagement(supabase, { card, type, request }) {
  const limited = rateLimit(request, {
    key: rateLimitKey(request, "public-card-engagement", [card.id, type]),
    limit: 30,
    windowMs: 60_000,
  });

  if (!limited) {
    await recordCardEngagement(supabase, { card, type, request });
  }
}

export async function GET(request, { params }) {
  if (!hasSupabase()) {
    return json({ error: "Card not found." }, { status: 404 });
  }

  const supabase = getSupabaseAdmin();
  const token = String(params.slug || "").trim();
  const { data: row, error } = await findPublicCard(supabase, token);

  if (error) {
    throw error;
  }

  if (!row) {
    return json({ error: "Card not found." }, { status: 404 });
  }

  const source = new URL(request.url).searchParams.get("source");
  await recordPublicEngagement(supabase, {
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
  const token = String(params.slug || "").trim();
  const { data: row, error } = await findPublicCard(supabase, token, "id, user_id, contact_downloads");

  if (error) throw error;

  if (!row) {
    return json({ error: "Card not found." }, { status: 404 });
  }

  const limited = rateLimit(request, {
    key: rateLimitKey(request, "public-card-download", [row.id]),
    limit: 10,
    windowMs: 60_000,
  });
  if (limited) return limited;

  await recordCardEngagement(supabase, { card: row, type: "contact_download", request });

  return json({ ok: true });
}
