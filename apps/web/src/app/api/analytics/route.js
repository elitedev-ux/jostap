import { json, unauthorized } from "../utils/http.js";
import { getSessionUser } from "../utils/session.js";
import { getSupabaseAdmin } from "../utils/supabase.js";

function total(rows, key) {
  return (rows || []).reduce((sum, row) => sum + Number(row[key] || 0), 0);
}

const PERIOD_DAYS = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "1y": 365,
};

function dayKey(date) {
  return date.toISOString().slice(0, 10);
}

function periodFromRequest(request) {
  const value = new URL(request.url).searchParams.get("period") || "30d";
  return PERIOD_DAYS[value] ? value : "30d";
}

function buildTrend({ cards, leads, period }) {
  const days = PERIOD_DAYS[period] || 30;
  const today = new Date();
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  const buckets = Array.from({ length: days }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      key: dayKey(date),
      date: date.toLocaleDateString("en", {
        month: "short",
        day: "numeric",
      }),
      views: 0,
      taps: 0,
      qr: 0,
      leads: 0,
    };
  });
  const bucketByKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  for (const card of cards) {
    const sourceDate = new Date(card.updated_at || card.created_at || today);
    const key = bucketByKey.has(dayKey(sourceDate)) ? dayKey(sourceDate) : dayKey(today);
    const bucket = bucketByKey.get(key) || buckets[buckets.length - 1];
    bucket.views += Number(card.views || 0);
    bucket.taps += Number(card.taps || 0);
    bucket.qr += Number(card.qr_scans || 0);
  }

  for (const lead of leads) {
    const sourceDate = new Date(lead.created_at || today);
    const bucket = bucketByKey.get(dayKey(sourceDate));
    if (bucket) bucket.leads += 1;
  }

  return buckets;
}

export async function GET(request) {
  const user = await getSessionUser(request);

  if (!user) {
    return unauthorized();
  }

  const supabase = getSupabaseAdmin();
  const period = periodFromRequest(request);
  const [{ data: cards, error: cardsError }, { data: leads, error: leadsError }] =
    await Promise.all([
      supabase.from("cards").select("*").eq("user_id", user.id),
      supabase.from("leads").select("id, source, created_at").eq("user_id", user.id),
    ]);

  if (cardsError || leadsError) {
    throw cardsError || leadsError;
  }

  const cardRows = cards || [];
  const leadRows = leads || [];
  const totals = {
    views: total(cardRows, "views"),
    taps: total(cardRows, "taps"),
    qrScans: total(cardRows, "qr_scans"),
    leads: leadRows.length,
  };

  const trend = buildTrend({ cards: cardRows, leads: leadRows, period });

  return json({
    totals,
    period,
    trend,
    cards: cardRows.map((card) => ({
      id: card.id,
      name: card.name,
      slug: card.slug,
      views: card.views || 0,
      taps: card.taps || 0,
      qrScans: card.qr_scans || 0,
    })),
    sources: leadRows.reduce((items, lead) => {
      const source = lead.source || "card";
      const found = items.find((item) => item.source === source);
      if (found) found.visits += 1;
      else items.push({ source, visits: 1 });
      return items;
    }, []),
  });
}
