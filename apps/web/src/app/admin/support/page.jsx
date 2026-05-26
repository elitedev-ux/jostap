import { Clock, Headphones, MessageSquare, Search, ShieldAlert } from "lucide-react";

const tickets = [];

export default function AdminSupportPage() {
  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", marginBottom: 4 }}>Support</h1>
        <p style={{ fontSize: 14, color: "#6B7280" }}>Manage tickets, escalations, account issues, and production support requests.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, marginBottom: 20 }}>
        {[
          ["Open Tickets", "0", Headphones, "#2563EB", "#EFF6FF"],
          ["High Priority", "0", ShieldAlert, "#DC2626", "#FEF2F2"],
          ["Avg Response", "0m", Clock, "#D97706", "#FFFBEB"],
          ["Resolved Today", "0", MessageSquare, "#059669", "#ECFDF5"],
        ].map(([label, value, Icon, color, bg]) => (
          <div key={label} style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: 18 }}>
            <Icon size={18} color={color} style={{ marginBottom: 10 }} />
            <p style={{ fontSize: 24, fontWeight: 800, color: "#111827" }}>{value}</p>
            <p style={{ fontSize: 12, color: "#6B7280" }}>{label}</p>
          </div>
        ))}
      </div>

      <section style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: 16, borderBottom: "1px solid #E5E7EB", display: "flex", gap: 10 }}>
          <Search size={15} color="#9CA3AF" />
          <input placeholder="Search tickets..." style={{ border: "none", outline: "none", flex: 1, background: "transparent", fontSize: 13 }} />
        </div>
        {tickets.length === 0 && (
          <div className="ui-empty-state" style={{ border: "none" }}>
            <p className="ui-empty-state__title">No support tickets yet</p>
            <p className="ui-empty-state__copy">Support requests will appear here when the backend is connected.</p>
          </div>
        )}
        {tickets.map(([id, subject, account, priority, status, time], index) => (
          <div key={id} style={{ display: "grid", gridTemplateColumns: ".7fr 1.5fr 1fr .7fr .7fr .7fr", gap: 14, alignItems: "center", padding: "15px 18px", borderTop: index ? "1px solid #F3F4F6" : "none" }}>
            <span style={{ fontSize: 13, color: "#2563EB", fontWeight: 800 }}>{id}</span>
            <span style={{ fontSize: 14, color: "#111827", fontWeight: 800 }}>{subject}</span>
            <span style={{ fontSize: 13, color: "#6B7280" }}>{account}</span>
            <span style={{ fontSize: 12, color: priority === "High" ? "#DC2626" : "#B45309", fontWeight: 800 }}>{priority}</span>
            <span style={{ fontSize: 12, color: status === "Resolved" ? "#047857" : "#2563EB", fontWeight: 800 }}>{status}</span>
            <span style={{ fontSize: 12, color: "#9CA3AF" }}>{time}</span>
          </div>
        ))}
      </section>
    </>
  );
}
