import { useState } from "react";
import { Check, X, Zap, ArrowRight } from "lucide-react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const PLANS = [
  {
    name: "Starter",
    monthly: 9,
    yearly: 7,
    desc: "Perfect for freelancers and individuals.",
    cta: "Start Free Trial",
    features: {
      "Digital Cards": "1 card",
      "Public Profile URL": true,
      "QR Code": true,
      "vCard Download": true,
      "Analytics (basic)": true,
      "Advanced Analytics": false,
      "Appointment Booking": false,
      "Lead Capture": false,
      "Custom Branding": false,
      "Premium Templates": false,
      "Team Management": false,
      "API Access": false,
    },
  },
  {
    name: "Professional",
    monthly: 29,
    yearly: 23,
    desc: "For professionals who need more.",
    cta: "Start Free Trial",
    popular: true,
    features: {
      "Digital Cards": "5 cards",
      "Public Profile URL": true,
      "QR Code": true,
      "vCard Download": true,
      "Analytics (basic)": true,
      "Advanced Analytics": true,
      "Appointment Booking": true,
      "Lead Capture": true,
      "Custom Branding": true,
      "Premium Templates": true,
      "Team Management": false,
      "API Access": false,
    },
  },
  {
    name: "Business Suite",
    monthly: 79,
    yearly: 63,
    desc: "For teams and growing organizations.",
    cta: "Contact Sales",
    features: {
      "Digital Cards": "Unlimited",
      "Public Profile URL": true,
      "QR Code": true,
      "vCard Download": true,
      "Analytics (basic)": true,
      "Advanced Analytics": true,
      "Appointment Booking": true,
      "Lead Capture": true,
      "Custom Branding": true,
      "Premium Templates": true,
      "Team Management": true,
      "API Access": true,
    },
  },
];

const FEATURES = Object.keys(PLANS[0].features);

const PLAN_SLUGS = {
  Starter: "starter",
  Professional: "professional",
  "Business Suite": "business",
};

const FAQS = [
  {
    q: "Do I need a physical NFC card to use the platform?",
    a: "No — you can use all digital features including your public profile, QR code, and analytics without a physical card. The NFC card ships separately and simply links to your digital profile when tapped.",
  },
  {
    q: "Can I switch plans later?",
    a: "Yes, absolutely. You can upgrade or downgrade at any time. Upgrades take effect immediately and we'll prorate your billing. Downgrades apply at the start of your next billing cycle.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes — the Starter and Professional plans come with a 14-day free trial. No credit card is required to start.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit and debit cards (Visa, Mastercard, Amex), as well as bank transfers for annual Business Suite plans.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from your billing settings at any time. You keep access until the end of your paid period.",
  },
];

