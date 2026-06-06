import { badRequest, json, unauthorized } from "../../utils/http.js";
import { getSessionUser } from "../../utils/session.js";
import { getSupabaseAdmin } from "../../utils/supabase.js";

const PLANS = new Set(["free", "jostap_nfc", "custom_nfc", "basic_renewal", "premium_renewal"]);
const CYCLES = new Set(["free", "one_time", "yearly"]);

function addPeriod(cycle) {
  const date = new Date();
  date.setMonth(date.getMonth() + (cycle === "yearly" ? 12 : cycle === "free" ? 120 : 12));
  return date.toISOString();
}

export async function POST(request) {
  const user = await getSessionUser(request);

  if (!user) {
    return unauthorized();
  }

  const body = await request.json().catch(() => null);
  const plan = String(body?.plan || "jostap_nfc").toLowerCase();
  const billingCycle = String(body?.billingCycle || body?.billing || (plan === "free" ? "free" : "one_time")).toLowerCase();

  if (!PLANS.has(plan) || !CYCLES.has(billingCycle)) {
    return badRequest("Choose a valid plan and billing cycle.");
  }

  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const { data: existing, error: lookupError } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", user.id)
    .in("status", ["pending", "active", "past_due"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lookupError) {
    throw lookupError;
  }

  const payload = {
    user_id: user.id,
    plan,
    billing_cycle: billingCycle,
    status: "active",
    provider: plan === "free" ? "free" : "free_upgrade",
    current_period_start: now,
    current_period_end: addPeriod(billingCycle),
  };

  const query = existing
    ? supabase.from("subscriptions").update(payload).eq("id", existing.id)
    : supabase.from("subscriptions").insert(payload);

  const { data: subscription, error } = await query
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return json({ subscription });
}
