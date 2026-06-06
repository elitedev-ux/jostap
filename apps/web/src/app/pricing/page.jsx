import { useState } from "react";
import { ArrowRight, Check, X } from "lucide-react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const PLANS = [
  {
    name: "Free",
    price: "\u20A60",
    note: "",
    desc: "Best for personal networking",
    cta: "Get Started",
    href: "/auth/signup",
    features: [
      ["1 Digital Business Card", true],
      ["Public Profile Page", true],
      ["JOSTAP Branded QR Code", true],
      ["Contact Sharing", true],
      ["Save Contact (vCard)", true],
      ["Social Media Links", true],
      ["Basic Analytics", true],
    ],
  },
  {
    name: "JOSTAP Card",
    price: "\u20A640,000",
    note: "",
    desc: "Best for professionals",
    cta: "Order Card",
    href: "/checkout?plan=jostap_nfc&billing=one_time",
    popular: true,
    features: [
      ["Physical NFC Card", true],
      ["Digital Business Profile", true],
      ["JOSTAP Branded QR Code", true],
      ["Downloadable QR Code", true],
      ["Contact Sharing", true],
      ["Save Contact (vCard)", true],
      ["Social Media Links", true],
      ["Lead Capture", true],
      ["Appointment Booking", true],
      ["Visitor Insights", true],
      ["Advanced Analytics", true],
      ["Premium Features", true],
      ["1 Year Premium Access Included", true],
    ],
  },
];

const FAQS = [
  {
    q: "Do I need a physical NFC card to use JOSTAP?",
    a: "No. You can start free with a digital card, public profile, branded QR code, contact sharing, vCard save, and basic analytics.",
  },
  {
    q: "Are NFC cards subscriptions?",
    a: "No. JOSTAP Card is a one-time payment and includes 1 year premium access.",
  },
  {
    q: "What happens after the first year?",
    a: "Your card and profile still work. Premium features may require renewal after the included year.",
  },
];

function FeatureList({ features }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
      {features.map(([feature, enabled]) => (
        <div key={feature} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {enabled ? <Check size={15} color="#0d6ffd" /> : <X size={15} color="#D1D5DB" />}
          <span style={{ fontSize: 13, color: enabled ? "#374151" : "#9CA3AF" }}>{feature}</span>
        </div>
      ))}
    </div>
  );
}

function PlanCard({ plan }) {
  return (
    <article
      style={{
        border: plan.popular ? "2px solid #0d6ffd" : "1px solid #E5E7EB",
        borderRadius: 16,
        padding: "32px 28px",
        background: plan.popular ? "#fbfdff" : "#fff",
        position: "relative",
      }}
    >
      {plan.popular && (
        <span style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", background: "#ff9f0d", color: "#111827", fontSize: 11, fontWeight: 800, borderRadius: 999, padding: "4px 16px", whiteSpace: "nowrap" }}>
          Most Popular
        </span>
      )}
      <p style={{ fontSize: 12, fontWeight: 800, color: plan.popular ? "#0d6ffd" : "#6B7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{plan.name}</p>
      <p style={{ fontSize: 48, fontWeight: 800, color: "#111827", letterSpacing: "-0.035em", marginBottom: 4 }}>{plan.price}</p>
      {plan.note && <p style={{ fontSize: 13, color: "#8a5000", fontWeight: 800, marginBottom: 6 }}>{plan.note}</p>}
      {plan.subNote && <p style={{ fontSize: 12, color: "#6B7280", fontWeight: 700, marginBottom: 6 }}>{plan.subNote}</p>}
      <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 24 }}>{plan.desc}</p>
      <a href={plan.href} style={{ display: "block", textAlign: "center", padding: "12px", borderRadius: 9, fontSize: 14, fontWeight: 700, textDecoration: "none", background: plan.popular ? "#0d6ffd" : "#f5f5f5", color: plan.popular ? "#fff" : "#111827", border: plan.popular ? "none" : "1px solid #E5E7EB", marginBottom: 26 }}>
        {plan.cta} <ArrowRight size={13} style={{ display: "inline", marginLeft: 4 }} />
      </a>
      <FeatureList features={plan.features} />
    </article>
  );
}

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div style={{ backgroundColor: "#fff", minHeight: "100vh" }}>
      <Navbar />

      <section style={{ paddingTop: 108, paddingBottom: 64, textAlign: "center", borderBottom: "1px solid #E5E7EB", background: "#f5f5f5" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 24px" }}>
          <h1 style={{ fontSize: "clamp(32px,5vw,52px)", fontWeight: 800, color: "#111827", letterSpacing: "-0.03em", marginBottom: 14 }}>
            JOSTAP Pricing
          </h1>
          <p style={{ fontSize: 17, color: "#6B7280", lineHeight: 1.65 }}>
            Start with a free digital card, then upgrade to JOSTAP Card for physical NFC sharing and premium growth features.
          </p>
        </div>
      </section>

      <section style={{ maxWidth: 1120, margin: "0 auto", padding: "64px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 20 }}>
          {PLANS.map((plan) => <PlanCard key={plan.name} plan={plan} />)}
        </div>
      </section>

      <section style={{ backgroundColor: "#fff", padding: "80px 24px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: "#111827", textAlign: "center", marginBottom: 40 }}>Frequently asked questions</h2>
          {FAQS.map((faq, index) => (
            <div key={faq.q} style={{ borderBottom: index < FAQS.length - 1 ? "1px solid #E5E7EB" : "none" }}>
              <button onClick={() => setOpenFaq(openFaq === index ? null : index)} style={{ width: "100%", textAlign: "left", background: "transparent", border: "none", padding: "18px 0", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{faq.q}</span>
                <span style={{ fontSize: 18, color: "#6B7280", flexShrink: 0, transform: openFaq === index ? "rotate(45deg)" : "none", transition: "transform 0.2s", display: "inline-block" }}>+</span>
              </button>
              {openFaq === index && <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.65, paddingBottom: 18 }}>{faq.a}</p>}
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: "0 24px 80px", textAlign: "center" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: "#111827", marginBottom: 14 }}>Ready to get started?</h2>
          <p style={{ fontSize: 16, color: "#6B7280", marginBottom: 32 }}>Create your free profile now. Add an NFC card whenever you are ready.</p>
          <a href="/auth/signup" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 700, color: "#fff", textDecoration: "none", padding: "13px 28px", borderRadius: 10, background: "#0d6ffd" }}>
            Get Started <ArrowRight size={15} />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
