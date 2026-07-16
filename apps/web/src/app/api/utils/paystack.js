import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const PAYSTACK_BASE_URL = "https://api.paystack.co";
const DEFAULT_CURRENCY = "NGN";
const PLAN_PRICE_KOBO = {
  free: { free: 0 },
  jostap_nfc: { one_time: 2000000 },
  custom_nfc: { one_time: 2500000 },
  basic_renewal: { yearly: 1000000 },
  premium_renewal: { yearly: 1500000 },
};
const LOCKED_PAYSTACK_PRICES = new Set(["jostap_nfc", "custom_nfc", "basic_renewal", "premium_renewal"]);
const VALID_PAYSTACK_PLANS = new Set(["jostap_nfc", "custom_nfc", "basic_renewal", "premium_renewal"]);
const VALID_PAYSTACK_CYCLES = new Set(["one_time", "yearly"]);

export const PAYSTACK_PROVIDER = "paystack";

export const PAYSTACK_PLAN_NAMES = {
  free: "Free",
  jostap_nfc: "JOSTAP Card",
  custom_nfc: "Custom Card",
  basic_renewal: "Team Access Renewal",
  premium_renewal: "Premium Access Repayment",
};

function secretKey() {
  return process.env.PAYSTACK_SECRET_KEY || "";
}

export function hasPaystack() {
  return Boolean(secretKey());
}

export function paystackCurrency() {
  return (process.env.PAYSTACK_CURRENCY || DEFAULT_CURRENCY).toUpperCase();
}

export function paystackMode() {
  const configured = String(process.env.PAYSTACK_MODE || "").trim().toLowerCase();
  if (configured) return configured;

  return secretKey().startsWith("sk_test_") ? "test" : "live";
}

export function assertPaystackConfigured() {
  const key = secretKey();

  if (!key) {
    throw new Error(
      "Paystack is not configured. Add PAYSTACK_SECRET_KEY to apps/web/.env.",
    );
  }

  if (paystackMode() === "test" && !key.startsWith("sk_test_")) {
    throw new Error("Configured Paystack mode requires a matching secret key prefix.");
  }

  if (paystackMode() === "live" && !key.startsWith("sk_live_")) {
    throw new Error("Paystack live mode requires an sk_live_ secret key.");
  }
}

export function makePaystackReference(userId) {
  const suffix = randomBytes(8).toString("hex");
  return `jostap_${String(userId || "user").slice(0, 8)}_${Date.now()}_${suffix}`;
}

export function makePaystackOrderId() {
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const suffix = randomBytes(3).toString("hex").toUpperCase();
  return `JST-${date}-${suffix}`;
}

export function paystackPlanName(plan) {
  return PAYSTACK_PLAN_NAMES[plan] || plan || "JOSTAP order";
}

function clean(value, maxLength = 160) {
  return String(value || "").trim().slice(0, maxLength);
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || ""),
  );
}

function addPeriodFrom(dateValue, cycle) {
  const date = dateValue ? new Date(dateValue) : new Date();
  if (Number.isNaN(date.getTime())) {
    return addPeriodFrom(null, cycle);
  }
  date.setMonth(date.getMonth() + (cycle === "yearly" ? 12 : 12));
  return date.toISOString();
}

function metadataFrom(transaction) {
  return transaction?.metadata && typeof transaction.metadata === "object"
    ? transaction.metadata
    : {};
}

function planFromTransaction(transaction) {
  const metadata = metadataFrom(transaction);
  const plan = clean(metadata.plan).toLowerCase();
  if (VALID_PAYSTACK_PLANS.has(plan)) return plan;

  const amount = Number(transaction?.amount || 0);
  if (amount === PLAN_PRICE_KOBO.custom_nfc.one_time || amount === 3000000) return "custom_nfc";
  if (amount === PLAN_PRICE_KOBO.basic_renewal.yearly) return "basic_renewal";
  if (amount === PLAN_PRICE_KOBO.premium_renewal.yearly || amount === 2737500) return "premium_renewal";
  return "jostap_nfc";
}

function cycleFromTransaction(transaction, plan) {
  const metadata = metadataFrom(transaction);
  const cycle = clean(metadata.billing_cycle || metadata.billingCycle).toLowerCase();
  if (VALID_PAYSTACK_CYCLES.has(cycle)) return cycle;
  return plan === "premium_renewal" || plan === "basic_renewal" ? "yearly" : "one_time";
}

async function userFromTransaction(supabase, transaction) {
  const metadata = metadataFrom(transaction);
  const userId = clean(metadata.user_id || metadata.userId);
  const customerEmail = clean(transaction?.customer?.email || metadata.customer_email || metadata.email).toLowerCase();

  if (isUuid(userId)) {
    const { data, error } = await supabase
      .from("users")
      .select("id, first_name, last_name, email, company")
      .eq("id", userId)
      .maybeSingle();

    if (error) throw error;
    if (data) return data;
  }

  if (customerEmail) {
    const { data, error } = await supabase
      .from("users")
      .select("id, first_name, last_name, email, company")
      .ilike("email", customerEmail)
      .maybeSingle();

    if (error) throw error;
    if (data) return data;
  }

  return null;
}

