import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const PAYSTACK_BASE_URL = "https://api.paystack.co";
const DEFAULT_CURRENCY = "NGN";
const PLAN_PRICE_KOBO = {
  free: { free: 0 },
  jostap_nfc: { one_time: 3000000 },
  custom_nfc: { one_time: 4000000 },
  basic_renewal: { yearly: 120000 },
  premium_renewal: { yearly: 200000 },
};

export const PAYSTACK_PROVIDER = "paystack";

export const PAYSTACK_PLAN_NAMES = {
  free: "Free",
  jostap_nfc: "JOSTAP Card",
  custom_nfc: "Custom Card",
  basic_renewal: "Basic Renewal",
  premium_renewal: "Premium Features Renewal",
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

  const { data: payment, error: paymentError } = await supabase
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
    throw new Error(`No pending payment found for Paystack reference ${reference}.`);
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
