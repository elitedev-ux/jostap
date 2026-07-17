import { useEffect, useState } from "react";
import { ArrowRight, BadgeCheck, Building2, MapPin, Phone } from "lucide-react";
import logo from "../../assets/jostap logo.png3.png";

const inputStyle = {
  width: "100%",
  border: "1px solid #D1D5DB",
  borderRadius: 8,
  background: "#fff",
  color: "#111827",
  fontSize: 14,
  padding: "11px 12px",
  outline: "none",
  boxSizing: "border-box",
};

const businessTypes = [
  "Solo professional",
  "Small business",
  "Agency or studio",
  "Startup",
  "Enterprise team",
  "Creator",
  "Other",
];

const goals = [
  "Share my digital business card",
  "Capture leads from networking",
  "Book appointments",
  "Track card analytics",
  "Manage cards for a team",
];

const accountTypes = [
  {
    value: "individual",
    label: "Individual",
    description: "For one person managing a personal JOSTAP profile.",
  },
  {
    value: "company",
    label: "Team",
    description: "For a business planning to manage multiple card profiles.",
  },
];

function Field({ label, children, required = true }) {
  return (
    <label style={{ display: "block" }}>
      <span
        style={{
          display: "block",
          color: "#374151",
          fontSize: 13,
          fontWeight: 700,
          marginBottom: 6,
        }}
      >
        {label}
        {required && <span style={{ color: "#0d6ffd" }}> *</span>}
      </span>
      {children}
    </label>
  );
}

