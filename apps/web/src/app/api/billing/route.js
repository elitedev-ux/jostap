import { json, unauthorized } from "../utils/http.js";
import { cardLimitForPlan } from "../utils/cards.js";
import { getSessionUser } from "../utils/session.js";
import { getSupabaseAdmin } from "../utils/supabase.js";

function subscriptionFromRow(row) {
  if (!row) {
    return {
      plan: "free",
      billingCycle: "free",
      status: "active",
      provider: "free",
      cardLimit: cardLimitForPlan("free"),
    };
  }

  return {
    id: row.id,
    plan: row.plan,
    billingCycle: row.billing_cycle,
    status: row.status,
    provider: row.provider || "manual",
    currentPeriodStart: row.current_period_start || "",
    currentPeriodEnd: row.current_period_end || "",
    cardLimit: cardLimitForPlan(row.plan),
  };
}

function invoiceFromRow(row) {
  return {
    id: row.id,
    invoiceNumber: row.invoice_number || row.id?.slice(0, 8) || "",
    amountCents: row.amount_cents || 0,
    currency: row.currency || "usd",
    status: row.status || "open",
    hostedInvoiceUrl: row.hosted_invoice_url || "",
    issuedAt: row.issued_at || "",
    paidAt: row.paid_at || "",
  };
}

export async function GET(request) {
  const user = await getSessionUser(request);

  if (!user) {
    return unauthorized();
  }

  const supabase = getSupabaseAdmin();
  const [
    { data: subscription, error: subscriptionError },
    { data: invoices, error: invoicesError },
    { data: cards, error: cardsError },
    { data: appointments, error: appointmentsError },
  ] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("invoices")
      .select("*")
      .eq("user_id", user.id)
      .order("issued_at", { ascending: false }),
    supabase.from("cards").select("id, views, taps, qr_scans").eq("user_id", user.id),
    supabase.from("appointments").select("id").eq("user_id", user.id),
  ]);

  const error =
    subscriptionError || invoicesError || cardsError || appointmentsError;

  if (error) {
    throw error;
  }

  const cardRows = cards || [];
  const usage = {
    cards: cardRows.length,
    views: cardRows.reduce((sum, card) => sum + Number(card.views || 0), 0),
    qrScans: cardRows.reduce((sum, card) => sum + Number(card.qr_scans || 0), 0),
    taps: cardRows.reduce((sum, card) => sum + Number(card.taps || 0), 0),
    appointments: (appointments || []).length,
  };

  return json({
    subscription: subscriptionFromRow(subscription),
    invoices: (invoices || []).map(invoiceFromRow),
    usage,
  });
}
