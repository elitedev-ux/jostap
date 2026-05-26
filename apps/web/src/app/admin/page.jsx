import {
  AlertTriangle,
  ArrowUpRight,
  CreditCard,
  DollarSign,
  Package,
  Users,
} from "lucide-react";

const stats = [
  ["Total Users", "0", "Awaiting backend", Users, "#2563EB", "#EFF6FF"],
  ["Active Cards", "0", "Awaiting backend", CreditCard, "#059669", "#ECFDF5"],
  ["Monthly Revenue", "$0", "Awaiting backend", DollarSign, "#7C3AED", "#F5F3FF"],
  ["Open Orders", "0", "Awaiting backend", Package, "#D97706", "#FFFBEB"],
];

const activity = [];

const tasks = [
  ["Review flagged public profiles", "0 pending", "#FEF3C7", "#B45309"],
  ["Approve card artwork", "0 orders", "#EFF6FF", "#2563EB"],
  ["Reply to priority tickets", "0 open", "#FEF2F2", "#DC2626"],
];

function StatCard({ item }) {
  const [label, value, change, Icon, color, bg] = item;
  return (
    <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ fontSize: 13, color: "#6B7280", fontWeight: 600 }}>{label}</span>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={17} color={color} />
        </div>
      </div>
      <p style={{ fontSize: 28, fontWeight: 800, color: "#111827", marginBottom: 5 }}>{value}</p>
      <span style={{ fontSize: 12, color, fontWeight: 700 }}>{change} this month</span>
    </div>
  );
}

export default function AdminOverviewPage() {
  return (
    <>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", marginBottom: 4 }}>
            Admin Overview
          </h1>
          <p style={{ fontSize: 14, color: "#6B7280" }}>
            Monitor accounts, NFC card operations, subscriptions, and support activity.
          </p>
        </div>
        <a
          href="/admin/users"
          style={{
            alignSelf: "flex-start",
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            textDecoration: "none",
            color: "#fff",
            background: "#2563EB",
            borderRadius: 9,
            padding: "10px 16px",
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          Review Users <ArrowUpRight size={15} />
        </a>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 14, marginBottom: 20 }}>
        {stats.map((item) => <StatCard key={item[0]} item={item} />)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr .8fr", gap: 20, marginBottom: 20 }}>
        <section style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: 22 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 16 }}>Revenue Snapshot</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(12,1fr)", gap: 8, height: 210, alignItems: "end" }}>
            {[38, 44, 41, 52, 58, 62, 56, 69, 74, 71, 82, 88].map((height, index) => (
              <div key={index} style={{ height: `${height}%`, background: index > 8 ? "#2563EB" : "#DBEAFE", borderRadius: "7px 7px 0 0" }} />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontSize: 12, color: "#9CA3AF" }}>
            <span>Jan</span><span>Mar</span><span>May</span><span>Jul</span><span>Sep</span><span>Dec</span>
          </div>
        </section>

        <section style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: 22 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 16 }}>Operational Tasks</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {tasks.map(([title, count, bg, color]) => (
              <div key={title} style={{ border: "1px solid #E5E7EB", borderRadius: 10, padding: 13, display: "flex", alignItems: "center", gap: 10 }}>
                <AlertTriangle size={16} color={color} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{title}</p>
                  <p style={{ fontSize: 12, color: "#6B7280" }}>{count}</p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color, background: bg, borderRadius: 999, padding: "3px 9px" }}>
                  Action
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: 22 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 12 }}>Recent Activity</h2>
        {activity.length === 0 && (
          <div className="ui-empty-state" style={{ border: "none", padding: "30px 18px" }}>
            <p className="ui-empty-state__title">No activity yet</p>
            <p className="ui-empty-state__copy">Backend events will appear here once connected.</p>
          </div>
        )}
        {activity.map(([title, detail, time], index) => (
          <div key={title} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 0", borderBottom: index < activity.length - 1 ? "1px solid #F3F4F6" : "none" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563EB", flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{title}</p>
              <p style={{ fontSize: 12, color: "#6B7280" }}>{detail}</p>
            </div>
            <span style={{ fontSize: 12, color: "#9CA3AF" }}>{time}</span>
          </div>
        ))}
      </section>
    </>
  );
}
