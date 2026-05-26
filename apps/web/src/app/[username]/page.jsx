import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import {
  Phone,
  Mail,
  Globe,
  Linkedin,
  Twitter,
  Instagram,
  Download,
  Share2,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Wifi,
  Check,
  BriefcaseBusiness,
} from "lucide-react";
import { CARD_THEMES, getPublicCard } from "../../utils/cardsStore";

function initialsFor(name) {
  return (
    (name || "Card")
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2) || "C"
  );
}

function normalizeUrl(value) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

function normalizeWhatsapp(value) {
  return String(value || "").replace(/[^\d]/g, "");
}

function ContactBtn({ icon: Icon, label, href, color }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : "_self"}
      rel="noreferrer"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "13px 18px",
        borderRadius: 10,
        border: "1px solid #E5E7EB",
        background: "#fff",
        fontSize: 14,
        fontWeight: 500,
        color: "#374151",
        textDecoration: "none",
        flex: 1,
        minWidth: 140,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#D1D5DB";
        e.currentTarget.style.background = "#F9FAFB";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#E5E7EB";
        e.currentTarget.style.background = "#fff";
      }}
    >
      <Icon size={16} color={color || "#6B7280"} />
      {label}
    </a>
  );
}

function SocialLink({ icon: Icon, label, handle, href, color }) {
  if (!handle || !href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        borderRadius: 10,
        border: "1px solid #E5E7EB",
        background: "#fff",
        textDecoration: "none",
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 8,
          background: `${color}18`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={16} color={color} />
      </div>
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
          {label}
        </p>
        <p style={{ fontSize: 12, color: "#9CA3AF" }}>{handle}</p>
      </div>
      <ExternalLink size={13} color="#D1D5DB" style={{ marginLeft: "auto" }} />
    </a>
  );
}

