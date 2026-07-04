import { useEffect, useState } from "react";
import { Check, MessageCircle } from "lucide-react";
import { getDashboardData } from "../../../utils/dashboardDataStore";

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

const PLANS = [
  {
    name: "Free",
    slug: "free",
    price: "\u20A60",
    billing: "free",
    features: [
      "1 digital business card",
      "Public profile page",
      "JOSTAP branded QR code",
      "Contact sharing",
      "Save contact (vCard)",
      "Social media links",
      "Basic analytics",
    ],
  },
  {
    name: "JOSTAP Card",
    slug: "jostap_nfc",
    price: "\u20A625,000",
    billing: "one_time",
    features: PAID_CARD_FEATURES,
  },
  {
    name: "Custom Card",
    slug: "custom_nfc",
    price: "\u20A630,000",
    billing: "one_time",
    features: PAID_CARD_FEATURES,
  },
];

const INVOICES = [];
const WHATSAPP_NUMBER = "2348066613437";

const USAGE = [
  ["Cards", 0, 0, "#0d6ffd"],
  ["Profile Views", 0, 0, "#ff9f0d"],
  ["Lead Captures", 0, 0, "#059669"],
  ["Appointments", 0, 0, "#D97706"],
];

const PLAN_SLUGS = {
  Free: "free",
  "JOSTAP Card": "jostap_nfc",
  "Custom Card": "custom_nfc",
};

function formatMoney(cents, currency = "usd") {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(Number(cents || 0) / 100);
}

function planLabel(plan) {
  if (plan === "free") return "Free";
  if (plan === "jostap_nfc") return "JOSTAP Card";
  if (plan === "custom_nfc") return "Custom Card";
  if (plan === "basic_renewal") return "Basic Renewal";
  if (plan === "premium_renewal") return "Premium Access";
  return null;
}

