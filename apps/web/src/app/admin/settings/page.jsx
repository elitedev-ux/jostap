import { Bell, CreditCard, FileClock, KeyRound, LifeBuoy, ShieldCheck, Tags, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";

function SettingRow({ icon: Icon, title, copy, action, to }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 0", borderBottom: "1px solid #F3F4F6" }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: "#eaf3ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={17} color="#0d6ffd" />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>{title}</p>
        <p style={{ fontSize: 12, color: "#6B7280" }}>{copy}</p>
      </div>
      <Link to={to} style={{ border: "1px solid #E5E7EB", background: "#fff", borderRadius: 8, padding: "8px 12px", fontSize: 13, fontWeight: 700, color: "#374151", textDecoration: "none", whiteSpace: "nowrap" }}>
        {action}
      </Link>
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", marginBottom: 4 }}>Admin Settings</h1>
          <p style={{ fontSize: 14, color: "#6B7280" }}>Manage launch controls, admin access, support, billing, and audit visibility.</p>
        </div>
        <Link to="/admin/reports" style={{ display: "inline-flex", alignItems: "center", gap: 7, alignSelf: "flex-start", background: "#0d6ffd", color: "#fff", border: "none", borderRadius: 9, padding: "10px 15px", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
          <FileClock size={14} /> Export Reports
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <section style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: 22 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#111827", marginBottom: 4 }}>Operations</h2>
          <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 10 }}>Daily controls for users, support, announcements, and platform records.</p>
          <SettingRow icon={UsersRound} title="User Management" copy="Review users, plans, account status, cards, revenue, and admin access." action="Open Users" to="/admin/users" />
          <SettingRow icon={LifeBuoy} title="Support Inbox" copy="Reply to account, billing, card, and profile issues from one queue." action="Open Support" to="/admin/support" />
          <SettingRow icon={Bell} title="Announcements" copy="Send platform notices and review notification history." action="Open Notifications" to="/admin/notifications" />
        </section>

        <section style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: 22 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#111827", marginBottom: 4 }}>Readiness</h2>
          <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 10 }}>Access, billing, pricing, and audit areas to review before launch.</p>
          <SettingRow icon={KeyRound} title="Admin Roles" copy="Review super admin, operations, support, and billing permissions." action="Open Roles" to="/admin/roles" />
          <SettingRow icon={CreditCard} title="Payments" copy="Review payment records and keep gateway readiness visible." action="Open Payments" to="/admin/payments" />
          <SettingRow icon={Tags} title="Pricing" copy="Review plan prices, card limits, billing intervals, and active plans." action="Open Pricing" to="/admin/pricing" />
          <SettingRow icon={ShieldCheck} title="Audit Logs" copy="Track sensitive admin actions and account changes." action="Open Audit" to="/admin/audit" />
        </section>
      </div>
    </>
  );
}
