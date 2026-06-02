import {
  CreditCard,
  Download,
  Eye,
  Flag,
  QrCode,
  Search,
  UserMinus,
  UserRoundCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { downloadQrSvg } from "../../../components/QRCode";
import {
  cardQrUrl,
  displayCardUrl,
  publicCardUrl,
} from "../../../utils/publicUrl";

const statusColors = {
  Published: ["#ECFDF5", "#047857", "#A7F3D0"],
  Draft: ["#f5f5f5", "#6B7280", "#E5E7EB"],
  Paused: ["#FFFBEB", "#B45309", "#FDE68A"],
};

const assignmentColors = {
  assigned: ["#eaf3ff", "#0d6ffd", "#BFDBFE"],
  unassigned: ["#FFF7ED", "#C2410C", "#FED7AA"],
};

function userLabel(user) {
  return `${user.name || user.email}${user.email && user.name !== user.email ? ` (${user.email})` : ""}`;
}

export default function AdminCardsPage() {
  const [cards, setCards] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [query, setQuery] = useState("");
  const [assignmentFilter, setAssignmentFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("");
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
        setUsers(data.users || []);
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

  async function updateAssignment(card, userId) {
    setBusyId(card.id);
    setLoadError("");
    try {
      const response = await fetch(`/api/admin/cards/${card.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userId || null }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Unable to update card assignment.");
      await loadCards();
    } catch (error) {
      setLoadError(error.message || "Unable to update card assignment.");
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

  const filteredCards = useMemo(() => {
    const text = query.trim().toLowerCase();
    return cards.filter((card) => {
      if (assignmentFilter !== "all" && card.assignmentStatus !== assignmentFilter) return false;
      if (userFilter && card.userId !== userFilter) return false;
      if (!text) return true;

      return [card.name, card.owner, card.ownerEmail, card.slug, card.status, card.assignmentStatus]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(text));
    });
  }, [assignmentFilter, cards, query, userFilter]);

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", marginBottom: 4 }}>Cards</h1>
          <p style={{ fontSize: 14, color: "#6B7280" }}>
            Create, assign, reassign, publish, and monitor digital card records.
          </p>
        </div>
        <a
          href="/admin/cards/new"
          style={{ border: "none", background: "#0d6ffd", color: "#fff", borderRadius: 9, padding: "10px 15px", fontSize: 13, fontWeight: 800, cursor: "pointer" }}
        >
          Create card
        </a>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 14, marginBottom: 20 }}>
        {[
          ["Total Cards", stats.cards || 0, CreditCard, "#0d6ffd", "#eaf3ff"],
          ["Assigned", stats.assignedCards || 0, UserRoundCheck, "#047857", "#ECFDF5"],
          ["Unassigned", stats.unassignedCards || 0, UserMinus, "#C2410C", "#FFF7ED"],
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
        <div style={{ padding: 16, borderBottom: "1px solid #E5E7EB", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "1 1 240px", minWidth: 220 }}>
            <Search size={15} color="#9CA3AF" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search cards by owner, title, slug, or status..." style={{ border: "none", outline: "none", background: "transparent", flex: 1, fontSize: 13 }} />
          </div>
          <select value={assignmentFilter} onChange={(event) => setAssignmentFilter(event.target.value)} style={{ border: "1px solid #E5E7EB", borderRadius: 9, padding: "8px 10px", fontSize: 13, color: "#374151", background: "#fff" }}>
            <option value="all">All assignments</option>
            <option value="assigned">Assigned</option>
            <option value="unassigned">Unassigned</option>
          </select>
          <select value={userFilter} onChange={(event) => setUserFilter(event.target.value)} style={{ border: "1px solid #E5E7EB", borderRadius: 9, padding: "8px 10px", fontSize: 13, color: "#374151", background: "#fff", minWidth: 210 }}>
            <option value="">All user-owned cards</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {userLabel(user)}
              </option>
            ))}
          </select>
        </div>
        {loadError && <div style={{ background: "#FEF2F2", color: "#B91C1C", padding: 16, fontSize: 13, fontWeight: 700 }}>{loadError}</div>}
        {!loadError && filteredCards.length === 0 && (
          <div className="ui-empty-state" style={{ border: "none" }}>
            <p className="ui-empty-state__title">No cards found</p>
            <p className="ui-empty-state__copy">Adjust search or assignment filters to find cards.</p>
          </div>
        )}
        {filteredCards.map((card, index) => {
          const { name: title, owner, status, views, qrScans: scans, contactDownloads, slug, publicUrl, qrUrl } = card;
          const cardLink = publicUrl || (card.id ? publicCardUrl(card) : "");
          const qrValue = qrUrl || (card.id ? cardQrUrl(card) : "");
          const displayUrl = slug ? displayCardUrl(slug) : "";
          const [bg, color, border] = statusColors[status] || statusColors.Draft;
          const [assignmentBg, assignmentColor, assignmentBorder] = assignmentColors[card.assignmentStatus] || assignmentColors.unassigned;
          return (
            <div key={card.id} style={{ display: "grid", gridTemplateColumns: "1.3fr 1.1fr .8fr .7fr .7fr .7fr minmax(260px,auto)", gap: 16, alignItems: "center", padding: "15px 18px", borderTop: index ? "1px solid #F3F4F6" : "none" }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>{title}</p>
                {cardLink ? (
                  <a href={cardLink} title={cardLink} style={{ fontSize: 12, color: "#0d6ffd", fontWeight: 700, textDecoration: "none" }}>
                    {displayUrl}
                  </a>
                ) : (
                  <p style={{ fontSize: 12, color: "#6B7280" }}>No public link yet</p>
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 13, color: "#374151", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{owner}</p>
                <span style={{ display: "inline-flex", marginTop: 5, background: assignmentBg, color: assignmentColor, border: `1px solid ${assignmentBorder}`, borderRadius: 999, padding: "3px 8px", fontSize: 11, fontWeight: 800, textTransform: "capitalize" }}>
                  {card.assignmentStatus}
                </span>
              </div>
              <span style={{ justifySelf: "start", background: bg, color, border: `1px solid ${border}`, borderRadius: 999, padding: "3px 9px", fontSize: 12, fontWeight: 700 }}>{status}</span>
              <span style={{ fontSize: 13, color: "#111827", fontWeight: 700 }}>{views}</span>
              <span style={{ fontSize: 13, color: "#111827", fontWeight: 700 }}>{scans}</span>
              <span style={{ fontSize: 13, color: "#111827", fontWeight: 700 }}>{contactDownloads}</span>
              <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "flex-end", flexWrap: "wrap" }}>
                <select
                  value={card.userId || ""}
                  disabled={busyId === card.id}
                  onChange={(event) => updateAssignment(card, event.target.value)}
                  title="Assign or reassign card"
                  style={{ border: "1px solid #E5E7EB", background: "#fff", borderRadius: 8, height: 30, padding: "0 8px", fontSize: 12, fontWeight: 700, color: "#374151", maxWidth: 210 }}
                >
                  <option value="">Unassigned</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {userLabel(user)}
                    </option>
                  ))}
                </select>
                {card.userId && (
                  <button
                    title="Remove assignment"
                    onClick={() => updateAssignment(card, "")}
                    disabled={busyId === card.id}
                    style={{ border: "1px solid #FED7AA", background: "#FFF7ED", borderRadius: 8, height: 30, padding: "0 9px", display: "inline-flex", alignItems: "center", gap: 5, color: "#C2410C", cursor: busyId === card.id ? "wait" : "pointer", fontSize: 12, fontWeight: 800 }}
                  >
                    <UserMinus size={13} /> Unassign
                  </button>
                )}
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