async function subscriptionForRecoveredPayment({
  supabase,
  transaction,
  user,
  plan,
  billingCycle,
  paidAt,
  reference,
}) {
  const metadata = metadataFrom(transaction);
  const subscriptionId = clean(metadata.subscription_id || metadata.subscriptionId);

  if (isUuid(subscriptionId)) {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("id", subscriptionId)
      .maybeSingle();

    if (error) throw error;
    if (data) return data;
  }

  const { data: existing, error: lookupError } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .in("status", ["pending", "active", "past_due"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lookupError) throw lookupError;

  const payload = {
    user_id: user.id,
    plan,
    billing_cycle: billingCycle,
    status: "pending",
    provider: PAYSTACK_PROVIDER,
    provider_subscription_id: reference,
    current_period_start: paidAt,
    current_period_end: addPeriodFrom(paidAt, billingCycle),
  };

  const query = existing
    ? supabase.from("subscriptions").update(payload).eq("id", existing.id)
    : supabase.from("subscriptions").insert({
        ...(isUuid(subscriptionId) ? { id: subscriptionId } : {}),
        ...payload,
      });

  const { data, error } = await query.select("*").single();

  if (error) throw error;
  return data;
}

async function paymentByMetadataId(supabase, transaction, reference) {
  const metadata = metadataFrom(transaction);
  const paymentId = clean(metadata.payment_id || metadata.paymentId);
  if (!isUuid(paymentId)) return null;

  const { data: payment, error } = await supabase
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .maybeSingle();

  if (error) throw error;
  if (!payment) return null;

  const { data: updated, error: updateError } = await supabase
    .from("payments")
    .update({
      provider: PAYSTACK_PROVIDER,
      provider_payment_id: reference,
      status: payment.status === "succeeded" ? "succeeded" : "pending",
    })
    .eq("id", payment.id)
    .select("*")
    .single();

  if (updateError) throw updateError;
  return updated;
}

async function recoverPaymentFromTransaction(supabase, transaction, reference, status, paidAt) {
  if (status !== "succeeded") {
    throw new Error(`No pending payment found for Paystack reference ${reference}.`);
  }

  const existingByMetadataId = await paymentByMetadataId(supabase, transaction, reference);
  if (existingByMetadataId) return existingByMetadataId;

  const user = await userFromTransaction(supabase, transaction);
  if (!user) {
    throw new Error(
      "Paystack verified this payment, but no JOSTAP account could be matched to it.",
    );
  }

  const metadata = metadataFrom(transaction);
  const plan = planFromTransaction(transaction);
  const billingCycle = cycleFromTransaction(transaction, plan);
  const subscription = await subscriptionForRecoveredPayment({
    supabase,
    transaction,
    user,
    plan,
    billingCycle,
    paidAt,
    reference,
  });
  const userName = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  const orderAccount = {
    name: clean(metadata.customer_name || userName || user.email),
    email: clean(transaction?.customer?.email || metadata.email || user.email),
    company: clean(metadata.company || user.company),
  };

  const { data: payment, error } = await supabase
    .from("payments")
    .insert({
      user_id: user.id,
      subscription_id: subscription.id,
      amount_cents: Number(transaction?.amount || 0),
      currency: clean(transaction?.currency || paystackCurrency()).toLowerCase(),
      status: "pending",
      provider: PAYSTACK_PROVIDER,
      provider_payment_id: reference,
      order_id: clean(metadata.order_id || metadata.orderId) || makePaystackOrderId(),
      order_plan: plan,
      order_product_name: clean(metadata.product_name || metadata.productName) || paystackPlanName(plan),
      order_account: orderAccount,
    })
    .select("*")
    .single();

  if (error) throw error;
  return payment;
}

export function callbackUrlForRequest(request) {
  if (process.env.PAYSTACK_CALLBACK_URL) {
    return process.env.PAYSTACK_CALLBACK_URL;
  }

  const origin =
    process.env.APP_ORIGIN ||
    process.env.PUBLIC_SITE_URL ||
    process.env.VITE_PUBLIC_SITE_URL ||
    new URL(request.url).origin;

  return new URL("/api/billing/paystack/callback", origin).toString();
}

export async function planAmountKobo(supabase, plan, billingCycle) {
  if (plan === "free" || billingCycle === "free") {
    return 0;
  }

  const fallback = PLAN_PRICE_KOBO[plan]?.[billingCycle] || 0;
  if (LOCKED_PAYSTACK_PRICES.has(plan) && fallback) {
    return fallback;
  }

  const { data, error } = await supabase
    .from("pricing_plans")
    .select("monthly_cents, yearly_cents")
    .eq("slug", plan)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const configured =
    billingCycle === "yearly"
      ? Number(data?.yearly_cents || 0)
      : Number(data?.monthly_cents || 0);

  return configured || fallback;
}

async function paystackRequest(path, options = {}) {
  assertPaystackConfigured();

  const response = await fetch(`${PAYSTACK_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.status === false) {
    throw new Error(data.message || "Paystack request failed.");
  }

  return data;
}

export async function initializePaystackTransaction({
  email,
  amountKobo,
  currency,
  reference,
  callbackUrl,
  metadata,
}) {
  const data = await paystackRequest("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email,
      amount: amountKobo,
      currency: currency || paystackCurrency(),
      reference,
      callback_url: callbackUrl,
      metadata,
    }),
  });

  return data.data || {};
}

export async function verifyPaystackTransaction(reference) {
  const encodedReference = encodeURIComponent(reference);
  const data = await paystackRequest(`/transaction/verify/${encodedReference}`, {
    method: "GET",
  });

  return data.data || {};
}

export async function listSuccessfulPaystackTransactions({ perPage = 100, maxPages = 5 } = {}) {
  const transactions = [];
  const pageSize = Math.min(Math.max(Number(perPage) || 100, 1), 100);
  const pages = Math.min(Math.max(Number(maxPages) || 1, 1), 10);

  for (let page = 1; page <= pages; page += 1) {
    const params = new URLSearchParams({
      status: "success",
      perPage: String(pageSize),
      page: String(page),
    });
    const data = await paystackRequest(`/transaction?${params.toString()}`, {
      method: "GET",
    });
    const rows = Array.isArray(data.data) ? data.data : [];

    transactions.push(...rows.filter((row) => row?.status === "success"));

    if (rows.length < pageSize) break;
  }

  return transactions;
}

export async function applyPaystackTransaction(supabase, transaction) {
  const reference = transaction?.reference || transaction?.metadata?.reference || "";
  const status = transaction?.status === "success" ? "succeeded" : "failed";
  const paidAt =
    transaction?.paid_at ||
    transaction?.paidAt ||
    transaction?.transaction_date ||
    new Date().toISOString();

  if (!reference) {
    throw new Error("Paystack transaction reference is missing.");
  }

  let { data: payment, error: paymentError } = await supabase
    .from("payments")
    .select("*")
    .eq("provider", PAYSTACK_PROVIDER)
    .eq("provider_payment_id", reference)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (paymentError) {
    throw paymentError;
  }

  if (!payment) {
    payment = await recoverPaymentFromTransaction(supabase, transaction, reference, status, paidAt);
  }

  if (status !== "succeeded") {
    const { error } = await supabase
      .from("payments")
      .update({ status: "failed" })
      .eq("id", payment.id);

    if (error) {
      throw error;
    }

    return { payment: { ...payment, status: "failed" }, subscription: null };
  }

  const amount = Number(transaction.amount || 0);
  const expectedAmount = Number(payment.amount_cents || 0);
  const currency = String(transaction.currency || paystackCurrency()).toLowerCase();

  if (amount && expectedAmount && amount !== expectedAmount) {
    throw new Error("Verified Paystack amount does not match the payment record.");
  }

  if (currency && payment.currency && currency !== String(payment.currency).toLowerCase()) {
    throw new Error("Verified Paystack currency does not match the payment record.");
  }

  const { data: updatedPayment, error: updatePaymentError } = await supabase
    .from("payments")
    .update({ status: "succeeded" })
    .eq("id", payment.id)
    .select("*")
    .single();

  if (updatePaymentError) {
    throw updatePaymentError;
  }

  const { data: subscription, error: subscriptionError } = await supabase
    .from("subscriptions")
    .update({
      status: "active",
      provider: PAYSTACK_PROVIDER,
      provider_subscription_id: reference,
    })
    .eq("id", payment.subscription_id)
    .select("*")
    .single();

  if (subscriptionError) {
    throw subscriptionError;
  }

  const { error: supersedeError } = await supabase
    .from("subscriptions")
    .update({ status: "cancelled" })
    .eq("user_id", payment.user_id)
    .neq("id", subscription.id)
    .in("status", ["active", "past_due"]);

  if (supersedeError) {
    throw supersedeError;
  }

  const { data: existingInvoice, error: invoiceLookupError } = await supabase
    .from("invoices")
    .select("id")
    .eq("provider_invoice_id", reference)
    .limit(1)
    .maybeSingle();

  if (invoiceLookupError) {
    throw invoiceLookupError;
  }

  if (!existingInvoice) {
    const { error: invoiceError } = await supabase.from("invoices").insert({
      user_id: payment.user_id,
      subscription_id: payment.subscription_id,
      invoice_number: payment.order_id || reference,
      amount_cents: updatedPayment.amount_cents,
      currency: updatedPayment.currency,
      status: "paid",
      provider_invoice_id: reference,
      hosted_invoice_url: transaction?.receipt_url || "",
      issued_at: paidAt,
      paid_at: paidAt,
    });

    if (invoiceError) {
      throw invoiceError;
    }
  }

  return { payment: updatedPayment, subscription };
}

export function verifyPaystackSignature(rawBody, signature) {
  if (!signature || !secretKey()) {
    return false;
  }

  const expected = createHmac("sha512", secretKey())
    .update(rawBody)
    .digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  const actualBuffer = Buffer.from(String(signature), "hex");

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualBuffer);
}
