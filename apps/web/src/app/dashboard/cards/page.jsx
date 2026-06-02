import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Eye,
  Pencil,
  Copy,
  Trash2,
  Download,
  Wifi,
  QrCode,
  ExternalLink,
  MoreVertical,
  Search,
  Filter,
} from "lucide-react";
import QRCode, { downloadQrSvg } from "../../../components/QRCode";
import {
  CARD_THEMES,
  deleteCard,
  duplicateCard,
  getCards,
} from "../../../utils/cardsStore";
import {
  cardProfileUrl,
  cardQrUrl,
  displayCardUrl,
} from "../../../utils/publicUrl";

const DOWNLOADABLE_QR_PLANS = new Set(["jostap_nfc", "custom_nfc", "premium_renewal"]);

function hasDownloadableQr(plan) {
  return DOWNLOADABLE_QR_PLANS.has(String(plan || "").toLowerCase());
}

function CardPreview({ card }) {
  const theme = CARD_THEMES.find((item) => item.name === card.template) || CARD_THEMES[0];
  const initials =
    (card.name || "Card")
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2) || "C";

  return (
    <div
      style={{
        width: "100%",
        aspectRatio: "1.6/1",
        background: `linear-gradient(135deg,${theme.color1},${theme.color2})`,
        borderRadius: 12,
        padding: 12,
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
        boxShadow: "0 10px 24px rgba(15,23,42,0.14)",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -34,
          right: -20,
          width: 110,
          height: 110,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.12)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "46%",
          background: "linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0))",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          minWidth: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.18)",
              border: "1px solid rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 800,
              color: "#fff",
              textTransform: "uppercase",
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div
            style={{
              width: 23,
              height: 23,
              borderRadius: 7,
              background: "rgba(255,255,255,0.16)",
              border: "1px solid rgba(255,255,255,0.16)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Wifi size={11} color="rgba(255,255,255,0.88)" />
          </div>
        </div>

        <div style={{ minWidth: 0 }}>
          <p
            style={{
              fontSize: 12,
              lineHeight: 1.2,
              fontWeight: 800,
              color: "#fff",
              marginBottom: 3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: 152,
            }}
          >
            {card.name || "Untitled Card"}
          </p>
          <p
            style={{
              fontSize: 10,
              lineHeight: 1.25,
              color: "rgba(255,255,255,0.78)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: 154,
            }}
          >
            {[card.role || card.title || "No title", card.company].filter(Boolean).join(" - ")}
          </p>
        </div>
      </div>
    </div>
  );
}

function CardRow({ card, onChange, qrLocked }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [actionError, setActionError] = useState("");
  const [copied, setCopied] = useState(false);
  const role = card.role || card.title || "No title";
  const company = card.company || "No company";
  const publicUrl = cardProfileUrl(card.slug);
  const qrValue = card.qrUrl || cardQrUrl(card);
  const displayUrl = displayCardUrl(card.slug);

  const copyPublicUrl = async () => {
    await navigator.clipboard?.writeText(publicUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1300);
  };

  const handleDownloadQr = () => {
    if (qrLocked) {
      window.location.href = "/pricing";
      return;
    }

    downloadQrSvg(qrValue, `${card.slug || "card"}-qr-code`);
  };

  const runAction = async (action) => {
    setMenuOpen(false);
    setActionError("");

    try {
      await action();
      await onChange();
    } catch (error) {
      setActionError(error.message || "Unable to complete this action.");
    }
  };

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #E5E7EB",
        borderRadius: 12,
        padding: 20,
        display: "grid",
        gridTemplateColumns: "190px minmax(260px,1fr) 132px auto",
        gap: 18,
        alignItems: "start",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#D1D5DB")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#E5E7EB")}
    >
      <div style={{ width: 190 }}>
        <CardPreview card={card} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 8,
            gap: 8,
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 3,
              }}
            >
              <h3 style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>
                {card.name || "Untitled Card"}
              </h3>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  borderRadius: 999,
                  padding: "2px 8px",
                  background: card.active ? "#ECFDF5" : "#F3F4F6",
                  color: card.active ? "#059669" : "#6B7280",
                  border: card.active ? "1px solid #A7F3D0" : "1px solid #E5E7EB",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: card.active ? "#059669" : "#9CA3AF",
                    display: "inline-block",
                  }}
                />
                {card.active ? "Published" : "Draft"}
              </span>
            </div>
            <p style={{ fontSize: 13, color: "#6B7280" }}>
              {role} - {company}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: 20, marginBottom: 14 }}>
          {[
            [Eye, card.views || 0, "views"],
            [Wifi, card.taps || 0, "NFC taps"],
            [QrCode, card.qr || 0, "QR scans"],
          ].map(([Icon, value, label]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Icon size={13} color="#9CA3AF" />
              <div>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
                  {Number(value).toLocaleString()}{" "}
                </span>
                <span style={{ fontSize: 12, color: "#9CA3AF" }}>{label}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {[card.template, `Created ${card.created || "today"}`].map((label) => (
              <span
                key={label}
                style={{
                  fontSize: 11,
                  color: "#9CA3AF",
                  background: "#f5f5f5",
                  border: "1px solid #E5E7EB",
                  borderRadius: 999,
                  padding: "3px 10px",
                }}
              >
                {label}
              </span>
          ))}
        </div>
        {actionError && (
          <p style={{ fontSize: 12, color: "#DC2626", marginTop: 8 }}>
            {actionError}
          </p>
        )}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          padding: 10,
          border: "1px solid #E5E7EB",
          borderRadius: 10,
          background: "#f5f5f5",
          width: 132,
        }}
      >
        <div
          style={{
            padding: 6,
            borderRadius: 8,
            background: "#fff",
            border: "1px solid #E5E7EB",
            filter: qrLocked ? "blur(3px)" : "none",
            opacity: qrLocked ? 0.52 : 1,
            transition: "filter 0.2s, opacity 0.2s",
          }}
        >
          <QRCode value={qrValue} size={58} />
        </div>
        <button
          type="button"
          onClick={copyPublicUrl}
          title={publicUrl}
          style={{
            maxWidth: "100%",
            fontSize: 11,
            color: copied ? "#047857" : "#0d6ffd",
            background: "#fff",
            border: copied ? "1px solid #A7F3D0" : "1px solid #BFDBFE",
            borderRadius: 999,
            padding: "3px 8px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            cursor: "pointer",
          }}
        >
          {copied ? "Copied" : displayUrl}
        </button>
        <button
          onClick={handleDownloadQr}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            width: "100%",
            fontSize: 12,
            fontWeight: 600,
            color: "#0d6ffd",
            background: "#eaf3ff",
            border: "1px solid #BFDBFE",
            borderRadius: 7,
            padding: "6px 8px",
            cursor: "pointer",
          }}
        >
          <Download size={12} /> {qrLocked ? "Upgrade" : "QR"}
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
        <a
          href={publicUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: 12,
            fontWeight: 500,
            color: "#6B7280",
            textDecoration: "none",
            background: "#f5f5f5",
            border: "1px solid #E5E7EB",
            borderRadius: 7,
            padding: "5px 10px",
            whiteSpace: "nowrap",
          }}
        >
          <ExternalLink size={12} /> Preview
        </a>
        <a
          href={`/dashboard/cards/${card.id}/edit`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: 12,
            fontWeight: 500,
            color: "#0d6ffd",
            textDecoration: "none",
            background: "#eaf3ff",
            border: "1px solid #BFDBFE",
            borderRadius: 7,
            padding: "5px 10px",
            whiteSpace: "nowrap",
          }}
        >
          <Pencil size={12} /> Edit
        </a>
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              background: "#f5f5f5",
              border: "1px solid #E5E7EB",
              borderRadius: 7,
              padding: "5px 8px",
              cursor: "pointer",
              display: "flex",
            }}
          >
            <MoreVertical size={14} color="#6B7280" />
          </button>
          {menuOpen && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: 4,
                background: "#fff",
                border: "1px solid #E5E7EB",
                borderRadius: 9,
                padding: "4px",
                zIndex: 10,
                minWidth: 140,
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              }}
            >
              {[
                ["Duplicate", Copy, "#374151", () => duplicateCard(card.id)],
                [
                  "Copy Link",
                  QrCode,
                  "#374151",
                  () => navigator.clipboard?.writeText(publicUrl),
                ],
                [
                  "Download QR",
                  Download,
                  "#374151",
                  handleDownloadQr,
                ],
                ["Delete", Trash2, "#DC2626", () => deleteCard(card.id)],
              ].map(([label, Icon, color, action]) => (
                <button
                  key={label}
                  onClick={() => runAction(action)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                    padding: "8px 12px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    color,
                    borderRadius: 6,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f5")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CardsPage() {
  const [cards, setCards] = useState([]);
  const [search, setSearch] = useState("");
  const [loadError, setLoadError] = useState("");
  const [qrLocked, setQrLocked] = useState(true);

  const refreshCards = async () => {
    try {
      setCards(await getCards());
      setLoadError("");
    } catch (error) {
      setCards([]);
      setLoadError(error.message || "Unable to load cards.");
    }
  };

  useEffect(() => {
    async function loadBillingPlan() {
      try {
        const response = await fetch("/api/billing", { credentials: "same-origin" });
        const data = await response.json().catch(() => ({}));
        if (response.ok) setQrLocked(!hasDownloadableQr(data.subscription?.plan));
      } catch {
        setQrLocked(true);
      }
    }

    refreshCards();
    loadBillingPlan();
    window.addEventListener("jostap-cards-change", refreshCards);
    return () => window.removeEventListener("jostap-cards-change", refreshCards);
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return cards;
    return cards.filter((card) =>
      [card.name, card.role, card.title, card.company, card.template, card.slug].some((field) =>
        String(field || "").toLowerCase().includes(query),
      ),
    );
  }, [cards, search]);

  const hasCards = cards.length > 0;

  return (
    <>
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
            My Cards
          </h1>
          <p style={{ fontSize: 14, color: "#6B7280" }}>
            {cards.length} cards created. Start with a blank card and publish when ready.
          </p>
        </div>
        <a
          href="/create-card"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            fontSize: 14,
            fontWeight: 600,
            color: "#fff",
            textDecoration: "none",
            padding: "9px 18px",
            borderRadius: 9,
            background: "#0d6ffd",
          }}
        >
          <Plus size={15} /> New Card
        </a>
      </div>

      {hasCards && (
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#fff",
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              padding: "8px 12px",
              flex: 1,
              maxWidth: 280,
            }}
          >
            <Search size={14} color="#9CA3AF" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search cards..."
              style={{
                border: "none",
                background: "transparent",
                fontSize: 13,
                outline: "none",
                width: "100%",
                color: "#374151",
              }}
            />
          </div>
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
            <Filter size={13} /> Filter
          </button>
        </div>
      )}

      {loadError && (
        <div
          style={{
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: 10,
            color: "#B91C1C",
            fontSize: 13,
            fontWeight: 500,
            padding: "11px 14px",
            marginBottom: 18,
          }}
        >
          {loadError}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {filtered.map((card) => (
          <CardRow
            key={card.id}
            card={card}
            onChange={refreshCards}
            qrLocked={qrLocked}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="ui-empty-state">
          <div className="ui-empty-state__icon">
            <Search size={18} />
          </div>
          <p className="ui-empty-state__title">
            {hasCards ? "No cards found" : "No cards yet"}
          </p>
          <p className="ui-empty-state__copy">
            {hasCards
              ? "Try searching by card name, company, template, or public URL slug."
              : "Create your first digital card. New cards will appear here after publishing."}
          </p>
          {!hasCards && (
            <a
              href="/create-card"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                marginTop: 18,
                fontSize: 14,
                fontWeight: 600,
                color: "#fff",
                textDecoration: "none",
                padding: "9px 18px",
                borderRadius: 9,
                background: "#0d6ffd",
              }}
            >
              <Plus size={15} /> Create Card
            </a>
          )}
        </div>
      )}
    </>
  );
}
