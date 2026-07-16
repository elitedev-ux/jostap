import { json, unauthorized } from "../utils/http.js";
import { cardFromRow, cardLimitForPlan, cardLimitForUserAccount } from "../utils/cards.js";
import { accountFromUserAndKyc } from "../utils/profile.js";
import { getSessionUser } from "../utils/session.js";
import { getSupabaseAdmin } from "../utils/supabase.js";
import { accessFromPlanAndTrial, trialStateFromUser } from "../utils/trial.js";
import { cardNfcUrl, cardQrUrl, publicCardUrl } from "../../../utils/publicUrl.js";

function hasConfirmedPlanAccess(row) {
  if (!row || !["active", "past_due"].includes(row.status)) return false;
  if (row.plan === "free") return true;
  if (row.current_period_end && new Date(row.current_period_end).getTime() <= Date.now()) return false;

  return !["free", "free_upgrade"].includes(String(row.provider || "").toLowerCase());
}

function preferredSubscription(rows = []) {
  return rows.find((row) => hasConfirmedPlanAccess(row)) || rows[0] || null;
}

const PERIOD_DAYS = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "1y": 365,
};

function total(rows, key) {
  return (rows || []).reduce((sum, row) => sum + Number(row[key] || 0), 0);
}

function dayKey(date) {
  return date.toISOString().slice(0, 10);
}

function periodFromRequest(request) {
  const value = new URL(request.url).searchParams.get("period") || "30d";
  return PERIOD_DAYS[value] ? value : "30d";
}

function periodStart(period) {
  const days = PERIOD_DAYS[period] || 30;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  return start;
}

function buildEmptyTrend(period) {
  const days = PERIOD_DAYS[period] || 30;
  const start = periodStart(period);

  return Array.from({ length: days }, (_, index) => {
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
      contactDownloads: 0,
      socialClicks: 0,
      appointments: 0,
    };
  });
}

function deviceName(userAgent = "") {
  const value = String(userAgent).toLowerCase();
  if (!value) return "Unknown";
  if (value.includes("iphone") || value.includes("ipad") || value.includes("android") || value.includes("mobile")) return "Mobile";
  if (value.includes("tablet")) return "Tablet";
  return "Desktop";
}

function sourceName(referrer = "") {
  const value = String(referrer || "").trim();
  if (!value) return null;

  try {
    const url = new URL(value);
    const hostname = url.hostname.replace(/^www\./, "").toLowerCase();
    if (
      hostname === "jostap.com" ||
      hostname.endsWith(".jostap.com") ||
      hostname === "jostap.vercel.app" ||
      hostname.endsWith(".jostap.vercel.app") ||
      hostname === "example.com" ||
      hostname.endsWith(".example.com")
    ) {
      return null;
    }
    return hostname;
  } catch {
    return null;
  }
}

