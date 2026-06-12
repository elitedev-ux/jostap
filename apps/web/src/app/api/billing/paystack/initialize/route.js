import { badRequest, json, unauthorized } from "../../../utils/http.js";
import { getSessionUser } from "../../../utils/session.js";
import { getSupabaseAdmin } from "../../../utils/supabase.js";
import {
  assertPaystackConfigured,
  callbackUrlForRequest,
  initializePaystackTransaction,
  makePaystackReference,
  PAYSTACK_PROVIDER,
  paystackCurrency,
  planAmountKobo,
} from "../../../utils/paystack.js";

const PLANS = new Set(["jostap_nfc", "custom_nfc", "basic_renewal", "premium_renewal"]);
const CYCLES = new Set(["one_time", "yearly"]);

function hasConfirmedPaidAccess(row) {
  if (!row || !["active", "past_due"].includes(row.status)) return false;
  if (row.plan === "free") return false;

  return !["free", "free_upgrade"].includes(String(row.provider || "").toLowerCase());
}

function addPeriod(cycle) {
  const date = new Date();
  date.setMonth(date.getMonth() + (cycle === "yearly" ? 12 : 12));
  return date.toISOString();
}

export async function POST(request) {
  try {
    const user = await getSessionUser(request);

    if (!user) {
      return unauthorized();
    }

    const body = await request.json().catch(() => null);
    const plan = String(body?.plan || "jostap_nfc").toLowerCase();
    const billingCycle = String(body?.billingCycle || body?.billing || "one_time").toLowerCase();

    if (!PLANS.has(plan) || !CYCLES.has(billingCycle)) {
      return badRequest("Choose a valid paid plan and billing cycle.");
    }

    try {
      assertPaystackConfigured();
    } catch (error) {
      console.error("Paystack configuration error:", error);
      return json({ error: "Payment checkout is not available right now." }, { status: 503 });
    }

    const supabase = getSupabaseAdmin();
    const amountKobo = await planAmountKobo(supabase, plan, billingCycle);

    if (!amountKobo) {
      return badRequest("This plan does not have a configured Paystack amount.");
    }

    const now = new Date().toISOString();
    const { data: existing, error: lookupError } = await supabase
      .from("subscriptions")
      .select("id,plan,status,provider")
      .eq("user_id", user.id)
      .in("status", ["pending", "active", "past_due"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lookupError) {
      throw lookupError;
    }

    if (hasConfirmedPaidAccess(existing)) {
      return badRequest("This account already has an active paid plan.");
    }

    const subscriptionPayload = {
      user_id: user.id,
      plan,
      billing_cycle: billingCycle,
      status: "pending",
      provider: PAYSTACK_PROVIDER,
      current_period_start: now,
      current_period_end: addPeriod(billingCycle),
    };

    const subscriptionQuery = existing
      ? supabase.from("subscriptions").update(subscriptionPayload).eq("id", existing.id)
      : supabase.from("subscriptions").insert(subscriptionPayload);

    const { data: subscription, error: subscriptionError } = await subscriptionQuery
      .select("*")
      .single();

    if (subscriptionError) {
      throw subscriptionError;
    }

    const reference = makePaystackReference(user.id);
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        user_id: user.id,
        subscription_id: subscription.id,
        amount_cents: amountKobo,
        currency: paystackCurrency().toLowerCase(),
        status: "pending",
        provider: PAYSTACK_PROVIDER,
        provider_payment_id: reference,
      })
      .select("*")
      .single();

    if (paymentError) {
      throw paymentError;
    }

    const callbackUrl = callbackUrlForRequest(request);
    const authorization = await initializePaystackTransaction({
      email: user.email,
      amountKobo,
      reference,
      callbackUrl,
      metadata: {
        app: "jostap",
        user_id: user.id,
        subscription_id: subscription.id,
        payment_id: payment.id,
        plan,
        billing_cycle: billingCycle,
      },
    });

    if (!authorization.authorization_url) {
      return json(
        { error: "Paystack did not return a checkout URL." },
        { status: 502 },
      );
    }

    return json({
      authorizationUrl: authorization.authorization_url,
      accessCode: authorization.access_code || "",
      reference,
    });
  } catch (error) {
    console.error("Paystack checkout initialization failed:", error);
    return json(
      {
        error:
          process.env.NODE_ENV === "production"
            ? "Unable to start Paystack checkout."
            : error.message || "Unable to start Paystack checkout.",
      },
      { status: 500 },
    );
  }
}
