import { useState } from "react";
import {
  Zap,
  Phone,
  Mail,
  Globe,
  Linkedin,
  Twitter,
  Instagram,
  Save,
  Eye,
  Wifi,
  ArrowLeft,
  Upload,
  Palette,
  Type,
  LayoutTemplate,
  Share2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import QRCode from "../../../../components/QRCode";
import { CARD_THEMES, EMPTY_CARD, createCard } from "../../../../utils/cardsStore";

const THEMES = CARD_THEMES;

const SECTION_TABS = ["Basic Info", "Contact", "Social", "Design", "Sections"];

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

export default function NewCardPage() {
  const [tab, setTab] = useState("Basic Info");
  const [theme, setTheme] = useState(THEMES[0]);
  const [published, setPublished] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [card, setCard] = useState(EMPTY_CARD);
  const qrValue =
    typeof window !== "undefined"
      ? `${window.location.origin}/${card.slug || "your-slug"}`
      : `https://jostap.com/${card.slug || "your-slug"}`;

  const update = (k, v) => setCard((p) => ({ ...p, [k]: v }));
  const requiredComplete = Boolean(card.name.trim() && card.email.trim() && card.slug.trim());
  const handlePublish = async () => {
    if (!requiredComplete) {
      setSaveMessage("Add a name, email, and public slug before publishing.");
      return;
    }

    setSaving(true);
    setSaveMessage("");

    try {
      await createCard({ ...card, template: theme.name, title: card.title });
      setPublished(true);
      setSaveMessage("Card saved. Redirecting to My Cards...");
      window.setTimeout(() => {
        window.location.href = "/dashboard/cards";
      }, 500);
    } catch (error) {
      setSaveMessage(
        error.status === 401
          ? "Please sign in before publishing a card."
          : error.message || "Unable to save this card.",
      );
    } finally {
      setSaving(false);
    }
  };

  const CardPreview = () => (
    <div style={{ width: "100%", maxWidth: 280, margin: "0 auto" }}>
      <div
        style={{
          background: `linear-gradient(135deg,${theme.c1},${theme.c2})`,
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
        }}
      >
        {/* Banner */}
        <div
          style={{
            height: 80,
            background: `linear-gradient(135deg,${theme.c1},${theme.c2})`,
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -15,
              right: -15,
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.07)",
            }}
          />
        </div>
        <div
          style={{
            background: "#fff",
            padding: "0 20px 20px",
            borderRadius: "16px 16px 20px 20px",
            marginTop: -20,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: `linear-gradient(135deg,${theme.c1},${theme.c2})`,
              border: "3px solid #fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              fontWeight: 700,
              color: "#fff",
              marginTop: -28,
              marginBottom: 10,
            }}
          >
            {(card.name || "YN")
              .split(" ")
              .map((w) => w[0])
              .join("")
              .slice(0, 2) || "YN"}
          </div>
          <p
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: "#111827",
              marginBottom: 2,
            }}
          >
            {card.name || "Your Name"}
          </p>
          <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 2 }}>
            {card.title || "Your Title"}
          </p>
          <p style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 14 }}>
            {card.company || "Your Company"}
          </p>
          {card.bio && (
            <p
              style={{
                fontSize: 11,
                color: "#6B7280",
                lineHeight: 1.5,
                marginBottom: 14,
              }}
            >
              {card.bio.slice(0, 80)}
              {card.bio.length > 80 ? "..." : ""}
            </p>
          )}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 6,
              marginBottom: 10,
            }}
          >
            {[
              ["Call", "#059669"],
              ["Email", "#2563EB"],
            ].map(([l, c]) => (
              <div
                key={l}
                style={{
                  background: "#F9FAFB",
                  border: "1px solid #E5E7EB",
                  borderRadius: 7,
                  padding: "7px",
                  textAlign: "center",
                  fontSize: 11,
                  fontWeight: 500,
                  color: "#374151",
                }}
              >
                {l}
              </div>
            ))}
          </div>
          <div
            style={{
              background: theme.c1,
              borderRadius: 8,
              padding: "9px",
              textAlign: "center",
              fontSize: 12,
              fontWeight: 700,
              color: "#fff",
            }}
          >
            Book Meeting
          </div>
        </div>
      </div>
      <div style={{ marginTop: 12, textAlign: "center" }}>
        <div
          style={{
            display: "inline-flex",
            padding: 8,
            background: "#fff",
            border: "1px solid #E5E7EB",
            borderRadius: 10,
            marginBottom: 8,
            boxShadow: "0 8px 20px rgba(15,23,42,0.08)",
          }}
        >
          <QRCode value={qrValue} size={76} />
        </div>
        <br />
        <span
          style={{
            fontSize: 12,
            color: "#9CA3AF",
            background: "#F9FAFB",
            border: "1px solid #E5E7EB",
            borderRadius: 999,
            padding: "3px 10px",
          }}
        >
          jostap.com/{card.slug || "your-slug"}
        </span>
      </div>
    </div>
  );

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
          New Card
        </span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
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
            Card Builder
          </h1>
          <p style={{ fontSize: 14, color: "#6B7280" }}>
            Design your digital NFC card — preview updates in real time.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              fontWeight: 500,
              color: "#374151",
              background: "#fff",
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              padding: "8px 14px",
              cursor: "pointer",
            }}
          >
            <Eye size={13} /> Preview
          </button>
          <button
            onClick={handlePublish}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              fontWeight: 600,
              color: published ? "#059669" : "#fff",
              background: published ? "#ECFDF5" : "#2563EB",
              border: published ? "1px solid #A7F3D0" : "none",
              borderRadius: 8,
              padding: "8px 18px",
              cursor: saving ? "wait" : "pointer",
            }}
            disabled={saving}
          >
            <Save size={13} /> {saving ? "Saving..." : published ? "Saved" : "Publish Card"}
          </button>
        </div>
      </div>

      {saveMessage && (
        <div
          style={{
            background: published ? "#ECFDF5" : "#FFFBEB",
            border: published ? "1px solid #A7F3D0" : "1px solid #FDE68A",
            color: published ? "#047857" : "#92400E",
            borderRadius: 10,
            padding: "11px 14px",
            fontSize: 13,
            fontWeight: 500,
            marginBottom: 18,
          }}
        >
          {saveMessage}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 320px",
          gap: 24,
          alignItems: "flex-start",
        }}
      >
        {/* Editor */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #E5E7EB",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          {/* Tabs */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid #E5E7EB",
              overflowX: "auto",
            }}
          >
            {SECTION_TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  fontSize: 13,
                  fontWeight: tab === t ? 500 : 400,
                  padding: "13px 18px",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  color: tab === t ? "#111827" : "#6B7280",
                  borderBottom:
                    tab === t ? "2px solid #2563EB" : "2px solid transparent",
                  marginBottom: -1,
                }}
              >
                {t}
              </button>
            ))}
          </div>

          <div style={{ padding: "24px" }}>
            {tab === "Basic Info" && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
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
                    Full Name *
                  </label>
                  <input
                    value={card.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="Your name"
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = "#2563EB")}
                    onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
                  />
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 14,
                  }}
                >
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
                      Job Title
                    </label>
                    <input
                      value={card.title}
                      onChange={(e) => update("title", e.target.value)}
                      placeholder="VP of Product"
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = "#2563EB")}
                      onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
                    />
                  </div>
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
                      Company
                    </label>
                    <input
                      value={card.company}
                      onChange={(e) => update("company", e.target.value)}
                      placeholder="Arclite Inc."
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = "#2563EB")}
                      onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
                    />
                  </div>
                </div>
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
                    Bio / About
                  </label>
                  <textarea
                    value={card.bio}
                    onChange={(e) => update("bio", e.target.value)}
                    placeholder="Tell visitors about yourself..."
                    rows={4}
                    style={{ ...inputStyle, resize: "vertical" }}
                    onFocus={(e) => (e.target.style.borderColor = "#2563EB")}
                    onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
                  />
                </div>
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
                    Profile Slug *
                  </label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      border: "1px solid #E5E7EB",
                      borderRadius: 8,
                      overflow: "hidden",
                    }}
                  >
                    <span
                      style={{
                        padding: "9px 12px",
                        background: "#F9FAFB",
                        borderRight: "1px solid #E5E7EB",
                        fontSize: 13,
                        color: "#9CA3AF",
                        whiteSpace: "nowrap",
                      }}
                    >
                      jostap.com/
                    </span>
                    <input
                      value={card.slug}
                      onChange={(e) =>
                        update(
                          "slug",
                          e.target.value.toLowerCase().replace(/\s+/g, "-"),
                        )
                      }
                      placeholder="your-name"
                      style={{ ...inputStyle, border: "none", borderRadius: 0 }}
                    />
                  </div>
                </div>
                <div
                  style={{
                    background: "#F9FAFB",
                    border: "1px dashed #D1D5DB",
                    borderRadius: 10,
                    padding: "20px",
                    textAlign: "center",
                    cursor: "pointer",
                  }}
                >
                  <Upload
                    size={20}
                    color="#9CA3AF"
                    style={{ margin: "0 auto 8px" }}
                  />
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: "#374151",
                      marginBottom: 2,
                    }}
                  >
                    Upload Profile Photo
                  </p>
                  <p style={{ fontSize: 11, color: "#9CA3AF" }}>
                    PNG or JPG, max 2MB
                  </p>
                </div>
              </div>
            )}

            {tab === "Contact" && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                {[
                  ["Phone", "phone", "phone", "+1 (555) 123-4567"],
                  ["Email", "email", "email", "you@company.com"],
                  ["Website", "website", "url", "https://yoursite.com"],
                  ["WhatsApp", "whatsapp", "tel", "+1 (555) 123-4567"],
                ].map(([label, key, type, ph]) => (
                  <div key={key}>
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
                      value={card[key]}
                      onChange={(e) => update(key, e.target.value)}
                      placeholder={ph}
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = "#2563EB")}
                      onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
                    />
                  </div>
                ))}
              </div>
            )}

            {tab === "Social" && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                {[
                  ["LinkedIn", "linkedin", "linkedin.com/in/yourname"],
                  ["Twitter / X", "twitter", "@yourhandle"],
                  ["Instagram", "instagram", "@yourhandle"],
                  ["Portfolio", "portfolio", "https://yourportfolio.com"],
                ].map(([label, key, ph]) => (
                  <div key={key}>
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
                      value={card[key]}
                      onChange={(e) => update(key, e.target.value)}
                      placeholder={ph}
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = "#2563EB")}
                      onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
                    />
                  </div>
                ))}
              </div>
            )}

            {tab === "Design" && (
              <div>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#374151",
                    marginBottom: 14,
                  }}
                >
                  Select Template
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3,1fr)",
                    gap: 10,
                  }}
                >
                  {THEMES.map((t) => (
                    <div
                      key={t.name}
                      onClick={() => setTheme(t)}
                      style={{
                        cursor: "pointer",
                        borderRadius: 10,
                        overflow: "hidden",
                        border:
                          theme.name === t.name
                            ? "2px solid #2563EB"
                            : "2px solid transparent",
                        outline:
                          theme.name === t.name ? "2px solid #EFF6FF" : "none",
                      }}
                    >
                      <div
                        style={{
                          height: 50,
                          background: `linear-gradient(135deg,${t.c1},${t.c2})`,
                        }}
                      />
                      <div
                        style={{
                          background: "#F9FAFB",
                          padding: "6px 8px",
                          textAlign: "center",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            color: "#374151",
                            fontWeight: theme.name === t.name ? 600 : 400,
                          }}
                        >
                          {t.name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "Sections" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {[
                  [
                    "showServices",
                    "Services",
                    "Show a services/offerings section",
                  ],
                  [
                    "showTestimonials",
                    "Testimonials",
                    "Display client testimonials",
                  ],
                  ["showGallery", "Gallery", "Image and video gallery"],
                  ["showFaq", "FAQ", "Frequently asked questions"],
                ].map(([key, label, desc]) => (
                  <div
                    key={key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "16px 0",
                      borderBottom: "1px solid #F3F4F6",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontSize: 14,
                          fontWeight: 500,
                          color: "#111827",
                          marginBottom: 2,
                        }}
                      >
                        {label}
                      </p>
                      <p style={{ fontSize: 13, color: "#6B7280" }}>{desc}</p>
                    </div>
                    <div
                      onClick={() => update(key, !card[key])}
                      style={{
                        width: 42,
                        height: 24,
                        borderRadius: 12,
                        cursor: "pointer",
                        background: card[key] ? "#2563EB" : "#E5E7EB",
                        position: "relative",
                        transition: "background 0.2s",
                        flexShrink: 0,
                      }}
                    >
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          background: "#fff",
                          position: "absolute",
                          top: 3,
                          left: card[key] ? 21 : 3,
                          transition: "left 0.2s",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Preview */}
        <div style={{ position: "sticky", top: 80 }}>
          <div
            style={{
              background: "#F9FAFB",
              border: "1px solid #E5E7EB",
              borderRadius: 12,
              padding: "24px",
            }}
          >
            <p
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#9CA3AF",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                textAlign: "center",
                marginBottom: 20,
              }}
            >
              Live Preview
            </p>
            <CardPreview />
          </div>
        </div>
      </div>
    </>
  );
}
