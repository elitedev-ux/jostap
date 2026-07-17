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
      .limit(1)
      .maybeSingle();

    if (byId.error || byId.data) return byId;
  }

  return supabase
    .from("cards")
    .select(select)
    .eq("active", true)
    .eq("slug", value)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
}

async function safeRecordPublicEngagement(supabase, { card, type, request }) {
  try {
    await recordPublicEngagement(supabase, { card, type, request });
  } catch (error) {
    console.error("Unable to record public card engagement", {
      cardId: card.id,
      type,
      message: error?.message,
      code: error?.code,
    });
  }
}

async function safeActivePlanForUser(supabase, userId) {
  if (!userId) return "free";

  try {
    return await activePlanForUser(supabase, userId);
  } catch (error) {
    console.error("Unable to resolve public card plan", {
      userId,
      message: error?.message,
      code: error?.code,
    });
    return "free";
  }
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
  await safeRecordPublicEngagement(supabase, {
    card: row,
    type: engagementTypeFromSource(source),
    request,
  });

  const plan = await safeActivePlanForUser(supabase, row.user_id);

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
