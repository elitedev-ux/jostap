import { useEffect, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { useParams } from "react-router";
import {
  CARD_THEMES,
  EMPTY_CARD,
  getCard,
  updateCard,
} from "../../../../../utils/cardsStore";

const inputStyle = {
  width: "100%",
  padding: "9px 13px",
  borderRadius: 8,
  border: "1px solid #E5E7EB",
  fontSize: 14,
  color: "#111827",
  outline: "none",
  background: "#fff",
  boxSizing: "border-box",
};

function Field({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      <label
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: "#374151",
          display: "block",
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={inputStyle}
        onFocus={(e) => (e.target.style.borderColor = "#2563EB")}
        onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
      />
    </div>
  );
}

export default function EditCardPage() {
  const { id } = useParams();
  const [card, setCard] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadCard() {
      setLoaded(false);

      try {
        const found = await getCard(id);

        if (active) {
          setCard(found ? { ...EMPTY_CARD, ...found, title: found.title || found.role || "" } : null);
          setLoaded(true);
        }
      } catch {
        if (active) {
          setCard(null);
          setLoaded(true);
        }
      }
    }

    loadCard();

    return () => {
      active = false;
    };
  }, [id]);

  const update = (key, value) => setCard((current) => ({ ...current, [key]: value }));

  const handleSave = async () => {
    if (!card.name.trim() || !card.email.trim() || !card.slug.trim()) {
      setMessage("Name, email, and profile slug are required.");
      return;
    }

    try {
      await updateCard(id, { ...card, role: card.title });
      setMessage("Card updated.");
      window.setTimeout(() => {
        window.location.href = "/dashboard/cards";
      }, 500);
    } catch (error) {
      setMessage(error.message || "Unable to update this card.");
    }
  };

  if (!loaded) {
    return null;
  }

  if (!card) {
    return (
      <div className="ui-empty-state">
        <p className="ui-empty-state__title">Card not found</p>
        <p className="ui-empty-state__copy">
          This card may have been deleted. Return to My Cards to choose another card.
        </p>
        <a
          href="/dashboard/cards"
          style={{
            display: "inline-flex",
            marginTop: 18,
            fontSize: 14,
            fontWeight: 600,
            color: "#fff",
            textDecoration: "none",
            padding: "9px 18px",
            borderRadius: 9,
            background: "#2563EB",
          }}
        >
          Back to My Cards
        </a>
      </div>
    );
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <a
          href="/dashboard/cards"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontSize: 13,
            color: "#6B7280",
            textDecoration: "none",
          }}
        >
          <ArrowLeft size={14} /> My Cards
        </a>
        <span style={{ color: "#D1D5DB" }}>/</span>
        <span style={{ fontSize: 13, color: "#111827", fontWeight: 500 }}>
          Edit Card
        </span>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#111827",
              letterSpacing: "-0.02em",
              marginBottom: 3,
            }}
          >
            Edit Card
          </h1>
          <p style={{ fontSize: 14, color: "#6B7280" }}>
            Update your card details and save changes.
          </p>
        </div>
        <button
          onClick={handleSave}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            fontSize: 14,
            fontWeight: 600,
            color: "#fff",
            border: "none",
            padding: "9px 18px",
            borderRadius: 9,
            background: "#2563EB",
            cursor: "pointer",
          }}
        >
          <Save size={15} /> Save Changes
        </button>
      </div>

      {message && (
        <div
          style={{
            background: message.includes("required") ? "#FFFBEB" : "#ECFDF5",
            border: message.includes("required") ? "1px solid #FDE68A" : "1px solid #A7F3D0",
            color: message.includes("required") ? "#92400E" : "#047857",
            borderRadius: 10,
            padding: "11px 14px",
            fontSize: 13,
            fontWeight: 500,
            marginBottom: 18,
          }}
        >
          {message}
        </div>
      )}

      <div
        style={{
          background: "#fff",
          border: "1px solid #E5E7EB",
          borderRadius: 12,
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        <section>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 14 }}>
            Basic Info
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Full Name *" value={card.name} onChange={(v) => update("name", v)} />
            <Field label="Job Title" value={card.title} onChange={(v) => update("title", v)} />
            <Field label="Company" value={card.company} onChange={(v) => update("company", v)} />
            <Field
              label="Profile Slug *"
              value={card.slug}
              onChange={(v) => update("slug", v.toLowerCase().replace(/\s+/g, "-"))}
              placeholder="your-name"
            />
          </div>
          <div style={{ marginTop: 14 }}>
            <label
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "#374151",
                display: "block",
                marginBottom: 6,
              }}
            >
              Bio / About
            </label>
            <textarea
              value={card.bio || ""}
              onChange={(e) => update("bio", e.target.value)}
              rows={4}
              placeholder="Tell visitors about yourself..."
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>
        </section>

        <section>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 14 }}>
            Contact
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Email *" type="email" value={card.email} onChange={(v) => update("email", v)} />
            <Field label="Phone" value={card.phone} onChange={(v) => update("phone", v)} />
            <Field label="Website" value={card.website} onChange={(v) => update("website", v)} />
            <Field label="WhatsApp" value={card.whatsapp} onChange={(v) => update("whatsapp", v)} />
          </div>
        </section>

        <section>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 14 }}>
            Social Links
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="LinkedIn" value={card.linkedin} onChange={(v) => update("linkedin", v)} />
            <Field label="Twitter / X" value={card.twitter} onChange={(v) => update("twitter", v)} />
            <Field label="Instagram" value={card.instagram} onChange={(v) => update("instagram", v)} />
            <Field label="Portfolio" value={card.portfolio} onChange={(v) => update("portfolio", v)} />
          </div>
        </section>

        <section>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 14 }}>
            Design
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            {CARD_THEMES.map((theme) => (
              <button
                key={theme.name}
                onClick={() => update("template", theme.name)}
                style={{
                  cursor: "pointer",
                  borderRadius: 10,
                  overflow: "hidden",
                  border:
                    card.template === theme.name
                      ? "2px solid #2563EB"
                      : "2px solid transparent",
                  background: "#fff",
                  padding: 0,
                }}
              >
                <div
                  style={{
                    height: 50,
                    background: `linear-gradient(135deg,${theme.c1},${theme.c2})`,
                  }}
                />
                <div style={{ background: "#F9FAFB", padding: "6px 8px" }}>
                  <span style={{ fontSize: 11, color: "#374151", fontWeight: 600 }}>
                    {theme.name}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
