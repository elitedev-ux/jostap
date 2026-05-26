import { useState } from "react";
import { Check } from "lucide-react";

const PLANS = [
  {
    name: "Starter",
    price: { monthly: 9, yearly: 7 },
    features: [
      "1 digital card",
      "Basic analytics",
      "QR code & vCard",
      "Public profile URL",
      "Email support",
    ],
  },
  {
    name: "Professional",
    price: { monthly: 29, yearly: 23 },
    features: [
      "5 digital cards",
      "Advanced analytics",
      "Appointment booking",
      "Lead capture",
      "Custom branding",
      "Premium templates",
      "Priority support",
    ],
  },
  {
    name: "Business Suite",
    price: { monthly: 79, yearly: 63 },
    features: [
      "Unlimited cards",
      "Team management",
      "White-label",
      "API access",
      "SSO support",
      "Dedicated support",
      "Custom integrations",
    ],
  },
];

const INVOICES = [];

const USAGE = [
  ["Cards", 0, 0, "#2563EB"],
  ["Profile Views", 0, 0, "#7C3AED"],
  ["Lead Captures", 0, 0, "#059669"],
  ["Appointments", 0, 0, "#D97706"],
];

const PLAN_SLUGS = {
  Starter: "starter",
  Professional: "professional",
  "Business Suite": "business",
};

export default function BillingPage() {
  const [billing, setBilling] = useState("monthly");
  const currentPlan = null;

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
          Manage your plan, payment method, and billing history.
        </p>
      </div>

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
        <div className="ui-empty-state" style={{ border: "none" }}>
          <p className="ui-empty-state__title">No active plan yet</p>
          <p className="ui-empty-state__copy">
            Subscription details, renewal dates, and included features will
            appear here once billing is connected.
          </p>
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
          Usage This Month
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
            gap: 16,
          }}
        >
          {USAGE.map(([label, used, total, color]) => (
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
              background: "#F9FAFB",
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              padding: 3,
              gap: 2,
            }}
          >
            {["monthly", "yearly"].map((cycle) => (
              <button
                key={cycle}
                onClick={() => setBilling(cycle)}
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  padding: "5px 10px",
                  borderRadius: 6,
                  cursor: "pointer",
                  background: billing === cycle ? "#fff" : "transparent",
                  color: billing === cycle ? "#111827" : "#6B7280",
                  border:
                    billing === cycle
                      ? "1px solid #E5E7EB"
                      : "1px solid transparent",
                }}
              >
                {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
                {cycle === "yearly" && (
                  <span
                    style={{
                      marginLeft: 5,
                      fontSize: 11,
                      color: "#2563EB",
                      fontWeight: 600,
                    }}
                  >
                    -20%
                  </span>
                )}
              </button>
            ))}
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
                  border: isCurrent ? "2px solid #2563EB" : "1px solid #E5E7EB",
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
                      background: "#2563EB",
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
                  ${plan.price[billing]}
                  <span
                    style={{ fontSize: 14, fontWeight: 400, color: "#9CA3AF" }}
                  >
                    /mo
                  </span>
                </p>
                <button
                  onClick={() => {
                    if (!isCurrent) {
                      window.location.href = `/checkout?plan=${PLAN_SLUGS[plan.name]}&billing=${billing}`;
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "9px",
                    borderRadius: 8,
                    border: isCurrent ? "1px solid #E5E7EB" : "none",
                    background: isCurrent ? "transparent" : "#2563EB",
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
                        color={isCurrent ? "#2563EB" : "#9CA3AF"}
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
        {INVOICES.length === 0 && (
          <div className="ui-empty-state" style={{ border: "none" }}>
            <p className="ui-empty-state__title">No invoices yet</p>
            <p className="ui-empty-state__copy">
              Invoices and receipts will show here when backend billing data is
              available.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
