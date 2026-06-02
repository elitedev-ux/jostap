import { CheckCircle2, CreditCard, Download, Eye, Flag, QrCode, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { downloadQrSvg } from "../../../components/QRCode";

const statusColors = {
  Published: ["#ECFDF5", "#047857", "#A7F3D0"],
  Draft: ["#f5f5f5", "#6B7280", "#E5E7EB"],
  Paused: ["#FFFBEB", "#B45309", "#FDE68A"],
};

export default function AdminCardsPage() {
  const [cards, setCards] = useState([]);
  const [stats, setStats] = useState({});
  const [query, setQuery] = useState("");
  const [loadError, setLoadError] = useState("");
  const [busyId, setBusyId] = useState("");

  async function loadCards(active = true) {
    setLoadError("");
    try {
      const response = await fetch("/api/admin/overview", { credentials: "same-origin" });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) throw new Error(data.error || "Unable to load cards.");
      if (active) {
        setCards(data.cards || []);
        setStats(data.stats || {});
      }
    } catch (error) {
      if (active) setLoadError(error.message || "Unable to load cards.");
    }
  }

  async function toggleCard(card) {
    setBusyId(card.id);
    setLoadError("");
    try {
      const response = await fetch(`/api/admin/cards/${card.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !card.active }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Unable to update card.");
      await loadCards();
    } catch (error) {
      setLoadError(error.message || "Unable to update card.");
    } finally {
      setBusyId("");
    }
  }

  useEffect(() => {
    let active = true;
    loadCards(active);

    return () => {
      active = false;
    };
  }, []);

  const filteredCards = useMemo(
    () =>
      cards.filter((card) =>
        [card.name, card.owner, card.slug, card.status]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query.toLowerCase())),
      ),
    [cards, query],
  );

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", marginBottom: 4 }}>Cards</h1>
        <p style={{ fontSize: 14, color: "#6B7280" }}>Review digital profiles, QR activity, publication state, and moderation flags.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 14, marginBottom: 20 }}>
        {[
          ["Total Cards", stats.cards || 0, CreditCard, "#0d6ffd", "#eaf3ff"],
          ["Published", stats.activeCards || 0, CheckCircle2, "#059669", "#ECFDF5"],
          ["QR Scans", stats.qrScans || 0, QrCode, "#ff9f0d", "#F5F3FF"],
          ["Contact Downloads", stats.contactDownloads || 0, Flag, "#D97706", "#FFFBEB"],
        ].map(([label, value, Icon, color, bg]) => (
          <div key={label} style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: 18 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <Icon size={16} color={color} />
            </div>
            <p style={{ fontSize: 23, fontWeight: 800, color: "#111827" }}>{value}</p>
            <p style={{ fontSize: 12, color: "#6B7280" }}>{label}</p>
          </div>
        ))}
      </div>

      <section style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: 16, borderBottom: "1px solid #E5E7EB", display: "flex", alignItems: "center", gap: 10 }}>
          <Search size={15} color="#9CA3AF" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search cards by owner, title, or status..." style={{ border: "none", outline: "none", background: "transparent", flex: 1, fontSize: 13 }} />
        </div>
        {loadError && <div style={{ background: "#FEF2F2", color: "#B91C1C", padding: 16, fontSize: 13, fontWeight: 700 }}>{loadError}</div>}
        {!loadError && filteredCards.length === 0 && (
          <div className="ui-empty-state" style={{ border: "none" }}>
            <p className="ui-empty-state__title">No cards yet</p>
            <p className="ui-empty-state__copy">Card records will appear here when users publish digital cards.</p>
          </div>
        )}
        {filteredCards.map((card, index) => {
          const { name: title, owner, status, views, qrScans: scans, contactDownloads, slug, publicUrl } = card;
          const cardLink = publicUrl || (slug ? `/${slug}` : "");
          const qrValue =
            cardLink && typeof window !== "undefined" && cardLink.startsWith("/")
              ? `${window.location.origin}${cardLink}`
              : cardLink;
          const [bg, color, border] = statusColors[status];
          return (
            <div key={card.id} style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr .8fr .7fr .7fr .7fr auto", gap: 16, alignItems: "center", padding: "15px 18px", borderTop: index ? "1px solid #F3F4F6" : "none" }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>{title}</p>
                {cardLink ? (
                  <a href={cardLink} title={cardLink} style={{ fontSize: 12, color: "#0d6ffd", fontWeight: 700, textDecoration: "none" }}>
                    jostap.com/{slug}
                  </a>
                ) : (
                  <p style={{ fontSize: 12, color: "#6B7280" }}>No public link yet</p>
                )}
              </div>
              <p style={{ fontSize: 13, color: "#374151", fontWeight: 600 }}>{owner}</p>
              <span style={{ justifySelf: "start", background: bg, color, border: `1px solid ${border}`, borderRadius: 999, padding: "3px 9px", fontSize: 12, fontWeight: 700 }}>{status}</span>
              <span style={{ fontSize: 13, color: "#111827", fontWeight: 700 }}>{views}</span>
              <span style={{ fontSize: 13, color: "#111827", fontWeight: 700 }}>{scans}</span>
              <span style={{ fontSize: 13, color: "#111827", fontWeight: 700 }}>{contactDownloads}</span>
              <div style={{ display: "flex", gap: 8 }}>
                {cardLink && <a href={cardLink} title="Preview" style={{ border: "1px solid #E5E7EB", background: "#fff", borderRadius: 8, width: 30, height: 30, display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#374151" }}><Eye size={14} /></a>}
                {qrValue && (
                  <button
                    title="Download QR code"
                    onClick={() => downloadQrSvg(qrValue, `${slug || "card"}-qr-code`)}
                    style={{ border: "1px solid #E5E7EB", background: "#fff", borderRadius: 8, height: 30, padding: "0 10px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, color: "#374151", cursor: "pointer", fontSize: 12, fontWeight: 800, whiteSpace: "nowrap" }}
                  >
                    <Download size={13} /> QR
                  </button>
                )}
                <button
                  title={card.active ? "Deactivate card" : "Activate card"}
                  onClick={() => toggleCard(card)}
                  disabled={busyId === card.id}
                  style={{ border: "1px solid #E5E7EB", background: "#fff", borderRadius: 8, padding: "0 10px", height: 30, fontSize: 12, fontWeight: 800, color: card.active ? "#DC2626" : "#047857", cursor: busyId === card.id ? "wait" : "pointer" }}
                >
                  {busyId === card.id ? "Saving" : card.active ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          );
        })}
      </section>
    </>
  );
}