export default function PricingPage() {
  const [billing, setBilling] = useState("monthly");
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div style={{ backgroundColor: "#fff", minHeight: "100vh" }}>
      <Navbar />

      {/* Hero */}
      <section
        style={{
          paddingTop: 108,
          paddingBottom: 64,
          textAlign: "center",
          borderBottom: "1px solid #E5E7EB",
          background: "#F9FAFB",
        }}
      >
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 24px" }}>
          <h1
            style={{
              fontSize: "clamp(32px,5vw,52px)",
              fontWeight: 800,
              color: "#111827",
              letterSpacing: "-0.03em",
              marginBottom: 14,
            }}
          >
            Simple, transparent pricing
          </h1>
          <p
            style={{
              fontSize: 17,
              color: "#6B7280",
              lineHeight: 1.65,
              marginBottom: 32,
            }}
          >
            Start free. Upgrade when you're ready. No hidden fees, ever.
          </p>
          <div
            style={{
              display: "inline-flex",
              background: "#fff",
              border: "1px solid #E5E7EB",
              borderRadius: 10,
              padding: 4,
              gap: 4,
            }}
          >
            {["monthly", "yearly"].map((b) => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  padding: "8px 22px",
                  borderRadius: 7,
                  border: "none",
                  cursor: "pointer",
                  background: billing === b ? "#111827" : "transparent",
                  color: billing === b ? "#fff" : "#6B7280",
                  transition: "all 0.15s",
                }}
              >
                {b === "monthly" ? "Monthly" : "Annual"}
                {b === "yearly" && (
                  <span
                    style={{
                      marginLeft: 8,
                      fontSize: 11,
                      background: "#ECFDF5",
                      color: "#059669",
                      borderRadius: 999,
                      padding: "2px 7px",
                      fontWeight: 700,
                    }}
                  >
                    Save 20%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing cards */}
      <section
        style={{ maxWidth: 1100, margin: "0 auto", padding: "64px 24px" }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
            gap: 20,
          }}
        >
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              style={{
                border: plan.popular
                  ? "2px solid #2563EB"
                  : "1px solid #E5E7EB",
                borderRadius: 16,
                padding: "32px 28px",
                background: plan.popular ? "#FAFBFF" : "#fff",
                position: "relative",
              }}
            >
              {plan.popular && (
                <span
                  style={{
                    position: "absolute",
                    top: -13,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "#2563EB",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 700,
                    borderRadius: 999,
                    padding: "4px 16px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Most Popular
                </span>
              )}
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: plan.popular ? "#2563EB" : "#6B7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 8,
                }}
              >
                {plan.name}
              </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 4,
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 48,
                    fontWeight: 800,
                    color: "#111827",
                    letterSpacing: "-0.035em",
                  }}
                >
                  ${plan[billing]}
                </span>
                <span style={{ fontSize: 14, color: "#9CA3AF" }}>
                  /{billing === "monthly" ? "mo" : "mo billed annually"}
                </span>
              </div>
              <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 24 }}>
                {plan.desc}
              </p>
              <a
                href={`/checkout?plan=${PLAN_SLUGS[plan.name]}&billing=${billing}`}
                style={{
                  display: "block",
                  textAlign: "center",
                  padding: "12px",
                  borderRadius: 9,
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: "none",
                  background: plan.popular ? "#2563EB" : "#F9FAFB",
                  color: plan.popular ? "#fff" : "#111827",
                  border: plan.popular ? "none" : "1px solid #E5E7EB",
                  marginBottom: 26,
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => (e.target.style.opacity = "0.9")}
                onMouseLeave={(e) => (e.target.style.opacity = "1")}
              >
                {plan.cta}{" "}
                {plan.cta !== "Contact Sales" && (
                  <ArrowRight
                    size={13}
                    style={{ display: "inline", marginLeft: 4 }}
                  />
                )}
              </a>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 11 }}
              >
                {FEATURES.map((f) => {
                  const val = plan.features[f];
                  return (
                    <div
                      key={f}
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      {val === true ? (
                        <Check size={15} color="#2563EB" />
                      ) : val === false ? (
                        <X size={15} color="#D1D5DB" />
                      ) : (
                        <Check size={15} color="#2563EB" />
                      )}
                      <span
                        style={{
                          fontSize: 13,
                          color: val === false ? "#9CA3AF" : "#374151",
                        }}
                      >
                        {f}
                        {typeof val === "string" ? `: ${val}` : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature comparison table */}
      <section
        style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 80px" }}
      >
        <h2
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: "#111827",
            letterSpacing: "-0.02em",
            textAlign: "center",
            marginBottom: 36,
          }}
        >
          Full feature comparison
        </h2>
        <div
          style={{
            background: "#fff",
            border: "1px solid #E5E7EB",
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #E5E7EB" }}>
                <th
                  style={{
                    padding: "16px 20px",
                    textAlign: "left",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#6B7280",
                    background: "#F9FAFB",
                  }}
                >
                  Feature
                </th>
                {PLANS.map((p) => (
                  <th
                    key={p.name}
                    style={{
                      padding: "16px 20px",
                      textAlign: "center",
                      fontSize: 13,
                      fontWeight: 700,
                      color: p.popular ? "#2563EB" : "#111827",
                      background: p.popular ? "#F0F6FF" : "#F9FAFB",
                    }}
                  >
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((f, i) => (
                <tr
                  key={f}
                  style={{
                    borderBottom:
                      i < FEATURES.length - 1 ? "1px solid #F3F4F6" : "none",
                  }}
                >
                  <td
                    style={{
                      padding: "13px 20px",
                      fontSize: 13,
                      color: "#374151",
                      fontWeight: 500,
                    }}
                  >
                    {f}
                  </td>
                  {PLANS.map((p) => {
                    const val = p.features[f];
                    return (
                      <td
                        key={p.name}
                        style={{
                          padding: "13px 20px",
                          textAlign: "center",
                          background: p.popular ? "#FAFBFF" : "transparent",
                        }}
                      >
                        {val === true ? (
                          <Check
                            size={16}
                            color="#2563EB"
                            style={{ margin: "0 auto" }}
                          />
                        ) : val === false ? (
                          <X
                            size={16}
                            color="#D1D5DB"
                            style={{ margin: "0 auto" }}
                          />
                        ) : (
                          <span
                            style={{
                              fontSize: 13,
                              color: "#374151",
                              fontWeight: 500,
                            }}
                          >
                            {val}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section
        style={{
          backgroundColor: "#F9FAFB",
          borderTop: "1px solid #E5E7EB",
          padding: "80px 24px",
        }}
      >
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <h2
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: "#111827",
              letterSpacing: "-0.02em",
              textAlign: "center",
              marginBottom: 40,
            }}
          >
            Frequently asked questions
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {FAQS.map((faq, i) => (
              <div
                key={faq.q}
                style={{
                  borderBottom:
                    i < FAQS.length - 1 ? "1px solid #E5E7EB" : "none",
                }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    background: "transparent",
                    border: "none",
                    padding: "18px 0",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 16,
                  }}
                >
                  <span
                    style={{ fontSize: 15, fontWeight: 500, color: "#111827" }}
                  >
                    {faq.q}
                  </span>
                  <span
                    style={{
                      fontSize: 18,
                      color: "#6B7280",
                      flexShrink: 0,
                      transform: openFaq === i ? "rotate(45deg)" : "none",
                      transition: "transform 0.2s",
                      display: "inline-block",
                    }}
                  >
                    +
                  </span>
                </button>
                {openFaq === i && (
                  <p
                    style={{
                      fontSize: 14,
                      color: "#6B7280",
                      lineHeight: 1.65,
                      paddingBottom: 18,
                    }}
                  >
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "80px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <h2
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: "#111827",
              letterSpacing: "-0.025em",
              marginBottom: 14,
            }}
          >
            Ready to get started?
          </h2>
          <p style={{ fontSize: 16, color: "#6B7280", marginBottom: 32 }}>
            14-day free trial. No credit card required.
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <a
              href="/auth/signup"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontSize: 15,
                fontWeight: 600,
                color: "#fff",
                textDecoration: "none",
                padding: "13px 28px",
                borderRadius: 10,
                background: "#2563EB",
              }}
            >
              Start for free <ArrowRight size={15} />
            </a>
            <a
              href="/contact"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontSize: 15,
                fontWeight: 500,
                color: "#374151",
                textDecoration: "none",
                padding: "13px 24px",
                borderRadius: 10,
                border: "1px solid #E5E7EB",
              }}
            >
              Talk to sales
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
