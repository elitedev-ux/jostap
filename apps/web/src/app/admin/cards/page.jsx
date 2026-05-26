import { CheckCircle2, CreditCard, Eye, Flag, MoreVertical, QrCode, Search } from "lucide-react";

const cards = [];

const statusColors = {
  Published: ["#ECFDF5", "#047857", "#A7F3D0"],
  Draft: ["#F9FAFB", "#6B7280", "#E5E7EB"],
  Paused: ["#FFFBEB", "#B45309", "#FDE68A"],
};

export default function AdminCardsPage() {
  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", marginBottom: 4 }}>Cards</h1>
        <p style={{ fontSize: 14, color: "#6B7280" }}>Review digital profiles, QR activity, publication state, and moderation flags.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 14, marginBottom: 20 }}>
        {[
          ["Total Cards", "0", CreditCard, "#2563EB", "#EFF6FF"],
          ["Published", "0", CheckCircle2, "#059669", "#ECFDF5"],
          ["QR Scans", "0", QrCode, "#7C3AED", "#F5F3FF"],
          ["Needs Review", "0", Flag, "#D97706", "#FFFBEB"],
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
          <input placeholder="Search cards by owner, title, or status..." style={{ border: "none", outline: "none", background: "transparent", flex: 1, fontSize: 13 }} />
        </div>
        {cards.length === 0 && (
          <div className="ui-empty-state" style={{ border: "none" }}>
            <p className="ui-empty-state__title">No cards yet</p>
            <p className="ui-empty-state__copy">Card records will appear here when the backend is connected.</p>
          </div>
        )}
        {cards.map(([title, owner, status, views, scans, flag], index) => {
          const [bg, color, border] = statusColors[status];
          return (
            <div key={title} style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr .8fr .7fr .7fr auto", gap: 16, alignItems: "center", padding: "15px 18px", borderTop: index ? "1px solid #F3F4F6" : "none" }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>{title}</p>
                <p style={{ fontSize: 12, color: "#6B7280" }}>Public profile card</p>
              </div>
              <p style={{ fontSize: 13, color: "#374151", fontWeight: 600 }}>{owner}</p>
              <span style={{ justifySelf: "start", background: bg, color, border: `1px solid ${border}`, borderRadius: 999, padding: "3px 9px", fontSize: 12, fontWeight: 700 }}>{status}</span>
              <span style={{ fontSize: 13, color: "#111827", fontWeight: 700 }}>{views}</span>
              <span style={{ fontSize: 13, color: "#111827", fontWeight: 700 }}>{scans}</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button title="Preview" style={{ border: "1px solid #E5E7EB", background: "#fff", borderRadius: 8, width: 30, height: 30 }}><Eye size={14} /></button>
                <button title={flag} style={{ border: "1px solid #E5E7EB", background: "#fff", borderRadius: 8, width: 30, height: 30 }}><MoreVertical size={14} /></button>
              </div>
            </div>
          );
        })}
      </section>
    </>
  );
}
