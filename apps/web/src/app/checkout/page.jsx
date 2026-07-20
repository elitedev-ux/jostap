import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import logo from "../../assets/jostap logo.png3.png";

const PAID_CARD_FEATURES = [
  "Physical NFC card",
  "Digital business profile",
  "Downloadable QR code",
  "Contact sharing",
  "Save contact (vCard)",
  "Social media links",
  "Contact save tracking",
  "Appointment booking",
  "Advanced analytics",
  "Premium features",
  "1 year premium access included",
];

const PREMIUM_REPAYMENT_FEATURES = [
  "Advanced analytics",
  "Lead capture",
  "Appointment booking",
  "Visitor insights",
  "Downloadable QR code",
  "Catalog section",
  "Testimonials",
  "Premium access for 1 year",
];

const TEAM_RENEWAL_FEATURES = [
  "Team yearly subscription",
  "Team card profile access",
  "Premium team features",
  "Lead capture",
  "Appointment booking",
  "Advanced analytics",
];

const PLANS = {
  free: {
    name: "Free",
    price: 0,
    displayPrice: "\u20A60",
    billingLabel: "Free forever",
    cards: "1 digital business card",
    trial: "No payment required",
    features: ["1 digital business card", "Public profile page", "JOSTAP branded QR code", "Contact sharing", "Save contact (vCard)", "Social media links", "Basic analytics"],
  },
  jostap_nfc: {
    name: "JOSTAP Card",
    price: 20000,
    displayPrice: "\u20A620,000",
    billingLabel: "One-time payment",
    cards: "Physical NFC card",
    trial: "\u20A615,000 yearly subscription after the included first year",
    features: PAID_CARD_FEATURES,
  },
  custom_nfc: {
    name: "Custom Card",
    price: 25000,
    displayPrice: "\u20A625,000",
    billingLabel: "One-time payment",
    cards: "Physical NFC card",
    trial: "\u20A615,000 yearly subscription after the included first year",
    features: PAID_CARD_FEATURES,
  },
  basic_renewal: {
    name: "Team Access Renewal",
    price: 10000,
    displayPrice: "\u20A610,000",
    billingLabel: "Yearly subscription",
    cards: "Team features",
    trial: "Keeps team access active for 1 year",
    features: TEAM_RENEWAL_FEATURES,
  },
  premium_renewal: {
    name: "Premium Access Repayment",
    price: 15000,
    displayPrice: "\u20A615,000",
    billingLabel: "Yearly repayment",
    cards: "Premium features",
    trial: "Keeps premium feature access active for 1 year",
    features: PREMIUM_REPAYMENT_FEATURES,
  },
};

const PLAN_ALIASES = {
  professional: "jostap_nfc",
  business: "custom_nfc",
  starter: "free",
};

const BILLING_ALIASES = {
  monthly: "one_time",
};

const INDIVIDUAL_CARD_PLANS = ["jostap_nfc", "custom_nfc"];
const TEAM_CARD_PLANS = ["custom_nfc"];
const TEAM_CUSTOM_CARD_PRICE = 20000;
const TEAM_CUSTOM_CARD_PRICE_KOBO = TEAM_CUSTOM_CARD_PRICE * 100;
const TEAM_INSTALLMENT_DAYS = 30;

function money(cents, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(cents || 0) / 100);
}

function cleanQuantity(value) {
  const quantity = Math.floor(Number(value || 1));
  if (!Number.isFinite(quantity)) return 1;
  return Math.min(Math.max(quantity, 1), 100);
}

function checkoutFromPath(path) {
  try {
    const url = new URL(path || "", window.location.origin);
    const rawPlan = (url.searchParams.get("plan") || "jostap_nfc").toLowerCase();
    const rawBilling = (url.searchParams.get("billing") || "one_time").toLowerCase();
    const plan = PLAN_ALIASES[rawPlan] || rawPlan;
    const billing = BILLING_ALIASES[rawBilling] || rawBilling;

    return {
      plan: PLANS[plan] ? plan : "jostap_nfc",
      billing: ["one_time", "yearly", "free"].includes(billing) ? billing : "one_time",
    };
  } catch {
    return { plan: "jostap_nfc", billing: "one_time" };
  }
}

const getCheckoutFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  const rawPlan = (params.get("plan") || "jostap_nfc").toLowerCase();
  const rawBilling = (params.get("billing") || "one_time").toLowerCase();
  const plan = PLAN_ALIASES[rawPlan] || rawPlan;
  const billing = BILLING_ALIASES[rawBilling] || rawBilling;

    return {
      plan: PLANS[plan] ? plan : "jostap_nfc",
      billing: ["one_time", "yearly", "free"].includes(billing) ? billing : "one_time",
      productSlug: String(params.get("product") || params.get("productSlug") || "").trim(),
      quantity: cleanQuantity(params.get("quantity") || 1),
      paymentMode: params.get("installment") === "balance" ? "installment_balance" : "full",
    };
  };

const inputStyle = {
  width: "100%",
  border: "1px solid #E5E7EB",
  borderRadius: 9,
  background: "#fff",
  color: "#111827",
  fontSize: 14,
  padding: "11px 13px",
  boxSizing: "border-box",
};

async function responseBody(response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return { error: text.slice(0, 500) };
  }
}

function Field({ label, children }) {
  return (
    <label style={{ display: "block" }}>
      <span
        style={{
          display: "block",
          marginBottom: 6,
          color: "#374151",
          fontSize: 13,
          fontWeight: 500,
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

export default function CheckoutPage() {
  const [planKey, setPlanKey] = useState("jostap_nfc");
  const [billing, setBilling] = useState("one_time");
  const [productSlug, setProductSlug] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [paymentMode, setPaymentMode] = useState("full");
  const [pendingInstallment, setPendingInstallment] = useState(null);
  const [accountType, setAccountType] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [authStatus, setAuthStatus] = useState("checking");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [account, setAccount] = useState({
    name: "",
    email: "",
    company: "",
  });

  useEffect(() => {
    const checkout = getCheckoutFromUrl();
    setPlanKey(checkout.plan);
    setBilling(checkout.billing);
    setProductSlug(checkout.productSlug);
    setQuantity(checkout.quantity);
    setPaymentMode(checkout.paymentMode);

    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    if (payment === "failed") {
      setNotice("Paystack could not confirm this payment. Please try again.");
    } else if (payment === "error") {
      setNotice("We could not verify the Paystack payment yet. Please contact support if money was deducted.");
    } else if (payment === "missing-reference") {
      setNotice("Paystack returned without a transaction reference. Please try again.");
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function loadBuyer() {
      try {
        const response = await fetch("/api/auth/me", { credentials: "same-origin" });
        const data = await response.json().catch(() => ({}));

        if (!active) return;

        if (!response.ok) {
          setAccountType("individual");
          setAuthStatus("guest");
          return;
        }

        const user = data.user || {};
        setAuthStatus("authenticated");
        setAccountType(user.kyc?.accountType === "company" ? "company" : "individual");
        setAccount((current) => ({
          name: current.name || user.name || "",
          email: current.email || user.email || "",
          company: current.company || user.company || "",
        }));
      } catch {
        if (active) {
          setAccountType("individual");
          setAuthStatus("guest");
        }
      }
    }

    loadBuyer();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (authStatus !== "authenticated" || accountType !== "company") {
      setPendingInstallment(null);
      return;
    }

    let active = true;

    async function loadTeamInstallments() {
      try {
        const response = await fetch("/api/billing", { credentials: "same-origin" });
        const data = await response.json().catch(() => ({}));
        if (!active || !response.ok) return;
        const pending = data.subscription?.teamInstallments?.[0] || null;
        setPendingInstallment(pending);
      } catch {
        if (active) setPendingInstallment(null);
      }
    }

    loadTeamInstallments();

    return () => {
      active = false;
    };
  }, [authStatus, accountType]);

  useEffect(() => {
    if (!productSlug) {
      setSelectedProduct(null);
      return;
    }

    let active = true;

    async function loadSelectedProduct() {
      setLoadingProduct(true);
      try {
        const response = await fetch("/api/shop/products", { credentials: "same-origin" });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Unable to load selected product.");

        const product = (Array.isArray(data.products) ? data.products : []).find(
          (item) => String(item.slug || item.id) === productSlug,
        );

        if (!active) return;

        if (!product || product.inventoryStatus === "sold_out") {
          setSelectedProduct(null);
          setNotice("That card is not available right now. Please choose another card from the shop.");
          return;
        }

        const checkout = checkoutFromPath(product.checkoutPath);
        setSelectedProduct(product);
        setPlanKey(checkout.plan);
        setBilling(checkout.billing);
      } catch (error) {
        if (active) {
          setSelectedProduct(null);
          setNotice(error.message || "Unable to load selected product.");
        }
      } finally {
        if (active) {
          setLoadingProduct(false);
        }
      }
    }

    loadSelectedProduct();

    return () => {
      active = false;
    };
  }, [productSlug]);

  const checkoutReady = authStatus !== "checking" && !loadingProduct && Boolean(accountType);
  const isTeamCheckout = accountType === "company";
  const visiblePlanKeys = isTeamCheckout ? TEAM_CARD_PLANS : INDIVIDUAL_CARD_PLANS;
  const plan = {
    ...(PLANS[planKey] || PLANS.jostap_nfc),
    ...(isTeamCheckout && planKey === "custom_nfc"
      ? {
          price: TEAM_CUSTOM_CARD_PRICE,
          displayPrice: "\u20A620,000",
          billingLabel: "Team card slot",
          cards: "Custom card for team member",
          trial: "\u20A610,000 yearly team subscription after the included first year",
        }
      : {}),
  };
  const isFreePlan = planKey === "free" || billing === "free";
  const isCardPurchase = visiblePlanKeys.includes(planKey) && billing === "one_time";
  const isBulkCardPurchase = isTeamCheckout && planKey === "custom_nfc" && billing === "one_time";
  const normalizedQuantity = isBulkCardPurchase ? cleanQuantity(quantity) : 1;
  const unitAmountKobo = isTeamCheckout && planKey === "custom_nfc"
    ? TEAM_CUSTOM_CARD_PRICE_KOBO
    : selectedProduct
      ? Number(selectedProduct.priceCents || 0)
      : Number(plan.price || 0) * 100;
  const canPayInstallment = isBulkCardPurchase;
  const canPayInstallmentBalance = canPayInstallment && paymentMode === "installment_balance" && pendingInstallment;
  const activePaymentMode =
    canPayInstallment && paymentMode === "installment_deposit"
      ? "installment_deposit"
      : canPayInstallmentBalance
        ? "installment_balance"
        : "full";
  const displayQuantity = activePaymentMode === "installment_balance"
    ? pendingInstallment.quantity
    : normalizedQuantity;
  const totalAmountKobo = activePaymentMode === "installment_balance"
    ? Number(pendingInstallment.totalAmountCents || 0)
    : unitAmountKobo * normalizedQuantity;
  const installmentDepositKobo = Math.ceil(totalAmountKobo / 2);
  const installmentBalanceKobo = Math.max(0, totalAmountKobo - installmentDepositKobo);
  const balanceDueKobo = activePaymentMode === "installment_balance"
    ? Number(pendingInstallment?.balanceAmountCents || 0)
    : installmentBalanceKobo;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + TEAM_INSTALLMENT_DAYS);
  const installmentDueLabel = dueDate.toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const selectedProductPrice = selectedProduct && !(isTeamCheckout && planKey === "custom_nfc")
    ? money(selectedProduct.priceCents, selectedProduct.currency)
    : "";
  const orderName = selectedProduct?.name || plan.name;
  const unitPrice = selectedProductPrice || plan.displayPrice || `\u20A6${plan.price}`;
  const orderPrice = isCardPurchase && displayQuantity > 1
    ? money(totalAmountKobo, selectedProduct?.currency || "NGN")
    : unitPrice;
  const billedToday = isFreePlan
    ? "\u20A60"
    : activePaymentMode === "installment_deposit"
      ? money(installmentDepositKobo, selectedProduct?.currency || "NGN")
      : activePaymentMode === "installment_balance"
        ? money(balanceDueKobo, selectedProduct?.currency || "NGN")
        : orderPrice;
  const nextChargeLabel =
    billing === "yearly" ? `${orderPrice}/year` : billing === "free" ? "\u20A60" : "No recurring charge";

  useEffect(() => {
    if (!accountType) return;

    if (accountType === "company" && planKey !== "custom_nfc") {
      setPlanKey("custom_nfc");
      setBilling("one_time");
      return;
    }

    if (accountType !== "company" && !INDIVIDUAL_CARD_PLANS.includes(planKey)) {
      setPlanKey("jostap_nfc");
      setBilling("one_time");
    }
  }, [accountType, planKey]);

  const updateAccount = (key, value) => {
    setAccount((current) => ({ ...current, [key]: value }));
  };

  const redirectToAccount = () => {
    const callbackUrl = `${window.location.pathname}${window.location.search}`;
    window.location.href = `/auth/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setNotice("");

    try {
      if (authStatus !== "authenticated") {
        redirectToAccount();
        return;
      }

      const endpoint = isFreePlan
        ? "/api/billing/activate"
        : "/api/billing/paystack/initialize";
      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
          plan: planKey,
          billingCycle: billing,
          productSlug,
          quantity: normalizedQuantity,
          paymentMode: activePaymentMode,
          account,
        }),
      });
      const data = await responseBody(response);

      if (!response.ok) {
        if (response.status === 401) {
          redirectToAccount();
          return;
        }

        throw new Error(data.error || `Checkout request failed (${response.status}).`);
      }

      if (isFreePlan) {
        window.location.href = "/dashboard/billing?plan=free";
        return;
      }

      if (!data.authorizationUrl) {
        throw new Error("Paystack did not return a checkout link.");
      }

      window.location.href = data.authorizationUrl;
    } catch (error) {
      setNotice(error.message || "Unable to activate this plan.");
      setLoading(false);
    }
  };

  return (
    <div className="checkout-page" style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <header
        className="checkout-header"
        style={{
          height: 72,
          borderBottom: "1px solid #E5E7EB",
          background: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 clamp(18px,5vw,64px)",
          boxSizing: "border-box",
        }}
      >
        <a href="/" style={{ display: "inline-flex", alignItems: "center" }}>
          <img
            src={logo}
            alt="JOSTAP"
            style={{ width: 112, height: 44, objectFit: "contain" }}
          />
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            className="checkout-secure"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: "#059669",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <LockKeyhole size={14} /> Secure checkout
          </span>
        </div>
      </header>

      <main
        className="checkout-main"
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "34px 24px 72px",
          boxSizing: "border-box",
        }}
      >
        <a
          href="/pricing"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 24,
            color: "#6B7280",
            fontSize: 13,
            textDecoration: "none",
          }}
        >
          <ArrowLeft size={14} /> Back to pricing
        </a>

        <div
          className="checkout-layout"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,1fr) 360px",
            gap: 24,
            alignItems: "start",
          }}
        >
          <form className="checkout-form" onSubmit={handleSubmit}>
            <div
              className="checkout-panel"
              style={{
                background: "#fff",
                border: "1px solid #E5E7EB",
                borderRadius: 14,
                padding: 24,
                marginBottom: 18,
              }}
            >
              <div style={{ marginBottom: 22 }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    color: "#0d6ffd",
                    background: "#eaf3ff",
                    border: "1px solid #BFDBFE",
                    borderRadius: 999,
                    padding: "4px 10px",
                    fontSize: 12,
                    fontWeight: 700,
                    marginBottom: 14,
                  }}
                >
                  <Sparkles size={13} /> Payment setup required
                </span>
                <h1
                  style={{
                    color: "#111827",
                    fontSize: 28,
                    fontWeight: 800,
                    letterSpacing: "-0.025em",
                    marginBottom: 6,
                  }}
                >
                  Order your JOSTAP card
                </h1>
                <p style={{ color: "#6B7280", fontSize: 14, lineHeight: 1.6 }}>
                  Card orders continue through Paystack secure checkout.
                </p>
              </div>

              {!checkoutReady ? (
                <div
                  style={{
                    border: "1px solid #E5E7EB",
                    borderRadius: 12,
                    background: "#FAFBFF",
                    padding: 16,
                    marginBottom: 24,
                    color: "#374151",
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  Preparing the correct card options...
                </div>
              ) : selectedProduct ? (
                <div
                  style={{
                    border: "2px solid #0d6ffd",
                    borderRadius: 12,
                    background: "#FAFBFF",
                    padding: 16,
                    marginBottom: 24,
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      color: "#0d6ffd",
                      fontSize: 12,
                      fontWeight: 800,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      marginBottom: 6,
                    }}
                  >
                    Selected card
                  </span>
                  <strong style={{ display: "block", color: "#111827", fontSize: 17, marginBottom: 4 }}>
                    {selectedProduct.name}
                  </strong>
                  <span style={{ color: "#6B7280", fontSize: 13 }}>
                    {selectedProductPrice} - {selectedProduct.subtitle || plan.billingLabel}
                  </span>
                </div>
              ) : (
                <div
                  className="checkout-plan-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
                    gap: 12,
                    marginBottom: 24,
                  }}
                >
                  {visiblePlanKeys.map((key) => {
                    const item = {
                      ...PLANS[key],
                      ...(isTeamCheckout && key === "custom_nfc"
                        ? {
                            price: TEAM_CUSTOM_CARD_PRICE,
                            displayPrice: "\u20A620,000",
                            billingLabel: "Team card slot",
                          }
                        : {}),
                    };

                    return (
                    <button
                      key={key}
                      onClick={() => {
                        setPlanKey(key);
                        if (!TEAM_CARD_PLANS.includes(key)) {
                          setQuantity(1);
                        }
                      }}
                      type="button"
                      style={{
                        textAlign: "left",
                        border:
                          planKey === key
                            ? "2px solid #0d6ffd"
                            : "1px solid #E5E7EB",
                        borderRadius: 12,
                        background: planKey === key ? "#FAFBFF" : "#fff",
                        padding: 14,
                        cursor: "pointer",
                      }}
                    >
                      <span
                        style={{
                          display: "block",
                          color: planKey === key ? "#0d6ffd" : "#111827",
                          fontSize: 14,
                          fontWeight: 700,
                          marginBottom: 4,
                        }}
                      >
                        {item.name}
                      </span>
                      <span style={{ color: "#6B7280", fontSize: 12 }}>
                        {(item.displayPrice || `\u20A6${item.price}`)} - {item.billingLabel}
                      </span>
                    </button>
                    );
                  })}
                </div>
              )}

              {checkoutReady && isBulkCardPurchase && (
                <div
                  style={{
                    border: "1px solid #E5E7EB",
                    borderRadius: 12,
                    background: "#fff",
                    padding: 16,
                    marginBottom: 20,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 16,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <p style={{ color: "#111827", fontSize: 14, fontWeight: 800, marginBottom: 4 }}>
                        Number of card slots
                      </p>
                      <p style={{ color: "#6B7280", fontSize: 13, lineHeight: 1.5 }}>
                        Buy multiple cards now for your team members.
                      </p>
                    </div>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        border: "1px solid #D1D5DB",
                        borderRadius: 10,
                        overflow: "hidden",
                        background: "#fff",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setQuantity((current) => cleanQuantity(Number(current) - 1))}
                        style={{
                          width: 42,
                          height: 42,
                          border: "none",
                          borderRight: "1px solid #E5E7EB",
                          background: "#f5f5f5",
                          color: "#111827",
                          fontSize: 18,
                          fontWeight: 800,
                          cursor: "pointer",
                        }}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={quantity}
                        onChange={(event) => setQuantity(cleanQuantity(event.target.value))}
                        style={{
                          width: 72,
                          height: 42,
                          border: "none",
                          outline: "none",
                          textAlign: "center",
                          color: "#111827",
                          fontSize: 15,
                          fontWeight: 800,
                        }}
                        aria-label="Number of card slots"
                      />
                      <button
                        type="button"
                        onClick={() => setQuantity((current) => cleanQuantity(Number(current) + 1))}
                        style={{
                          width: 42,
                          height: 42,
                          border: "none",
                          borderLeft: "1px solid #E5E7EB",
                          background: "#f5f5f5",
                          color: "#111827",
                          fontSize: 18,
                          fontWeight: 800,
                          cursor: "pointer",
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {checkoutReady && canPayInstallment && (
                <div
                  style={{
                    border: "1px solid #E5E7EB",
                    borderRadius: 12,
                    background: "#fff",
                    padding: 16,
                    marginBottom: 20,
                  }}
                >
                  {activePaymentMode === "installment_balance" ? (
                    <>
                      <p style={{ color: "#111827", fontSize: 14, fontWeight: 800, marginBottom: 4 }}>
                        Complete team installment
                      </p>
                      <p style={{ color: "#6B7280", fontSize: 13, lineHeight: 1.5 }}>
                        Pay the remaining {money(balanceDueKobo, "NGN")} for {displayQuantity} team card slots.
                      </p>
                    </>
                  ) : (
                    <>
                      <p style={{ color: "#111827", fontSize: 14, fontWeight: 800, marginBottom: 4 }}>
                        Payment option
                      </p>
                      <p style={{ color: "#6B7280", fontSize: 13, lineHeight: 1.5, marginBottom: 12 }}>
                        Team orders can be paid in full or split into 50% now and the balance within {TEAM_INSTALLMENT_DAYS} days.
                      </p>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 10,
                        }}
                      >
                        {[
                          ["full", "Pay full amount", orderPrice],
                          ["installment_deposit", "Pay 50% now", money(installmentDepositKobo, "NGN")],
                        ].map(([mode, label, amount]) => {
                          const selected = activePaymentMode === mode;

                          return (
                            <button
                              key={mode}
                              type="button"
                              onClick={() => setPaymentMode(mode)}
                              style={{
                                textAlign: "left",
                                border: selected ? "2px solid #0d6ffd" : "1px solid #E5E7EB",
                                borderRadius: 10,
                                background: selected ? "#EFF6FF" : "#fff",
                                color: "#111827",
                                padding: "12px 13px",
                                cursor: "pointer",
                              }}
                            >
                              <strong style={{ display: "block", fontSize: 13, marginBottom: 4 }}>
                                {label}
                              </strong>
                              <span style={{ display: "block", color: "#6B7280", fontSize: 12 }}>
                                {amount}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                  {activePaymentMode === "installment_deposit" && (
                    <p style={{ color: "#92400E", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: "10px 12px", fontSize: 12, lineHeight: 1.5, marginTop: 12 }}>
                      Balance of {money(installmentBalanceKobo, "NGN")} is due by {installmentDueLabel}. If it is not completed, only paid card slots remain active.
                    </p>
                  )}
                </div>
              )}

              <p style={{ fontSize: 13, color: "#6B7280" }}>
                {loadingProduct ? "Confirming selected card..." : plan.billingLabel}
              </p>
            </div>

            <div
              className="checkout-panel"
              style={{
                background: "#fff",
                border: "1px solid #E5E7EB",
                borderRadius: 14,
                padding: 24,
                marginBottom: 18,
              }}
            >
              <h2
                style={{
                  color: "#111827",
                  fontSize: 16,
                  fontWeight: 700,
                  marginBottom: 18,
                }}
              >
                Account details
              </h2>
              <div
                className="checkout-account-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 14,
                  marginBottom: 14,
                }}
              >
                <Field label="Full name">
                  <input
                    required
                    style={inputStyle}
                    value={account.name}
                    onChange={(event) => updateAccount("name", event.target.value)}
                    placeholder="Full name"
                  />
                </Field>
                <Field label="Company">
                  <input
                    style={inputStyle}
                    value={account.company}
                    onChange={(event) =>
                      updateAccount("company", event.target.value)
                    }
                    placeholder="Company name"
                  />
                </Field>
              </div>
              <Field label="Work email">
                <input
                  required
                  type="email"
                  style={inputStyle}
                  value={account.email}
                  onChange={(event) => updateAccount("email", event.target.value)}
                  placeholder="you@company.com"
                />
              </Field>
            </div>

            <div
              className="checkout-panel"
              style={{
                background: "#fff",
                border: "1px solid #E5E7EB",
                borderRadius: 14,
                padding: 24,
              }}
            >
              <h2
                style={{
                  color: "#111827",
                  fontSize: 16,
                  fontWeight: 700,
                  marginBottom: 18,
                }}
              >
                Payment details
              </h2>

              {authStatus === "guest" && (
                <div
                  style={{
                    border: "1px solid #FED7AA",
                    borderRadius: 12,
                    background: "#FFF7ED",
                    color: "#9A3412",
                    fontSize: 13,
                    fontWeight: 600,
                    lineHeight: 1.6,
                    padding: "12px 14px",
                    marginBottom: 14,
                  }}
                >
                  Create a free JOSTAP account or sign in before payment. We will bring you back to this checkout automatically.
                </div>
              )}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr",
                  gap: 14,
                }}
              >
                <div
                  style={{
                    border: "1px solid #BFDBFE",
                    borderRadius: 12,
                    background: "#FAFBFF",
                    padding: 16,
                  }}
                >
                  <p style={{ color: "#111827", fontSize: 14, fontWeight: 800, marginBottom: 6 }}>
                    Paystack checkout
                  </p>
                  <p style={{ color: "#6B7280", fontSize: 13, lineHeight: 1.6 }}>
                    Card details are collected by Paystack. After a successful payment, your JOSTAP plan will activate automatically.
                  </p>
                </div>
              </div>

              {notice && (
                <div
                  style={{
                    marginTop: 18,
                    border: "1px solid #BFDBFE",
                    borderRadius: 10,
                    background: "#eaf3ff",
                    color: "#1D4ED8",
                    fontSize: 13,
                    padding: "11px 13px",
                  }}
                >
                  {notice}
                </div>
              )}

              <button
                disabled={loading || !checkoutReady}
                type={authStatus === "guest" ? "button" : "submit"}
                onClick={authStatus === "guest" ? redirectToAccount : undefined}
                style={{
                  width: "100%",
                  marginTop: 20,
                  border: "none",
                  borderRadius: 10,
                  background: loading || !checkoutReady ? "#8fc1ff" : "#0d6ffd",
                  color: "#fff",
                  cursor: loading || !checkoutReady ? "not-allowed" : "pointer",
                  fontSize: 15,
                  fontWeight: 700,
                  padding: "13px 18px",
                }}
              >
                {loading
                  ? isFreePlan
                    ? "Activating..."
                    : "Redirecting to Paystack..."
                  : !checkoutReady
                    ? "Preparing checkout..."
                  : authStatus === "guest"
                    ? "Create account to continue"
                  : isFreePlan
                    ? "Activate free plan"
                    : `Pay ${billedToday} with Paystack`}
              </button>
            </div>
          </form>

          <aside
            className="checkout-summary"
            style={{
              position: "sticky",
              top: 96,
              background: "#fff",
              border: "1px solid #E5E7EB",
              borderRadius: 14,
              padding: 22,
            }}
          >
            <h2
              style={{
                color: "#111827",
                fontSize: 17,
                fontWeight: 800,
                marginBottom: 18,
              }}
            >
              Order summary
            </h2>

            <div
              className="checkout-summary-card"
              style={{
                border: "1px solid #E5E7EB",
                borderRadius: 12,
                background: "#f5f5f5",
                padding: 16,
                marginBottom: 18,
              }}
            >
              {!checkoutReady ? (
                <>
                  <p style={{ color: "#0d6ffd", fontSize: 12, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 5 }}>
                    Preparing order
                  </p>
                  <p className="checkout-summary-price" style={{ color: "#111827", fontSize: 30, fontWeight: 800, letterSpacing: 0 }}>
                    ...
                  </p>
                  <p style={{ color: "#6B7280", fontSize: 13, marginTop: 4 }}>
                    Confirming your account type before showing card pricing.
                  </p>
                </>
              ) : (
                <>
                  <p
                    style={{
                      color: "#0d6ffd",
                      fontSize: 12,
                      fontWeight: 800,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      marginBottom: 5,
                    }}
                  >
                    {orderName}
                  </p>
                  <p
                    className="checkout-summary-price"
                    style={{
                      color: "#111827",
                      fontSize: 30,
                      fontWeight: 800,
                      letterSpacing: 0,
                    }}
                  >
                    {orderPrice}
                  </p>
                  {plan.previousPrice && (
                    <p style={{ color: "#6B7280", fontSize: 12, fontWeight: 700, marginTop: 4 }}>
                      Regular: {plan.previousPrice}
                    </p>
                  )}
                  <p style={{ color: "#6B7280", fontSize: 13, marginTop: 4 }}>
                    {selectedProduct?.subtitle || `${plan.billingLabel} - ${plan.cards}`}
                  </p>
                  {isBulkCardPurchase && displayQuantity > 1 && (
                    <p style={{ color: "#6B7280", fontSize: 12, fontWeight: 700, marginTop: 8 }}>
                      {unitPrice} x {displayQuantity} card slots
                    </p>
                  )}
                  {activePaymentMode === "installment_deposit" && (
                    <p style={{ color: "#92400E", fontSize: 12, fontWeight: 800, marginTop: 8 }}>
                      50% installment today. Balance due by {installmentDueLabel}.
                    </p>
                  )}
                </>
              )}
            </div>

            {checkoutReady && <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {plan.features.map((feature) => (
                <div
                  key={feature}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    color: "#374151",
                    fontSize: 13,
                  }}
                >
                  <Check size={14} color="#0d6ffd" /> {feature}
                </div>
              ))}
            </div>}

            <div
              style={{
                marginTop: 20,
                paddingTop: 18,
                borderTop: "1px solid #E5E7EB",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {checkoutReady && <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#6B7280", fontSize: 13 }}>
                  {plan.trial}
                </span>
                <span style={{ color: "#111827", fontSize: 13, fontWeight: 600 }}>
                  {"\u20A60"}
                </span>
              </div>}
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#6B7280", fontSize: 13 }}>
                  {isBulkCardPurchase ? "Total due today" : "Due today"}
                </span>
                <span style={{ color: "#111827", fontSize: 13, fontWeight: 700 }}>
                  {checkoutReady ? billedToday : "..."}
                </span>
              </div>
              {checkoutReady && activePaymentMode === "installment_deposit" && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#6B7280", fontSize: 13 }}>
                    Balance due in {TEAM_INSTALLMENT_DAYS} days
                  </span>
                  <span style={{ color: "#111827", fontSize: 13, fontWeight: 700 }}>
                    {money(installmentBalanceKobo, "NGN")}
                  </span>
                </div>
              )}
              {checkoutReady && <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#6B7280", fontSize: 13 }}>
                  Next charge
                </span>
                <span style={{ color: "#111827", fontSize: 13, fontWeight: 700 }}>
                  {nextChargeLabel}
                </span>
              </div>}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                marginTop: 20,
                border: "1px solid #A7F3D0",
                borderRadius: 10,
                background: "#ECFDF5",
                color: "#047857",
                fontSize: 12,
                lineHeight: 1.5,
                padding: 12,
              }}
            >
              <ShieldCheck size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>
                Paystack processes your card details securely and returns you to JOSTAP after payment.
              </span>
            </div>
          </aside>
        </div>
      </main>

      <style jsx global>{`
        .checkout-page,
        .checkout-page * {
          box-sizing: border-box;
        }

        .checkout-layout,
        .checkout-form,
        .checkout-panel,
        .checkout-summary {
          min-width: 0;
        }

        @media (max-width: 980px) {
          .checkout-layout {
            grid-template-columns: 1fr !important;
          }

          .checkout-summary {
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
          }
        }

        @media (max-width: 640px) {
          .checkout-page {
            overflow-x: hidden;
          }

          .checkout-header {
            height: 64px !important;
            padding: 0 16px !important;
          }

          .checkout-header img {
            width: 104px !important;
          }

          .checkout-secure {
            font-size: 12px !important;
            gap: 5px !important;
          }

          .checkout-main {
            width: 100% !important;
            padding: 24px 14px 56px !important;
          }

          .checkout-layout {
            gap: 14px !important;
          }

          .checkout-panel,
          .checkout-summary {
            border-radius: 12px !important;
            padding: 18px !important;
          }

          .checkout-plan-grid,
          .checkout-account-grid {
            grid-template-columns: 1fr !important;
          }

          .checkout-summary {
            order: -1;
          }

          .checkout-summary h2 {
            font-size: 20px !important;
          }

          .checkout-summary-card {
            padding: 18px !important;
          }

          .checkout-summary-price {
            font-size: 34px !important;
            line-height: 1.05 !important;
          }
        }
      `}</style>
    </div>
  );
}