export default function PublicProfilePage() {
  const { username } = useParams();
  const [card, setCard] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [showFull, setShowFull] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;

    async function loadCard() {
      try {
        const found = await getPublicCard(username);

        if (active) {
          setCard(found || null);
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
  }, [username]);

  const theme = useMemo(
    () => CARD_THEMES.find((item) => item.name === card?.template) || CARD_THEMES[0],
    [card],
  );
  const title = card?.title || card?.role || "";
  const profileUrl =
    typeof window !== "undefined" ? `${window.location.origin}/${username}` : "";
  const bio = card?.bio || "";
  const bioShort = bio.length > 130 ? `${bio.slice(0, 130)}...` : bio;
  const whatsapp = normalizeWhatsapp(card?.whatsapp || card?.phone);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${card.name} - Digital Business Card`,
          text: [title, card.company].filter(Boolean).join(" at "),
          url: profileUrl,
        });
        setNotice("Profile shared successfully.");
        return;
      }
      await navigator.clipboard.writeText(profileUrl);
      setNotice("Profile link copied.");
    } catch {
      setNotice("Profile is ready to share.");
    }
  };

  const handleSaveContact = () => {
    const vcard = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `FN:${card.name || ""}`,
      `ORG:${card.company || ""}`,
      `TITLE:${title}`,
      `TEL:${card.phone || ""}`,
      `EMAIL:${card.email || ""}`,
      `URL:${card.website || card.portfolio || ""}`,
      "END:VCARD",
    ].join("\n");
    const blob = new Blob([vcard], { type: "text/vcard" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${card.slug || "contact"}.vcf`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice("Contact downloaded.");
  };

  if (!loaded) {
    return null;
  }

  if (!card) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#F9FAFB",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          fontFamily: "'Inter',-apple-system,sans-serif",
        }}
      >
        <div className="ui-empty-state" style={{ maxWidth: 460 }}>
          <p className="ui-empty-state__title">Card not found</p>
          <p className="ui-empty-state__copy">
            This card has not been created yet, or its public slug was changed.
          </p>
          <a
            href="/dashboard/cards/new"
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
            Create Card
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#F9FAFB",
        fontFamily: "'Inter',-apple-system,sans-serif",
      }}
    >
      <head>
        <title>{card.name} - Digital Business Card</title>
        <meta name="description" content={[title, card.company, bio].filter(Boolean).join(". ")} />
      </head>

      <div
        style={{
          maxWidth: 480,
          margin: "0 auto",
          minHeight: "100vh",
          background: "#fff",
          position: "relative",
        }}
      >
        <div
          style={{
            height: 140,
            background: `linear-gradient(135deg,${theme.color1},${theme.color2})`,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -30,
              right: -30,
              width: 160,
              height: 160,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.07)",
            }}
          />
          <div style={{ position: "absolute", top: 16, left: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11,
                color: "rgba(255,255,255,0.76)",
                background: "rgba(255,255,255,0.12)",
                borderRadius: 999,
                padding: "3px 9px",
              }}
            >
              <Wifi size={10} /> NFC Card
            </div>
          </div>
          <button
            onClick={handleShare}
            aria-label="Share profile"
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              width: 34,
              height: 34,
              borderRadius: 8,
              background: "rgba(255,255,255,0.15)",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Share2 size={15} color="#fff" />
          </button>
        </div>

        <div style={{ padding: "0 22px", position: "relative" }}>
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: "50%",
              background: `linear-gradient(135deg,${theme.color1},${theme.color2})`,
              border: "4px solid #fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
              fontWeight: 700,
              color: "#fff",
              marginTop: -42,
              marginBottom: 14,
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}
          >
            {initialsFor(card.name)}
          </div>

          <h1
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: "#111827",
              marginBottom: 3,
            }}
          >
            {card.name}
          </h1>
          {title && (
            <p style={{ fontSize: 15, color: "#6B7280", marginBottom: 4 }}>
              {title}
            </p>
          )}
          {card.company && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                fontSize: 13,
                fontWeight: 600,
                color: "#374151",
                marginBottom: 16,
              }}
            >
              <BriefcaseBusiness size={13} /> {card.company}
            </div>
          )}

          {notice && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "#ECFDF5",
                border: "1px solid #A7F3D0",
                color: "#047857",
                borderRadius: 10,
                padding: "10px 12px",
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 16,
              }}
            >
              <Check size={15} /> {notice}
            </div>
          )}

          {bio && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.65 }}>
                {showFull ? bio : bioShort}
              </p>
              {bio.length > 130 && (
                <button
                  onClick={() => setShowFull(!showFull)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    color: "#2563EB",
                    fontWeight: 500,
                    padding: "4px 0",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  {showFull ? (
                    <>
                      <ChevronUp size={13} /> Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown size={13} /> Read more
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              marginBottom: 24,
            }}
          >
            <ContactBtn
              icon={Phone}
              label="Call"
              href={card.phone ? `tel:${card.phone}` : ""}
              color="#059669"
            />
            <ContactBtn
              icon={MessageCircle}
              label="WhatsApp"
              href={whatsapp ? `https://wa.me/${whatsapp}` : ""}
              color="#25D366"
            />
            <ContactBtn
              icon={Mail}
              label="Email"
              href={card.email ? `mailto:${card.email}` : ""}
              color="#2563EB"
            />
            <ContactBtn
              icon={Globe}
              label="Website"
              href={normalizeUrl(card.website)}
              color="#7C3AED"
            />
          </div>

          <button
            onClick={handleSaveContact}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 10,
              border: "1px solid #E5E7EB",
              cursor: "pointer",
              background: "#fff",
              color: "#374151",
              fontSize: 14,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginBottom: 28,
            }}
          >
            <Download size={15} color="#6B7280" /> Save Contact
          </button>

          <div style={{ marginBottom: 28 }}>
            <p
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#9CA3AF",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 12,
              }}
            >
              Connect
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <SocialLink
                icon={Linkedin}
                label="LinkedIn"
                handle={card.linkedin}
                href={card.linkedin ? normalizeUrl(`linkedin.com/in/${card.linkedin}`) : ""}
                color="#0A66C2"
              />
              <SocialLink
                icon={Twitter}
                label="Twitter / X"
                handle={card.twitter}
                href={card.twitter ? normalizeUrl(`x.com/${card.twitter.replace(/^@/, "")}`) : ""}
                color="#111827"
              />
              <SocialLink
                icon={Instagram}
                label="Instagram"
                handle={card.instagram}
                href={
                  card.instagram
                    ? normalizeUrl(`instagram.com/${card.instagram.replace(/^@/, "")}`)
                    : ""
                }
                color="#E1306C"
              />
              <SocialLink
                icon={Globe}
                label="Portfolio"
                handle={card.portfolio}
                href={normalizeUrl(card.portfolio)}
                color="#7C3AED"
              />
            </div>
          </div>

          <div
            style={{
              borderTop: "1px solid #F3F4F6",
              paddingTop: 20,
              paddingBottom: 40,
              textAlign: "center",
            }}
          >
            <a
              href="/"
              style={{
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span style={{ fontSize: 12, color: "#9CA3AF" }}>Powered by</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#2563EB" }}>
                JOSTAP NFC
              </span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