function countBy(items, keyFn, valueName) {
  const counts = new Map();
  for (const item of items || []) {
    const key = keyFn(item);
    if (!key) continue;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return Array.from(counts.entries()).map(([name, count]) => ({
    [valueName]: name,
    visits: count,
    value: count,
  }));
}

function buildTrend({ events, period }) {
  const buckets = buildEmptyTrend(period);
  const bucketByKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  for (const event of events || []) {
    const key = dayKey(new Date(event.created_at));
    const bucket = bucketByKey.get(key);
    if (!bucket) continue;

    if (event.event_type === "profile_view") bucket.views += 1;
    if (event.event_type === "nfc_tap") bucket.taps += 1;
    if (event.event_type === "qr_scan") bucket.qr += 1;
    if (event.event_type === "contact_download") bucket.contactDownloads += 1;
    if (event.event_type === "social_click") bucket.socialClicks += 1;
  }

  return buckets;
}

function addAppointmentsToTrend({ trend, appointments }) {
  const bucketByKey = new Map(trend.map((bucket) => [bucket.key, bucket]));
  for (const appointment of appointments || []) {
    const key = dayKey(new Date(appointment.created_at));
    const bucket = bucketByKey.get(key);
    if (bucket) bucket.appointments += 1;
  }
  return trend;
}

function subscriptionFromRow(row, user, cardLimitInfo = null) {
  const trial = trialStateFromUser(user);
  const billingPlan = row?.plan || "free";
  const accessPlan = hasConfirmedPlanAccess(row) ? billingPlan : "free";
  const features = accessFromPlanAndTrial(accessPlan, trial);
  const defaultCardLimit = features.hasPremiumFeatures ? null : cardLimitForPlan(accessPlan);
  const cardLimit = cardLimitInfo ? cardLimitInfo.limit : defaultCardLimit;
  const cardLimitReason = cardLimitInfo?.reason || (cardLimit === null ? "unlimited" : "plan_card_limit");

  if (!row) {
    return {
      plan: features.effectivePlan,
      basePlan: billingPlan,
      billingCycle: "free",
      status: "active",
      provider: "free",
      currentPeriodStart: "",
      currentPeriodEnd: "",
      cardLimit,
      cardLimitReason,
      purchasedCardSlots: cardLimitInfo?.purchasedSlots ?? null,
      trial,
      features,
    };
  }

  return {
    id: row.id,
    plan: features.effectivePlan,
    basePlan: billingPlan,
    accessPlan,
    billingCycle: row.billing_cycle,
    status: row.status,
    provider: row.provider || "manual",
    currentPeriodStart: row.current_period_start || "",
    currentPeriodEnd: row.current_period_end || "",
    cardLimit,
    cardLimitReason,
    purchasedCardSlots: cardLimitInfo?.purchasedSlots ?? null,
    trial,
    features,
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

function cardResponse(row, request) {
  return {
    ...cardFromRow(row),
    publicUrl: publicCardUrl(row, { request }),
    qrUrl: cardQrUrl(row, { request }),
    nfcUrl: cardNfcUrl(row, { request }),
  };
}

export async function GET(request) {
  const user = await getSessionUser(request);

  if (!user) {
    return unauthorized();
  }

  const supabase = getSupabaseAdmin();
  const period = periodFromRequest(request);
  const start = periodStart(period);
  const now = new Date().toISOString();
  const requestedCardId = new URL(request.url).searchParams.get("cardId") || "all";

  const [
    { data: profile, error: profileError },
    { data: subscriptionRows, error: subscriptionError },
    { data: invoices, error: invoicesError },
    { data: cards, error: cardsError },
    { data: events, error: eventsError },
    { data: appointments, error: appointmentsError },
    { data: leads, error: leadsError },
    { data: announcements, error: announcementsError },
    { data: reads, error: readsError },
  ] = await Promise.all([
    supabase.from("kyc_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("invoices")
      .select("*")
      .eq("user_id", user.id)
      .order("issued_at", { ascending: false })
      .limit(5),
    supabase
      .from("cards")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("card_engagement_events")
      .select("card_id, event_type, referrer, user_agent, created_at")
      .eq("user_id", user.id)
      .gte("created_at", start.toISOString()),
    supabase
      .from("appointments")
      .select("id, card_id, status, created_at")
      .eq("assigned_user_id", user.id)
      .gte("created_at", start.toISOString()),
    supabase
      .from("leads")
      .select("id")
      .eq("user_id", user.id),
    supabase
      .from("announcements")
      .select("*")
      .eq("status", "published")
      .lte("published_at", now)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .or(`target_user_id.is.null,target_user_id.eq.${user.id}`)
      .in("audience", user.role === "admin" ? ["all", "admins"] : ["all", "users"])
      .order("published_at", { ascending: false }),
    supabase.from("announcement_reads").select("announcement_id").eq("user_id", user.id),
  ]);

  const error =
    profileError ||
    subscriptionError ||
    invoicesError ||
    cardsError ||
    eventsError ||
    appointmentsError ||
    leadsError ||
    announcementsError ||
    readsError;

  if (error) {
    throw error;
  }

  const allCardRows = cards || [];
  const selectedCardId = allCardRows.some((card) => card.id === requestedCardId) ? requestedCardId : "all";
  const analyticsCardRows =
    selectedCardId === "all"
      ? allCardRows
      : allCardRows.filter((card) => card.id === selectedCardId);
  const eventRows =
    selectedCardId === "all"
      ? events || []
      : (events || []).filter((event) => event.card_id === selectedCardId);
  const allAppointmentRows = appointments || [];
  const appointmentRows =
    selectedCardId === "all"
      ? allAppointmentRows
      : allAppointmentRows.filter((appointment) => appointment.card_id === selectedCardId);
  const leadRows = leads || [];
  const usage = {
    cards: allCardRows.length,
    views: total(allCardRows, "views"),
    qrScans: total(allCardRows, "qr_scans"),
    taps: total(allCardRows, "taps"),
    appointments: allAppointmentRows.length,
    leads: leadRows.length,
    socialClicks: (events || []).filter((event) => event.event_type === "social_click").length,
  };
  const totals = {
    cards: analyticsCardRows.length,
    views: total(analyticsCardRows, "views"),
    qrScans: total(analyticsCardRows, "qr_scans"),
    taps: total(analyticsCardRows, "taps"),
    appointments: appointmentRows.length,
    leads: leadRows.length,
    contactDownloads: total(analyticsCardRows, "contact_downloads"),
    socialClicks: eventRows.filter((event) => event.event_type === "social_click").length,
    pendingAppointments: appointmentRows.filter((appointment) => appointment.status === "pending").length,
    approvedAppointments: appointmentRows.filter((appointment) => appointment.status === "approved").length,
    completedAppointments: appointmentRows.filter((appointment) => appointment.status === "completed").length,
  };
  const sourceEvents = eventRows.filter((event) => event.event_type === "profile_view" || event.event_type === "qr_scan");
  const deviceCounts = countBy(sourceEvents, (event) => deviceName(event.user_agent), "name");
  const deviceTotal = deviceCounts.reduce((sum, item) => sum + item.value, 0) || 1;
  const readIds = new Set((reads || []).map((read) => read.announcement_id));
  const announcementRows = (announcements || []).map((announcement) => ({
    ...announcement,
    isRead: readIds.has(announcement.id),
  }));
  const subscription = preferredSubscription(subscriptionRows || []);
  const billingPlan = hasConfirmedPlanAccess(subscription)
    ? subscription?.plan || "free"
    : "free";
  const cardLimitInfo = await cardLimitForUserAccount(
    supabase,
    user.id,
    billingPlan,
    profile,
  );

  return json({
    account: accountFromUserAndKyc(user, profile),
    billing: {
      subscription: subscriptionFromRow(subscription, user, cardLimitInfo),
      invoices: (invoices || []).map(invoiceFromRow),
      usage,
    },
    cards: allCardRows.map((row) => cardResponse(row, request)),
    analytics: {
      totals,
      period,
      selectedCardId,
      cardOptions: allCardRows.map((card) => ({
        id: card.id,
        name: card.name,
        title: card.title || "",
        company: card.company || "",
        slug: card.slug || "",
      })),
      trend: addAppointmentsToTrend({
        trend: buildTrend({ events: eventRows, period }),
        appointments: appointmentRows,
      }),
      cards: analyticsCardRows.map((card) => ({
        id: card.id,
        name: card.name,
        slug: card.slug,
        views: card.views || 0,
        taps: card.taps || 0,
        qrScans: card.qr_scans || 0,
        contactDownloads: card.contact_downloads || 0,
      })),
      sources: countBy(sourceEvents, (event) => sourceName(event.referrer), "source").sort((a, b) => b.visits - a.visits),
      devices: deviceCounts.map((item) => ({
        name: item.name,
        value: Math.round((item.value / deviceTotal) * 100),
        visits: item.value,
      })),
    },
    announcements: {
      announcements: announcementRows,
      unread: announcementRows.filter((item) => !item.isRead).length,
    },
  });
}
