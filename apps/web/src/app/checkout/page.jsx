import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  CreditCard,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import logo from "../../assets/jostap logo.png3.png";
import ThemeToggle from "../../components/ThemeToggle";

const PLANS = {
  starter: {
    name: "Starter",
    monthly: 9,
    yearly: 7,
    cards: "1 digital card",
    trial: "14-day free trial",
    features: ["Basic analytics", "QR code", "Public profile URL"],
  },
  professional: {
    name: "Professional",
    monthly: 29,
    yearly: 23,
    cards: "5 digital cards",
    trial: "14-day free trial",
    features: [
      "Advanced analytics",
      "Appointment booking",
      "Lead capture",
      "Custom branding",
    ],
  },
  business: {
    name: "Business Suite",
    monthly: 79,
    yearly: 63,
    cards: "Unlimited cards",
    trial: "Sales-assisted onboarding",
    features: ["Team management", "White-label branding", "API access"],
  },
};

const getCheckoutFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  const plan = params.get("plan") || "professional";
  const billing = params.get("billing") || "monthly";

  return {
    plan: PLANS[plan] ? plan : "professional",
    billing: billing === "yearly" ? "yearly" : "monthly",
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
  const [planKey, setPlanKey] = useState("professional");
  const [billing, setBilling] = useState("monthly");
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [saveCard, setSaveCard] = useState(true);
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
  }, []);

  const plan = PLANS[planKey];
  const monthlyPrice = plan[billing];
  const billedToday = 0;
  const nextCharge = billing === "yearly" ? monthlyPrice * 12 : monthlyPrice;
  const nextChargeLabel =
    billing === "yearly" ? `$${nextCharge}/year` : `$${nextCharge}/month`;

  const updateAccount = (key, value) => {
    setAccount((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setNotice("");

    await new Promise((resolve) => setTimeout(resolve, 900));

    setLoading(false);
    setNotice(
      "Payment UI is ready. Backend checkout/session creation can be connected here."
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F9FAFB" }}>
      <header
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
          <ThemeToggle compact />
        </div>
      </header>

      <main
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
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,1fr) 360px",
            gap: 24,
            alignItems: "start",
          }}
        >
          <form onSubmit={handleSubmit}>
            <div
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
                    color: "#2563EB",
                    background: "#EFF6FF",
                    border: "1px solid #BFDBFE",
                    borderRadius: 999,
                    padding: "4px 10px",
                    fontSize: 12,
                    fontWeight: 700,
                    marginBottom: 14,
                  }}
                >
                  <Sparkles size={13} /> Checkout preview
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
                  Start your JOSTAP plan
                </h1>
                <p style={{ color: "#6B7280", fontSize: 14, lineHeight: 1.6 }}>
                  Choose a plan and enter payment details. Secure checkout
                  wiring will connect here next.
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
                  gap: 12,
                  marginBottom: 24,
                }}
              >
                {Object.entries(PLANS).map(([key, item]) => (
                  <button
                    key={key}
                    onClick={() => setPlanKey(key)}
                    type="button"
                    style={{
                      textAlign: "left",
                      border:
                        planKey === key
                          ? "2px solid #2563EB"
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
                        color: planKey === key ? "#2563EB" : "#111827",
                        fontSize: 14,
                        fontWeight: 700,
                        marginBottom: 4,
                      }}
                    >
                      {item.name}
                    </span>
                    <span style={{ color: "#6B7280", fontSize: 12 }}>
                      ${item[billing]}/mo · {item.cards}
                    </span>
                  </button>
                ))}
              </div>

              <div
                style={{
                  display: "inline-flex",
                  gap: 4,
                  border: "1px solid #E5E7EB",
                  borderRadius: 10,
                  background: "#F9FAFB",
                  padding: 4,
                }}
              >
                {["monthly", "yearly"].map((option) => (
                  <button
                    key={option}
                    onClick={() => setBilling(option)}
                    type="button"
                    style={{
                      border:
                        billing === option
                          ? "1px solid #E5E7EB"
                          : "1px solid transparent",
                      borderRadius: 7,
                      background: billing === option ? "#fff" : "transparent",
                      color: billing === option ? "#111827" : "#6B7280",
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 600,
                      padding: "7px 16px",
                    }}
                  >
                    {option === "monthly" ? "Monthly" : "Annual"}
                    {option === "yearly" && (
                      <span style={{ color: "#059669", marginLeft: 6 }}>
                        Save 20%
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div
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
                Payment method
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr",
                  gap: 14,
                }}
              >
                <Field label="Card number">
                  <div style={{ position: "relative" }}>
                    <input
                      inputMode="numeric"
                      required
                      style={{ ...inputStyle, paddingLeft: 42 }}
                      placeholder="Card number"
                    />
                    <CreditCard
                      size={17}
                      color="#6B7280"
                      style={{
                        position: "absolute",
                        left: 14,
                        top: "50%",
                        transform: "translateY(-50%)",
                      }}
                    />
                  </div>
                </Field>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 14,
                  }}
                >
                  <Field label="Expiry">
                    <input required style={inputStyle} placeholder="MM / YY" />
                  </Field>
                  <Field label="CVC">
                    <input required style={inputStyle} placeholder="CVC" />
                  </Field>
                </div>

                <Field label="Billing address">
                  <input required style={inputStyle} placeholder="Street address" />
                </Field>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 14,
                  }}
                >
                  <Field label="City">
                    <input required style={inputStyle} placeholder="City" />
                  </Field>
                  <Field label="Country">
                    <select required style={inputStyle} defaultValue="">
                      <option value="" disabled>
                        Select country
                      </option>
                      <option value="NG">Nigeria</option>
                      <option value="US">United States</option>
                      <option value="GB">United Kingdom</option>
                      <option value="CA">Canada</option>
                      <option value="GH">Ghana</option>
                    </select>
                  </Field>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  marginTop: 18,
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    color: "#374151",
                    fontSize: 13,
                  }}
                >
                  <input
                    checked={sameAsBilling}
                    onChange={(event) => setSameAsBilling(event.target.checked)}
                    type="checkbox"
                  />
                  Shipping address is the same as billing address
                </label>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    color: "#374151",
                    fontSize: 13,
                  }}
                >
                  <input
                    checked={saveCard}
                    onChange={(event) => setSaveCard(event.target.checked)}
                    type="checkbox"
                  />
                  Save this card for subscription renewals
                </label>
              </div>

              {notice && (
                <div
                  style={{
                    marginTop: 18,
                    border: "1px solid #BFDBFE",
                    borderRadius: 10,
                    background: "#EFF6FF",
                    color: "#1D4ED8",
                    fontSize: 13,
                    padding: "11px 13px",
                  }}
                >
                  {notice}
                </div>
              )}

              <button
                disabled={loading}
                type="submit"
                style={{
                  width: "100%",
                  marginTop: 20,
                  border: "none",
                  borderRadius: 10,
                  background: loading ? "#93C5FD" : "#2563EB",
                  color: "#fff",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: 15,
                  fontWeight: 700,
                  padding: "13px 18px",
                }}
              >
                {loading ? "Preparing checkout..." : `Start trial - ${nextChargeLabel} after trial`}
              </button>
            </div>
          </form>

          <aside
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
              style={{
                border: "1px solid #E5E7EB",
                borderRadius: 12,
                background: "#F9FAFB",
                padding: 16,
                marginBottom: 18,
              }}
            >
              <p
                style={{
                  color: "#2563EB",
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  marginBottom: 5,
                }}
              >
                {plan.name}
              </p>
              <p
                style={{
                  color: "#111827",
                  fontSize: 30,
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                }}
              >
                ${monthlyPrice}
                <span style={{ color: "#6B7280", fontSize: 13, fontWeight: 500 }}>
                  /mo
                </span>
              </p>
              <p style={{ color: "#6B7280", fontSize: 13, marginTop: 4 }}>
                {billing === "yearly" ? "Billed annually" : "Billed monthly"} ·{" "}
                {plan.cards}
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
                  <Check size={14} color="#2563EB" /> {feature}
                </div>
              ))}
            </div>

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
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#6B7280", fontSize: 13 }}>
                  {plan.trial}
                </span>
                <span style={{ color: "#111827", fontSize: 13, fontWeight: 600 }}>
                  $0
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#6B7280", fontSize: 13 }}>
                  Due today
                </span>
                <span style={{ color: "#111827", fontSize: 13, fontWeight: 700 }}>
                  ${billedToday}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#6B7280", fontSize: 13 }}>
                  Next charge
                </span>
                <span style={{ color: "#111827", fontSize: 13, fontWeight: 700 }}>
                  {nextChargeLabel}
                </span>
              </div>
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
                Card collection is UI-only for now. Connect Stripe, Paystack, or
                your preferred provider when the backend is ready.
              </span>
            </div>
          </aside>
        </div>
      </main>

      <style jsx global>{`
        @media (max-width: 980px) {
          div[style*="grid-template-columns: minmax(0,1fr) 360px"] {
            grid-template-columns: 1fr !important;
          }

          aside[style*="position: sticky"] {
            position: static !important;
          }
        }

        @media (max-width: 640px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