export default function KycPage() {
  const [loadingUser, setLoadingUser] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    accountType: "individual",
    phone: "",
    jobTitle: "",
    businessName: "",
    businessType: "Small business",
    country: "",
    city: "",
    website: "",
    primaryGoal: "Share my digital business card",
  });

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const userResponse = await fetch("/api/auth/me", {
          credentials: "same-origin",
        });

        if (userResponse.status === 401) {
          window.location.href = "/auth/signin?callbackUrl=/kyc";
          return;
        }

        const userData = await userResponse.json().catch(() => ({}));

        if (userData.user?.kycComplete) {
          window.location.href = "/dashboard";
          return;
        }

        const profileResponse = await fetch("/api/kyc", {
          credentials: "same-origin",
        });
        const profileData = await profileResponse.json().catch(() => ({}));

        if (!active) {
          return;
        }

        setForm((current) => ({
          ...current,
          businessName: userData.user?.company || current.businessName,
          ...(profileData.profile || {}),
        }));
      } catch (error) {
        if (active) {
          setError(error.message || "Unable to load onboarding.");
        }
      } finally {
        if (active) {
          setLoadingUser(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/kyc", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Unable to save your details.");
      }

      window.location.href = "/dashboard";
    } catch (error) {
      setError(error.message || "Unable to save your details.");
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <header
        style={{
          height: 70,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 clamp(18px,5vw,60px)",
          background: "#fff",
          borderBottom: "1px solid #E5E7EB",
        }}
      >
        <a href="/" style={{ display: "inline-flex", alignItems: "center" }}>
          <img
            src={logo}
            alt="JOSTAP"
            style={{ width: 112, height: 44, objectFit: "contain" }}
          />
        </a>
      </header>

      <main
        style={{
          maxWidth: 980,
          margin: "0 auto",
          padding: "38px 22px 70px",
          display: "grid",
          gridTemplateColumns: "300px minmax(0,1fr)",
          gap: 22,
          alignItems: "start",
        }}
      >
        <aside
          style={{
            background: "#111827",
            color: "#fff",
            borderRadius: 8,
            padding: 24,
            minHeight: 430,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(37,99,235,0.18)",
              border: "1px solid rgba(147,197,253,0.35)",
              color: "#BFDBFE",
              borderRadius: 999,
              padding: "6px 10px",
              fontSize: 12,
              fontWeight: 800,
              marginBottom: 18,
            }}
          >
            <BadgeCheck size={14} /> Account setup
          </div>
          <h1 style={{ fontSize: 28, lineHeight: 1.1, marginBottom: 12 }}>
            Tell us the basics before you enter your dashboard.
          </h1>
          <p style={{ color: "#D1D5DB", fontSize: 14, lineHeight: 1.7 }}>
            This helps JOSTAP personalize your cards, lead capture, and business
            tools. Keep it simple; you can update details later.
          </p>

          <div
            style={{
              display: "grid",
              gap: 12,
              marginTop: 28,
              color: "#E5E7EB",
              fontSize: 13,
            }}
          >
            {[
              [Phone, "Contact details"],
              [Building2, "Business profile"],
              [MapPin, "Location and goals"],
            ].map(([Icon, text]) => (
              <div key={text} style={{ display: "flex", gap: 10 }}>
                <Icon size={16} color="#8fc1ff" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </aside>

        <section
          style={{
            background: "#fff",
            border: "1px solid #E5E7EB",
            borderRadius: 8,
            padding: 24,
          }}
        >
          <h2
            style={{
              color: "#111827",
              fontSize: 20,
              fontWeight: 800,
              marginBottom: 4,
            }}
          >
            Basic information
          </h2>
          <p style={{ color: "#6B7280", fontSize: 14, marginBottom: 22 }}>
            Required once for new accounts.
          </p>

          {error && (
            <div
              style={{
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                color: "#B91C1C",
                borderRadius: 8,
                padding: "11px 12px",
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 18,
              }}
            >
              {error}
            </div>
          )}

          {loadingUser ? (
            <div style={{ color: "#6B7280", fontSize: 14, padding: "28px 0" }}>
              Loading account setup...
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                <div style={{ gridColumn: "1 / -1" }}>
                  <span
                    style={{
                      display: "block",
                      color: "#374151",
                      fontSize: 13,
                      fontWeight: 700,
                      marginBottom: 8,
                    }}
                  >
                    Account type <span style={{ color: "#0d6ffd" }}>*</span>
                  </span>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 12,
                    }}
                  >
                    {accountTypes.map((type) => {
                      const selected = form.accountType === type.value;

                      return (
                        <button
                          key={type.value}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => update("accountType", type.value)}
                          style={{
                            textAlign: "left",
                            border: `1px solid ${
                              selected ? "#0d6ffd" : "#D1D5DB"
                            }`,
                            borderRadius: 10,
                            background: selected ? "#EFF6FF" : "#fff",
                            color: "#111827",
                            padding: "14px 15px",
                            cursor: "pointer",
                            boxShadow: selected
                              ? "0 10px 24px rgba(13,111,253,0.12)"
                              : "none",
                          }}
                        >
                          <strong
                            style={{
                              display: "block",
                              fontSize: 14,
                              marginBottom: 5,
                            }}
                          >
                            {type.label}
                          </strong>
                          <span
                            style={{
                              display: "block",
                              color: "#6B7280",
                              fontSize: 12,
                              lineHeight: 1.5,
                            }}
                          >
                            {type.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <Field label="Phone number">
                  <input
                    required
                    value={form.phone}
                    onChange={(event) => update("phone", event.target.value)}
                    style={inputStyle}
                    placeholder="+234 800 000 0000"
                  />
                </Field>
                <Field label="Job title">
                  <input
                    required
                    value={form.jobTitle}
                    onChange={(event) => update("jobTitle", event.target.value)}
                    style={inputStyle}
                    placeholder="Founder, Sales Lead, Designer..."
                  />
                </Field>
                <Field label="Business name">
                  <input
                    required
                    value={form.businessName}
                    onChange={(event) =>
                      update("businessName", event.target.value)
                    }
                    style={inputStyle}
                    placeholder={
                      form.accountType === "company"
                        ? "Your company name"
                        : "Your company or brand"
                    }
                  />
                </Field>
                <Field label="Business type">
                  <select
                    required
                    value={form.businessType}
                    onChange={(event) =>
                      update("businessType", event.target.value)
                    }
                    style={inputStyle}
                  >
                    {businessTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Country">
                  <input
                    required
                    value={form.country}
                    onChange={(event) => update("country", event.target.value)}
                    style={inputStyle}
                    placeholder="Nigeria"
                  />
                </Field>
                <Field label="City">
                  <input
                    required
                    value={form.city}
                    onChange={(event) => update("city", event.target.value)}
                    style={inputStyle}
                    placeholder="Lagos"
                  />
                </Field>
                <Field label="Website or portfolio" required={false}>
                  <input
                    value={form.website}
                    onChange={(event) => update("website", event.target.value)}
                    style={inputStyle}
                    placeholder="https://example.com"
                  />
                </Field>
                <Field label="Primary goal">
                  <select
                    required
                    value={form.primaryGoal}
                    onChange={(event) =>
                      update("primaryGoal", event.target.value)
                    }
                    style={inputStyle}
                  >
                    {goals.map((goal) => (
                      <option key={goal} value={goal}>
                        {goal}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <button
                type="submit"
                disabled={saving}
                style={{
                  marginTop: 22,
                  width: "100%",
                  border: "none",
                  borderRadius: 8,
                  background: saving ? "#8fc1ff" : "#0d6ffd",
                  color: "#fff",
                  padding: "13px 18px",
                  fontSize: 15,
                  fontWeight: 800,
                  cursor: saving ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {saving ? "Saving..." : "Complete setup"}
                {!saving && <ArrowRight size={16} />}
              </button>
            </form>
          )}
        </section>
      </main>

      <style jsx global>{`
        @media (max-width: 820px) {
          main {
            grid-template-columns: 1fr !important;
          }
          aside {
            min-height: auto !important;
          }
        }
        @media (max-width: 620px) {
          form div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
