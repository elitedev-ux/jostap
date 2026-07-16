import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Bell,
  CheckCircle2,
  CreditCard,
  DollarSign,
  FileText,
  Package,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

function money(cents) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(cents || 0) / 100);
}

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
      <span style={{ fontSize: 12, color, fontWeight: 700 }}>{change}</span>
    </div>
  );
}

function ProgressRow({ label, value, total, color }) {
  const pct = total ? Math.round((value / total) * 100) : 0;

  return (
    <div style={{ padding: "12px 0", borderBottom: "1px solid #F3F4F6" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 7 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#6B7280" }}>
          {value.toLocaleString()} {value === 1 ? "account" : "accounts"}
        </span>
      </div>
      <div style={{ height: 7, background: "#F3F4F6", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 999 }} />
      </div>
    </div>
  );
}

export default function AdminOverviewPage() {
  const [admin, setAdmin] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadAdmin() {
      try {
        const response = await fetch("/api/admin/overview", { credentials: "same-origin" });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.error || "Unable to load admin data.");
        }

        if (active) setAdmin(data);
      } catch (error) {
        if (active) setLoadError(error.message || "Unable to load admin data.");
      }
    }

    loadAdmin();

    return () => {
      active = false;
    };
  }, []);

  const statsData = admin?.stats || {};
  const totalUsers = statsData.users || 0;
  const customerUsers = statsData.standardUsers || 0;
  const stats = [
    ["Total Users", totalUsers, `${statsData.admins || 0} admins`, Users, "#0d6ffd", "#eaf3ff"],
    ["Paystack Users", statsData.premiumUsers || 0, "paid through Paystack", UserCheck, "#059669", "#ECFDF5"],
    ["Other Users", statsData.freeUsers || 0, "free or admin-upgraded", ShieldCheck, "#D97706", "#FFFBEB"],
    ["Active Cards", statsData.activeCards || 0, `${statsData.cards || 0} total cards`, CreditCard, "#ff9f0d", "#F5F3FF"],
    ["NFC Taps", statsData.taps || 0, "physical card taps", Package, "#0F766E", "#CCFBF1"],
    ["QR Scans", statsData.qrScans || 0, "public profile scans", BarChart3, "#DB2777", "#FCE7F3"],
    ["Contact Downloads", statsData.contactDownloads || 0, "saved contacts", CheckCircle2, "#047857", "#ECFDF5"],
    [
      "Paystack Purchases",
      statsData.paystackPayments || 0,
      `${statsData.paystackCustomers || 0} ${statsData.paystackCustomers === 1 ? "customer" : "customers"}`,
      TrendingUp,
      "#0F766E",
      "#CCFBF1",
    ],
    ["Revenue Collected", money(statsData.revenueCents), "Paystack payments only", DollarSign, "#4F46E5", "#EEF2FF"],
    ["Leads Captured", statsData.leads || 0, "all user cards", BarChart3, "#DB2777", "#FCE7F3"],
    ["Open Invoices", statsData.openInvoices || 0, `${statsData.paidInvoices || 0} paid`, FileText, "#B45309", "#FEF3C7"],
  ];
  const tasks = [
    ["Review public profiles", `${statsData.cards || 0} total`, "#FEF3C7", "#B45309"],
    ["Monitor Paystack accounts", `${statsData.premiumUsers || 0} paid`, "#eaf3ff", "#0d6ffd"],
    ["Complete KYC follow-up", `${statsData.kycPending || 0} pending`, "#FEF2F2", "#DC2626"],
  ];
  const activity = [
    ...(admin?.users || []).slice(0, 4).map((user) => [
      `user-${user.id}`,
      "New account",
      `${user.name} joined ${user.joined || "recently"}`,
      user.joined || "",
    ]),
    ...(admin?.cards || []).slice(0, 4).map((card) => [
      `card-${card.id}`,
      "Card created",
      `${card.name} by ${card.owner}`,
      card.created || "",
    ]),
  ].slice(0, 7);
  const notifications = (admin?.notifications || []).slice(0, 5);

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
            background: "#0d6ffd",
            borderRadius: 9,
            padding: "10px 16px",
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          Review Users <ArrowUpRight size={15} />
        </a>
      </div>

      {loadError && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C", borderRadius: 10, padding: "11px 14px", fontSize: 13, fontWeight: 700, marginBottom: 16 }}>
          {loadError}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 14, marginBottom: 20 }}>
        {stats.map((item) => <StatCard key={item[0]} item={item} />)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr .8fr", gap: 20, marginBottom: 20 }}>
        <section style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: 22 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 8 }}>User & Plan Breakdown</h2>
          <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 12 }}>Customer segmentation from Supabase. Admin accounts are excluded.</p>
          <ProgressRow label="Paystack-paid users" value={statsData.premiumUsers || 0} total={customerUsers} color="#059669" />
          <ProgressRow label="Free or admin-upgraded users" value={statsData.freeUsers || 0} total={customerUsers} color="#D97706" />
          <ProgressRow label="KYC completed" value={statsData.kycComplete || 0} total={customerUsers} color="#0d6ffd" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 10, marginTop: 16 }}>
            {[
              ["No Paystack payment", statsData.freeUsers || 0],
              ["JOSTAP Card", statsData.jostapNfcUsers || 0],
              ["Custom Card", statsData.customNfcUsers || 0],
              ["Team Renewal", statsData.basicRenewalUsers || 0],
              ["Premium Access", statsData.premiumRenewalUsers || 0],
            ].map(([label, value]) => (
              <div key={label} style={{ border: "1px solid #E5E7EB", borderRadius: 10, padding: 13 }}>
                <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 4 }}>{label}</p>
                <p style={{ fontSize: 22, color: "#111827", fontWeight: 800 }}>{value}</p>
              </div>
            ))}
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

      <section style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: 22, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 4 }}>Recent Notifications</h2>
            <p style={{ fontSize: 13, color: "#6B7280" }}>Unread support tickets stay visible until the ticket is closed.</p>
          </div>
          <a
            href="/admin/notifications"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              textDecoration: "none",
              color: "#0d6ffd",
              background: "#eaf3ff",
              borderRadius: 9,
              padding: "8px 11px",
              fontSize: 12,
              fontWeight: 800,
              whiteSpace: "nowrap",
            }}
          >
            <Bell size={14} /> View all
          </a>
        </div>
        {notifications.length === 0 && (
          <div className="ui-empty-state" style={{ border: "none", padding: "26px 18px" }}>
            <p className="ui-empty-state__title">No notifications yet</p>
            <p className="ui-empty-state__copy">New support tickets and platform alerts will appear here.</p>
          </div>
        )}
        {notifications.map((notification, index) => {
          const unread = !notification.is_read;
          const href = notification.source === "support_ticket" && notification.ticketId
            ? `/admin/support?ticket=${encodeURIComponent(notification.ticketId)}`
            : "/admin/notifications";

          return (
            <a
              key={notification.id || index}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "13px 0",
                borderTop: index ? "1px solid #F3F4F6" : "none",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: unread ? "#DC2626" : "#D1D5DB", flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 800, color: "#111827", marginBottom: 3 }}>{notification.title}</p>
                <p style={{ fontSize: 12, color: "#6B7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{notification.message}</p>
              </div>
              <span style={{ fontSize: 11, fontWeight: 800, color: unread ? "#B91C1C" : "#6B7280", background: unread ? "#FEF2F2" : "#F3F4F6", borderRadius: 999, padding: "3px 8px", whiteSpace: "nowrap" }}>
                {unread ? "Unread" : "Read"}
              </span>
            </a>
          );
        })}
      </section>

      <section style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: 22 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 12 }}>Recent Activity</h2>
        {activity.length === 0 && (
          <div className="ui-empty-state" style={{ border: "none", padding: "30px 18px" }}>
            <p className="ui-empty-state__title">No activity yet</p>
            <p className="ui-empty-state__copy">New accounts and cards will appear here.</p>
          </div>
        )}
        {activity.map(([id, title, detail, time], index) => (
          <div key={id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 0", borderBottom: index < activity.length - 1 ? "1px solid #F3F4F6" : "none" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#0d6ffd", flexShrink: 0 }} />
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
