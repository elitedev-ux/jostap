import { ArrowUpRight, DollarSign, RefreshCcw, Search, TrendingUp } from "lucide-react";

const plans = [
  ["Starter", "0", "$0", "0%"],
  ["Professional", "0", "$0", "0%"],
  ["Business Suite", "0", "$0", "0%"],
];

const billingCycles = [
  ["Monthly", "0", "$0", "0%", "#2563EB", "#EFF6FF"],
  ["Yearly", "0", "$0", "0%", "#059669", "#ECFDF5"],
];

const invoices = [];

export default function AdminSubscriptionsPage() {
  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", marginBottom: 4 }}>Subscriptions</h1>
        <p style={{ fontSize: 14, color: "#6B7280" }}>Track MRR, plan distribution, trials, renewals, and invoice state.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 14, marginBottom: 20 }}>
        {[
          ["MRR", "$0", DollarSign, "#2563EB", "#EFF6FF"],
          ["Net Revenue Retention", "0%", TrendingUp, "#059669", "#ECFDF5"],
          ["Active Trials", "0", RefreshCcw, "#7C3AED", "#F5F3FF"],
          ["Expansion MRR", "$0", ArrowUpRight, "#D97706", "#FFFBEB"],
        ].map(([label, value, Icon, color, bg]) => (
          <div key={label} style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <Icon size={17} color={color} />
            </div>
            <p style={{ fontSize: 25, fontWeight: 800, color: "#111827" }}>{value}</p>
            <p style={{ fontSize: 12, color: "#6B7280" }}>{label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <section style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: 22 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#111827", marginBottom: 16 }}>Plan Mix</h2>
          {plans.map(([plan, accounts, revenue, churn]) => (
            <div key={plan} style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 14, alignItems: "center", padding: "13px 0", borderBottom: plan !== "Business Suite" ? "1px solid #F3F4F6" : "none" }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>{plan}</p>
              <span style={{ fontSize: 13, color: "#6B7280" }}>{accounts}</span>
              <span style={{ fontSize: 13, color: "#111827", fontWeight: 700 }}>{revenue}</span>
              <span style={{ fontSize: 12, color: "#B45309", background: "#FFFBEB", borderRadius: 999, padding: "3px 8px" }}>{churn}</span>
            </div>
          ))}
        </section>

        <section style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: 22 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#111827", marginBottom: 4 }}>Billing Cycle Split</h2>
          <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 16 }}>See how many customers are on monthly vs yearly subscriptions.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {billingCycles.map(([cycle, customers, revenue, share, color, bg]) => (
              <div key={cycle} style={{ border: "1px solid #E5E7EB", borderRadius: 11, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>{cycle}</p>
                    <p style={{ fontSize: 12, color: "#6B7280" }}>{customers} customers</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>{revenue}</p>
                    <p style={{ fontSize: 12, color }}>{share} of accounts</p>
                  </div>
                </div>
                <div style={{ height: 8, background: "#F3F4F6", borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ width: share, height: "100%", background: color, borderRadius: 999 }} />
                </div>
                <span style={{ display: "inline-flex", marginTop: 10, fontSize: 11, fontWeight: 800, color, background: bg, borderRadius: 999, padding: "3px 9px" }}>
                  {cycle === "Yearly" ? "Annual prepay" : "Recurring monthly"}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20, marginTop: 20 }}>
        <section style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Search size={15} color="#9CA3AF" />
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "#111827" }}>Recent Invoices</h2>
          </div>
          {invoices.length === 0 && (
            <div className="ui-empty-state" style={{ border: "none" }}>
              <p className="ui-empty-state__title">No invoices yet</p>
              <p className="ui-empty-state__copy">Subscription invoices will appear here when billing is connected.</p>
            </div>
          )}
          {invoices.map(([id, account, amount, cycle, status, date], index) => (
            <div key={id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: index < invoices.length - 1 ? "1px solid #F3F4F6" : "none" }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: "#111827" }}>{id}</p>
                <p style={{ fontSize: 12, color: "#6B7280" }}>{account}</p>
              </div>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#111827" }}>{amount}</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: cycle === "Yearly" ? "#047857" : "#2563EB", background: cycle === "Yearly" ? "#ECFDF5" : "#EFF6FF", borderRadius: 999, padding: "3px 8px" }}>{cycle}</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: status === "Past due" ? "#DC2626" : "#047857", background: status === "Past due" ? "#FEF2F2" : "#ECFDF5", borderRadius: 999, padding: "3px 8px" }}>{status}</span>
              <span style={{ fontSize: 12, color: "#9CA3AF" }}>{date}</span>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
