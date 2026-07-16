import { badRequest, json, unauthorized } from "../../../utils/http.js";
import { getSessionUser } from "../../../utils/session.js";
import { getSupabaseAdmin } from "../../../utils/supabase.js";
import {
  assertPaystackConfigured,
  callbackUrlForRequest,
  initializePaystackTransaction,
  makePaystackOrderId,
  makePaystackReference,
  PAYSTACK_PROVIDER,
  paystackCurrency,
  paystackPlanName,
  planAmountKobo,
} from "../../../utils/paystack.js";
import {
  DEFAULT_SHOP_PRODUCT,
  isMissingShopProductsTable,
  shopProductFromRow,
} from "../../../utils/shopProducts.js";
import {
  COMPANY_CARD_PURCHASE_PLANS,
  isCompanyAccount,
} from "../../../utils/cards.js";

const PLANS = new Set(["jostap_nfc", "custom_nfc", "basic_renewal", "premium_renewal"]);
const CYCLES = new Set(["one_time", "yearly"]);
const PLAN_ALIASES = {
  professional: "jostap_nfc",
  business: "custom_nfc",
};

function normalizePlan(value) {
  const plan = String(value || "jostap_nfc").toLowerCase();
  return PLAN_ALIASES[plan] || plan;
}

function cleanSlug(value) {
  const slug = String(value || "").trim().toLowerCase();
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ? slug : "";
}

function cleanText(value, maxLength = 160) {
  return String(value || "").trim().slice(0, maxLength);
}

function checkoutFromPath(path) {
  try {
    const url = new URL(path || "", "https://jostap.com");
    const plan = normalizePlan(url.searchParams.get("plan"));
    const billingCycle = String(url.searchParams.get("billing") || "one_time").toLowerCase();

    return {
      plan: PLANS.has(plan) ? plan : "jostap_nfc",
      billingCycle: CYCLES.has(billingCycle) ? billingCycle : "one_time",
    };
  } catch {
    return { plan: "jostap_nfc", billingCycle: "one_time" };
  }
}

async function findShopProduct(supabase, slug) {
  if (!slug) return null;

  const { data, error } = await supabase
    .from("shop_products")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (isMissingShopProductsTable(error)) {
    return DEFAULT_SHOP_PRODUCT.slug === slug ? DEFAULT_SHOP_PRODUCT : null;
  }

  if (error) throw error;
  if (!data) return null;

  const product = shopProductFromRow(data);

  if (product.inventoryStatus === "sold_out" || product.inventoryStatus === "draft") {
    return null;
  }

  return product;
}

function hasConfirmedPaidAccess(row) {
  if (!row || !["active", "past_due"].includes(row.status)) return false;
  if (row.plan === "free") return false;
  if (row.current_period_end && new Date(row.current_period_end).getTime() <= Date.now()) return false;

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
    const productSlug = cleanSlug(body?.productSlug || body?.product);
    const account = body?.account || {};
    const supabase = getSupabaseAdmin();
    const selectedProduct = await findShopProduct(supabase, productSlug);

    if (productSlug && !selectedProduct) {
      return badRequest("Choose an available card from the shop before paying.");
    }

    const productCheckout = selectedProduct
      ? checkoutFromPath(selectedProduct.checkoutPath)
      : null;
    const plan = normalizePlan(productCheckout?.plan || body?.plan);
    const billingCycle = String(
      productCheckout?.billingCycle || body?.billingCycle || body?.billing || "one_time",
    ).toLowerCase();

    if (!PLANS.has(plan) || !CYCLES.has(billingCycle)) {
      return badRequest("Choose a valid paid plan and billing cycle.");
    }

    try {
      assertPaystackConfigured();
    } catch (error) {
      console.error("Paystack configuration error:", error);
      return json({ error: "Payment checkout is not available right now." }, { status: 503 });
    }

    const currency = paystackCurrency().toUpperCase();
    const productCurrency = String(selectedProduct?.currency || currency).toUpperCase();

    if (selectedProduct && productCurrency !== currency) {
      return badRequest("This card currency is not available for Paystack checkout right now.");
    }

    const amountKobo = selectedProduct
      ? Math.max(0, Math.round(Number(selectedProduct.priceCents || 0)))
      : await planAmountKobo(supabase, plan, billingCycle);

    if (!amountKobo) {
      return badRequest("This card does not have a configured Paystack amount.");
    }

    const now = new Date().toISOString();
    const [
      { data: existing, error: lookupError },
      { data: profile, error: profileError },
    ] = await Promise.all([
      supabase
        .from("subscriptions")
        .select("id,plan,status,provider,current_period_end")
        .eq("user_id", user.id)
        .in("status", ["pending", "active", "past_due"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("kyc_profiles")
        .select("account_type")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    if (lookupError || profileError) {
      throw lookupError || profileError;
    }

    const isCompanyCardPurchase =
      isCompanyAccount(profile) && COMPANY_CARD_PURCHASE_PLANS.includes(plan);

    if (
      plan !== "premium_renewal" &&
      hasConfirmedPaidAccess(existing) &&
      !isCompanyCardPurchase
    ) {
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

    const shouldReuseActiveCompanySubscription =
      isCompanyCardPurchase && hasConfirmedPaidAccess(existing);
    const shouldInsertRenewal =
      plan === "premium_renewal" && hasConfirmedPaidAccess(existing);
    let subscription = existing;

    if (!shouldReuseActiveCompanySubscription) {
      const subscriptionQuery = existing && !shouldInsertRenewal
        ? supabase.from("subscriptions").update(subscriptionPayload).eq("id", existing.id)
        : supabase.from("subscriptions").insert(subscriptionPayload);

      const { data, error: subscriptionError } = await subscriptionQuery
        .select("*")
        .single();

      if (subscriptionError) {
        throw subscriptionError;
      }

      subscription = data;
    }

    const reference = makePaystackReference(user.id);
    const orderId = makePaystackOrderId();
    const productName = selectedProduct?.name || paystackPlanName(plan);
    const userName = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
    const orderAccount = {
      name: cleanText(account.name || userName || user.email),
      email: cleanText(account.email || user.email),
      company: cleanText(account.company || user.company),
    };
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        user_id: user.id,
        subscription_id: subscription.id,
        amount_cents: amountKobo,
        currency: currency.toLowerCase(),
        status: "pending",
        provider: PAYSTACK_PROVIDER,
        provider_payment_id: reference,
        order_id: orderId,
        order_plan: plan,
        order_product_name: productName,
        order_account: orderAccount,
      })
      .select("*")
      .single();

    if (paymentError) {
      throw paymentError;
    }

    const callbackUrl = callbackUrlForRequest(request);
    const authorization = await initializePaystackTransaction({
      email: orderAccount.email || user.email,
      amountKobo,
      currency,
      reference,
      callbackUrl,
      metadata: {
        app: "jostap",
        user_id: user.id,
        subscription_id: subscription.id,
        payment_id: payment.id,
        order_id: orderId,
        product_name: productName,
        product_slug: selectedProduct?.slug || "",
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
      orderId,
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