function whatsappOrderUrl(orderId, product) {
  const message = [
    "Hi JOSTAP, I just paid for my NFC card.",
    orderId ? `Order ID: ${orderId}` : "",
    product ? `Product: ${product}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export default function BillingPage() {
  const [billing, setBilling] = useState("monthly");
  const [billingData, setBillingData] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [orderConfirmation, setOrderConfirmation] = useState(null);
  const currentPlan = planLabel(billingData?.subscription?.plan);
  const subscription = billingData?.subscription;
  const usage = billingData?.usage || {};
  const invoices = billingData?.invoices || INVOICES;

  useEffect(() => {
    let active = true;

    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success") {
      setOrderConfirmation({
        orderId: params.get("order") || "",
        product: params.get("product") || "",
      });
    }

    async function loadBilling() {
      try {
        const data = await getDashboardData({ period: "30d" });
        const billingDetails = data.billing || null;

        if (active) {
          setBillingData(billingDetails);
          if (billingDetails?.subscription?.billingCycle) {
            setBilling(billingDetails.subscription.billingCycle);
          }
        }
      } catch (error) {
        if (error.status === 401) {
          window.location.href = "/auth/signin?callbackUrl=/dashboard/billing";
          return;
        }

        if (active) {
          setLoadError(error.message || "Unable to load billing details.");
        }
      }
    }

    loadBilling();

    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "#111827",
            letterSpacing: "-0.02em",
            marginBottom: 3,
          }}
        >
          Subscription & Billing
        </h1>
        <p style={{ fontSize: 14, color: "#6B7280" }}>
          Manage your JOSTAP plan, NFC card order, repayment notices, and billing history.
        </p>
      </div>

      {loadError && (
        <div
          style={{
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            color: "#B91C1C",
            borderRadius: 10,
            padding: "11px 14px",
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 16,
          }}
        >
          {loadError}
        </div>
      )}

      {orderConfirmation && (
        <section
          style={{
            background: "#ECFDF5",
            border: "1px solid #A7F3D0",
            borderRadius: 12,
            padding: "16px 18px",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 14,
            flexWrap: "wrap",
          }}
        >
          <div>
            <p style={{ fontSize: 14, fontWeight: 800, color: "#065F46", marginBottom: 4 }}>
              Payment successful
            </p>
            <p style={{ fontSize: 13, color: "#047857", lineHeight: 1.5 }}>
              {orderConfirmation.orderId
                ? `Your order ID is ${orderConfirmation.orderId}. Send it to us on WhatsApp so we can process your ${orderConfirmation.product || "NFC card"}.`
                : "Your payment was successful. Send your payment details to us on WhatsApp so we can process your NFC card."}
            </p>
          </div>
          <a
            href={whatsappOrderUrl(orderConfirmation.orderId, orderConfirmation.product)}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              borderRadius: 9,
              background: "#25D366",
              color: "#fff",
              textDecoration: "none",
              fontSize: 13,
              fontWeight: 800,
              padding: "10px 13px",
              whiteSpace: "nowrap",
            }}
          >
            <MessageCircle size={15} /> Send on WhatsApp
          </a>
        </section>
      )}

      <section
        style={{
          background: "#fff",
          border: "1px solid #E5E7EB",
          borderRadius: 12,
          padding: "22px",
          marginBottom: 20,
        }}
      >
        <h2
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "#111827",
            marginBottom: 14,
          }}
        >
          Current Plan
        </h2>
        {subscription ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
              gap: 14,
            }}
          >
            {[
              ["Plan", currentPlan],
              ["Status", subscription.status],
              ["Billing", subscription.billingCycle],
              [
                "Renews",
                subscription.currentPeriodEnd
                  ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                  : "Not set",
              ],
            ].map(([label, value]) => (
              <div key={label} style={{ border: "1px solid #E5E7EB", borderRadius: 10, padding: 14 }}>
                <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 4 }}>{label}</p>
                <p style={{ fontSize: 15, fontWeight: 800, color: "#111827", textTransform: label === "Status" || label === "Billing" ? "capitalize" : "none" }}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="ui-empty-state" style={{ border: "none" }}>
            <p className="ui-empty-state__title">No active plan yet</p>
            <p className="ui-empty-state__copy">
              Choose a product below to activate your dashboard while billing is bypassed.
            </p>
          </div>
        )}
      </section>

      <section
        style={{
          background: "#fff",
          border: "1px solid #E5E7EB",
          borderRadius: 12,
          padding: "22px",
          marginBottom: 20,
        }}
      >
        <h2
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "#111827",
            marginBottom: 16,
          }}
        >
          Usage This Month
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
            gap: 16,
          }}
        >
        {[
          ["Cards", usage.cards || 0, subscription?.cardLimit || 0, "#0d6ffd"],
          ["Profile Views", usage.views || 0, 0, "#ff9f0d"],
          ["Lead Captures", usage.leads || 0, 0, "#059669"],
          ["Appointments", usage.appointments || 0, 0, "#D97706"],
        ].map(([label, used, total, color]) => (
            <div key={label}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 5,
                }}
              >
                <span style={{ fontSize: 13, color: "#374151" }}>{label}</span>
                <span
                  style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}
                >
                  {used}/{total}
                </span>
              </div>
              <div
                style={{
                  height: 5,
                  background: "#F3F4F6",
                  borderRadius: 999,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: total ? `${(used / total) * 100}%` : "0%",
                    height: "100%",
                    background: color,
                    borderRadius: 999,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        style={{
          background: "#fff",
          border: "1px solid #E5E7EB",
          borderRadius: 12,
          padding: "22px",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>
            Choose a Plan
          </h2>
          <div
            style={{
              display: "inline-flex",
              background: "#f5f5f5",
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              padding: 3,
              gap: 2,
            }}
          >
            <span style={{ fontSize: 12, color: "#6B7280", padding: "5px 10px" }}>One-time NFC card plans</span>
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
            gap: 16,
          }}
        >
          {PLANS.map((plan) => {
            const isCurrent = plan.name === currentPlan;

            return (
              <div
                key={plan.name}
                style={{
                  border: isCurrent ? "2px solid #0d6ffd" : "1px solid #E5E7EB",
                  borderRadius: 12,
                  padding: "22px",
                  position: "relative",
                  background: isCurrent ? "#FAFBFF" : "#fff",
                }}
              >
                {isCurrent && (
                  <span
                    style={{
                      position: "absolute",
                      top: -11,
                      left: 20,
                      background: "#0d6ffd",
                      color: "#fff",
                      fontSize: 11,
                      fontWeight: 700,
                      borderRadius: 999,
                      padding: "3px 12px",
                    }}
                  >
                    Current Plan
                  </span>
                )}
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#6B7280",
                    marginBottom: 6,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {plan.name}
                </p>
                <p
                  style={{
                    fontSize: 30,
                    fontWeight: 800,
                    color: "#111827",
                    letterSpacing: "-0.025em",
                    marginBottom: 16,
                  }}
                >
                  {plan.price}
                </p>
                <button
                  onClick={() => {
                    if (!isCurrent) {
                      window.location.href = `/checkout?plan=${PLAN_SLUGS[plan.name]}&billing=${plan.billing}`;
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "9px",
                    borderRadius: 8,
                    border: isCurrent ? "1px solid #E5E7EB" : "none",
                    background: isCurrent ? "transparent" : "#0d6ffd",
                    color: isCurrent ? "#6B7280" : "#fff",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: isCurrent ? "default" : "pointer",
                    marginBottom: 18,
                  }}
                >
                  {isCurrent ? "Current Plan" : "Select Plan"}
                </button>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 9 }}
                >
                  {plan.features.map((feature) => (
                    <div
                      key={feature}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 13,
                        color: "#374151",
                      }}
                    >
                      <Check
                        size={13}
                        color={isCurrent ? "#0d6ffd" : "#9CA3AF"}
                      />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section
        style={{
          background: "#fff",
          border: "1px solid #E5E7EB",
          borderRadius: 12,
          padding: "22px",
          marginBottom: 20,
        }}
      >
        <h2
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "#111827",
            marginBottom: 16,
          }}
        >
          Payment Method
        </h2>
        <div className="ui-empty-state" style={{ border: "none" }}>
          <p className="ui-empty-state__title">No payment method yet</p>
          <p className="ui-empty-state__copy">
            Saved cards and payment provider details will appear here after the
            backend is connected.
          </p>
        </div>
      </section>

      <section
        style={{
          background: "#fff",
          border: "1px solid #E5E7EB",
          borderRadius: 12,
          padding: "22px",
        }}
      >
        <h2
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "#111827",
            marginBottom: 16,
          }}
        >
          Billing History
        </h2>
        {invoices.length === 0 && (
          <div className="ui-empty-state" style={{ border: "none" }}>
            <p className="ui-empty-state__title">No invoices yet</p>
            <p className="ui-empty-state__copy">
              Invoices and receipts will show here when backend billing data is
              available.
            </p>
          </div>
        )}
        {invoices.map((invoice) => (
          <div
            className="billing-history-row"
            key={invoice.id}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 120px 110px 120px",
              gap: 14,
              padding: "13px 0",
              borderTop: "1px solid #F3F4F6",
              alignItems: "center",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <p
                className="billing-history-row__reference"
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: "#111827",
                  overflowWrap: "anywhere",
                  wordBreak: "break-word",
                }}
              >
                {invoice.invoiceNumber}
              </p>
              <p style={{ fontSize: 12, color: "#6B7280" }}>
                {invoice.issuedAt ? new Date(invoice.issuedAt).toLocaleDateString() : "No date"}
              </p>
            </div>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#111827" }}>
              {formatMoney(invoice.amountCents, invoice.currency)}
            </span>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#0d6ffd", textTransform: "capitalize" }}>
              {invoice.status}
            </span>
            {invoice.hostedInvoiceUrl ? (
              <a href={invoice.hostedInvoiceUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "#0d6ffd", fontWeight: 700 }}>
                View invoice
              </a>
            ) : (
              <span style={{ fontSize: 12, color: "#9CA3AF" }}>No file</span>
            )}
          </div>
        ))}
      </section>
      <style jsx global>{`
        @media (max-width: 720px) {
          .billing-history-row {
            grid-template-columns: 1fr !important;
            gap: 8px !important;
            align-items: start !important;
          }
          .billing-history-row__reference {
            font-size: 13px !important;
            line-height: 1.35 !important;
          }
        }
      `}</style>
    </>
  );
}
