import { Bell, Database, KeyRound, Save, ShieldCheck, SlidersHorizontal } from "lucide-react";

function SettingRow({ icon: Icon, title, copy, action = "Configure" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 0", borderBottom: "1px solid #F3F4F6" }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={17} color="#2563EB" />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>{title}</p>
        <p style={{ fontSize: 12, color: "#6B7280" }}>{copy}</p>
      </div>
      <button style={{ border: "1px solid #E5E7EB", background: "#fff", borderRadius: 8, padding: "8px 12px", fontSize: 13, fontWeight: 700, color: "#374151" }}>{action}</button>
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", marginBottom: 4 }}>Admin Settings</h1>
          <p style={{ fontSize: 14, color: "#6B7280" }}>Prepare platform controls, moderation, integrations, and access rules for backend wiring.</p>
        </div>
        <button style={{ display: "inline-flex", alignItems: "center", gap: 7, alignSelf: "flex-start", background: "#2563EB", color: "#fff", border: "none", borderRadius: 9, padding: "10px 15px", fontSize: 13, fontWeight: 700 }}>
          <Save size={14} /> Save Changes
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <section style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: 22 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#111827", marginBottom: 4 }}>Platform Controls</h2>
          <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 10 }}>Operational switches for launch and moderation.</p>
          <SettingRow icon={SlidersHorizontal} title="Feature Flags" copy="Enable beta templates, QR analytics, and team seats." />
          <SettingRow icon={ShieldCheck} title="Moderation Rules" copy="Review card content, profile URLs, and public media." />
          <SettingRow icon={Bell} title="Admin Notifications" copy="Email, Slack, and in-app alert preferences." />
        </section>

        <section style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: 22 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#111827", marginBottom: 4 }}>Backend Readiness</h2>
          <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 10 }}>Placeholders for API, auth, and database integrations.</p>
          <SettingRow icon={KeyRound} title="Admin Roles" copy="Super admin, operations, support, and billing permissions." action="Map Roles" />
          <SettingRow icon={Database} title="Data Sources" copy="Connect users, cards, payments, orders, and ticket tables." action="Plan Schema" />
          <SettingRow icon={ShieldCheck} title="Audit Logs" copy="Track sensitive admin actions and account changes." action="Enable" />
        </section>
      </div>
    </>
  );
}
