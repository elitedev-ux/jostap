import { ArrowUpRight, DollarSign, RefreshCcw, Search, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

function planName(plan) {
  if (plan === "free") return "Free";
  if (plan === "jostap_nfc") return "JOSTAP Card";
  if (plan === "custom_nfc") return "Custom Card";
  if (plan === "basic_renewal") return "Basic Renewal";
  if (plan === "premium_renewal") return "Premium Features Renewal";
  return plan || "Unknown";
}

function money(cents) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(cents || 0) / 100);
}

export default function AdminSubscriptionsPage() {
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [busyId, setBusyId] = useState("");

  async function loadSubscriptions(active = true) {
    setLoadError("");
    try {
      const response = await fetch("/api/admin/overview", { credentials: "same-origin" });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json.error || "Unable to load subscriptions.");
      if (active) setData(json);
    } catch (error) {
      if (active) setLoadError(error.message || "Unable to load subscriptions.");
    }
  }

  async function updateSubscription(subscription) {
    setBusyId(subscription.id);
    setLoadError("");
    try {
      const nextStatus = subscription.status === "active" ? "cancelled" : "active";
      const response = await fetch(`/api/admin/subscriptions/${subscription.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json.error || "Unable to update subscription.");
      await loadSubscriptions();
    } catch (error) {
      setLoadError(error.message || "Unable to update subscription.");
    } finally {
      setBusyId("");
    }
  }

  useEffect(() => {
    let active = true;
    loadSubscriptions(active);
    return () => {
      active = false;
    };
  }, []);

  const subscriptions = data?.subscriptions || [];
  const invoices = data?.invoices || [];
  const plans = useMemo(
    () =>
      ["free", "jostap_nfc", "custom_nfc", "premium_renewal"].map((plan) => {
        const count = subscriptions.filter((item) => item.plan === plan).length;
        return [planName(plan), count, "Live", "0%"];
      }),
    [subscriptions],
  );
  const billingCycles = ["monthly", "yearly"].map((cycle, index) => {
    const count = subscriptions.filter((item) => item.billingCycle === cycle).length;
    const share = subscriptions.length ? `${Math.round((count / subscriptions.length) * 100)}%` : "0%";
    return [cycle === "yearly" ? "Yearly" : "Monthly", count, "Live", share, index ? "#059669" : "#0d6ffd", index ? "#ECFDF5" : "#eaf3ff"];
  });

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", marginBottom: 4 }}>Subscriptions</h1>
        <p style={{ fontSize: 14, color: "#6B7280" }}>Track MRR, plan distribution, trials, renewals, and invoice state.</p>
      </div>

      {loadError && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C", borderRadius: 10, padding: "11px 14px", fontSize: 13, fontWeight: 700, marginBottom: 16 }}>{loadError}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 14, marginBottom: 20 }}>
        {[
          ["Revenue", money(data?.stats?.revenueCents), DollarSign, "#0d6ffd", "#eaf3ff"],
          ["Active Plans", data?.stats?.subscriptions || 0, TrendingUp, "#059669", "#ECFDF5"],
          ["Invoices", invoices.length, RefreshCcw, "#ff9f0d", "#F5F3FF"],
          ["Open Invoices", data?.stats?.openInvoices || 0, ArrowUpRight, "#D97706", "#FFFBEB"],
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
            <div key={plan} style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 14, alignItems: "center", padding: "13px 0", borderBottom: "1px solid #F3F4F6" }}>
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
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#111827", marginBottom: 16 }}>Manage Subscriptions</h2>
          {subscriptions.length === 0 && (
            <div className="ui-empty-state" style={{ border: "none" }}>
              <p className="ui-empty-state__title">No subscriptions yet</p>
              <p className="ui-empty-state__copy">Customer subscriptions will appear here.</p>
            </div>
          )}
          {subscriptions.map((subscription, index) => (
            <div key={subscription.id} style={{ display: "grid", gridTemplateColumns: "1.2fr .7fr .7fr .8fr auto", gap: 12, alignItems: "center", padding: "12px 0", borderBottom: index < subscriptions.length - 1 ? "1px solid #F3F4F6" : "none" }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 800, color: "#111827" }}>{subscription.account}</p>
                <p style={{ fontSize: 12, color: "#6B7280" }}>{subscription.renews ? `Renews ${subscription.renews}` : "No renewal date"}</p>
              </div>
              <span style={{ fontSize: 13, color: "#374151", fontWeight: 700, textTransform: "capitalize" }}>{subscription.plan}</span>
              <span style={{ fontSize: 13, color: "#6B7280", textTransform: "capitalize" }}>{subscription.billingCycle}</span>
              <span style={{ justifySelf: "start", fontSize: 11, fontWeight: 800, color: subscription.status === "active" ? "#047857" : "#B45309", background: subscription.status === "active" ? "#ECFDF5" : "#FFFBEB", borderRadius: 999, padding: "3px 8px", textTransform: "capitalize" }}>{subscription.status}</span>
              <button
                onClick={() => updateSubscription(subscription)}
                disabled={busyId === subscription.id}
                style={{ border: "1px solid #E5E7EB", background: "#fff", borderRadius: 8, padding: "7px 10px", fontSize: 12, fontWeight: 800, color: subscription.status === "active" ? "#DC2626" : "#047857", cursor: busyId === subscription.id ? "wait" : "pointer" }}
              >
                {busyId === subscription.id ? "Saving..." : subscription.status === "active" ? "Cancel" : "Reactivate"}
              </button>
            </div>
          ))}
        </section>

        <section style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Search size={15} color="#9CA3AF" />
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "#111827" }}>Recent Invoices</h2>
          </div>
          {invoices.length === 0 && (
            <div className="ui-empty-state" style={{ border: "none" }}>
              <p className="ui-empty-state__title">No invoices yet</p>
              <p className="ui-empty-state__copy">Subscription invoices will appear here when billing records are created.</p>
            </div>
          )}
          {invoices.map((invoice, index) => (
            <div key={invoice.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: index < invoices.length - 1 ? "1px solid #F3F4F6" : "none" }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: "#111827" }}>{invoice.invoiceNumber}</p>
                <p style={{ fontSize: 12, color: "#6B7280" }}>{invoice.account}</p>
              </div>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#111827" }}>{invoice.amount}</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#0d6ffd", background: "#eaf3ff", borderRadius: 999, padding: "3px 8px" }}>Invoice</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: invoice.status === "open" ? "#B45309" : "#047857", background: invoice.status === "open" ? "#FFFBEB" : "#ECFDF5", borderRadius: 999, padding: "3px 8px" }}>{invoice.status}</span>
              <span style={{ fontSize: 12, color: "#9CA3AF" }}>{invoice.issued}</span>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
