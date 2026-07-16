import { useEffect, useState } from "react";
import {
  BarChart3,
  Download,
  LockKeyhole,
  TrendingUp,
  Globe,
  ChevronDown,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { getDashboardData } from "../../../utils/dashboardDataStore";

const COLORS = ["#0d6ffd", "#ff9f0d", "#059669"];

const PREMIUM_FEATURE_PLANS = new Set(["trial", "jostap_nfc", "custom_nfc", "basic_renewal", "premium_renewal"]);

function hasPremiumFeatures(plan) {
  return PREMIUM_FEATURE_PLANS.has(String(plan || "").toLowerCase());
}
function AdvancedAnalyticsGate() {
  return (
    <div className="ui-empty-state" style={{ marginBottom: 20 }}>
      <div className="ui-empty-state__icon">
        <LockKeyhole size={18} />
      </div>
      <p className="ui-empty-state__title">Advanced analytics unlock with premium access</p>
      <p className="ui-empty-state__copy">Free cards include basic analytics. Upgrade for deeper visitor insights, referrers, location data, and exports.</p>
      <a href="/pricing" style={{ display: "inline-flex", marginTop: 16, background: "#0d6ffd", color: "#fff", borderRadius: 9, padding: "10px 16px", textDecoration: "none", fontSize: 13, fontWeight: 800 }}>
        Upgrade plan
      </a>
    </div>
  );
}
export default function AnalyticsPage() {
  const [period, setPeriod] = useState("30d");
  const [card, setCard] = useState("All Cards");
  const [analytics, setAnalytics] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [advancedLocked, setAdvancedLocked] = useState(true);
  const totals = analytics?.totals || {};
  const chartData = analytics?.trend || [];
  const barData = chartData.map((item) => ({
    day: item.date,
    clicks: Number(item.taps || 0) + Number(item.qr || 0) + Number(item.contactDownloads || 0),
  }));
  const deviceData = analytics?.devices || [];
  const referrers = analytics?.sources || [];

  useEffect(() => {
    let active = true;

    async function loadAnalytics() {
      try {
        const data = await getDashboardData({ period });
        const features = data.billing?.subscription?.features || {};

        if (!active) return;
        setAdvancedLocked(features.hasPremiumFeatures === undefined
          ? !hasPremiumFeatures(data.billing?.subscription?.plan)
          : !features.hasPremiumFeatures);
        setAnalytics(data.analytics || null);
        setLoadError("");
      } catch (error) {
        if (error.status === 401) {
          window.location.href = "/auth/signin?callbackUrl=/dashboard/analytics";
          return;
        }

        if (active) setLoadError(error.message || "Unable to load analytics.");
      }
    }

    loadAnalytics();

    return () => {
      active = false;
    };
  }, [period]);

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#111827",
              letterSpacing: "-0.02em",
              marginBottom: 3,
            }}
          >
            Analytics
          </h1>
          <p style={{ fontSize: 14, color: "#6B7280" }}>
            Track performance across all your cards.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "#fff",
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              padding: "7px 12px",
              cursor: "pointer",
              fontSize: 13,
              color: "#374151",
            }}
          >
            {card} <ChevronDown size={13} color="#9CA3AF" />
          </div>
          <div
            style={{
              display: "inline-flex",
              background: "#f5f5f5",
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              padding: 3,
            }}
          >
            {["7d", "30d", "90d", "1y"].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  padding: "5px 10px",
                  borderRadius: 6,
                  cursor: "pointer",
                  background: period === p ? "#fff" : "transparent",
                  color: period === p ? "#111827" : "#6B7280",
                  border:
                    period === p
                      ? "1px solid #E5E7EB"
                      : "1px solid transparent",
                }}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              if (advancedLocked) window.location.href = "/pricing";
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              fontWeight: 500,
              color: "#374151",
              background: "#fff",
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              padding: "7px 14px",
              cursor: "pointer",
            }}
          >
            {advancedLocked ? <LockKeyhole size={13} /> : <Download size={13} />} {advancedLocked ? "Upgrade" : "Export CSV"}
          </button>
        </div>
      </div>

      {loadError && (
        <div
          style={{
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            color: "#B91C1C",
            borderRadius: 10,
            padding: "11px 14px",
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 16,
          }}
        >
          {loadError}
        </div>
      )}

      {/* KPI row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
          gap: 14,
          marginBottom: 20,
        }}
      >
        {[
          ["Total Views", totals.views || 0, "live", "#0d6ffd", "#eaf3ff"],
          ["NFC Taps", totals.taps || 0, "live", "#059669", "#ECFDF5"],
          ["QR Scans", totals.qrScans || 0, "live", "#ff9f0d", "#F5F3FF"],
          ["Contact Saves", totals.contactDownloads || 0, "live", "#D97706", "#FFFBEB"],
          ["Appointments", totals.appointments || 0, `${totals.pendingAppointments || 0} pending`, "#0f172a", "#f5f5f5"],
        ].map(([label, val, change, color, bg]) => (
          <div
            key={label}
            style={{
              background: "#fff",
              border: "1px solid #E5E7EB",
              borderRadius: 12,
              padding: "18px 20px",
            }}
          >
            <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 8 }}>
              {label}
            </p>
            <p
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "#111827",
                letterSpacing: "-0.025em",
                marginBottom: 6,
              }}
            >
              {val}
            </p>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color,
                background: bg,
                borderRadius: 999,
                padding: "2px 8px",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <TrendingUp size={10} /> {change}
            </span>
          </div>
        ))}
      </div>

      {/* Main chart */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #E5E7EB",
          borderRadius: 12,
          padding: "22px",
          marginBottom: 20,
        }}
      >
        <h2
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "#111827",
            marginBottom: 4,
          }}
        >
          Engagement Trends
        </h2>
        <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 20 }}>
          Views, NFC taps, QR scans, and appointment bookings over time
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart
            data={chartData}
            margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
          >
            <defs>
              {[
                ["gV", "#0d6ffd"],
                ["gT", "#059669"],
                ["gQ", "#ff9f0d"],
                ["gA", "#0f172a"],
              ].map(([id, c]) => (
                <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={c} stopOpacity={0.1} />
                  <stop offset="95%" stopColor={c} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#F3F4F6"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#9CA3AF" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#9CA3AF" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #E5E7EB",
                boxShadow: "none",
                fontSize: 12,
              }}
            />
            <Area
              type="monotone"
              dataKey="views"
              stroke="#0d6ffd"
              strokeWidth={2}
              fill="url(#gV)"
              name="Views"
            />
            <Area
              type="monotone"
              dataKey="taps"
              stroke="#059669"
              strokeWidth={2}
              fill="url(#gT)"
              name="NFC Taps"
            />
            <Area
              type="monotone"
              dataKey="qr"
              stroke="#ff9f0d"
              strokeWidth={2}
              fill="url(#gQ)"
              name="QR Scans"
            />
            <Area
              type="monotone"
              dataKey="appointments"
              stroke="#0f172a"
              strokeWidth={2}
              fill="url(#gA)"
              name="Appointments"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {advancedLocked ? <AdvancedAnalyticsGate /> : <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 20,
          marginBottom: 20,
        }}
      >
        {/* Link clicks bar */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #E5E7EB",
            borderRadius: 12,
            padding: "22px",
          }}
        >
          <h2
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "#111827",
              marginBottom: 18,
            }}
          >
            Actions by Day
          </h2>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart
              data={barData}
              margin={{ top: 0, right: 0, bottom: 0, left: -24 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#F3F4F6"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #E5E7EB",
                  fontSize: 12,
                }}
              />
              <Bar
                dataKey="clicks"
                fill="#eaf3ff"
                stroke="#0d6ffd"
                strokeWidth={1.5}
                radius={[4, 4, 0, 0]}
                name="Actions"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Device breakdown */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #E5E7EB",
            borderRadius: 12,
            padding: "22px",
          }}
        >
          <h2
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "#111827",
              marginBottom: 18,
            }}
          >
            Device Breakdown
          </h2>
          {deviceData.length === 0 && (
            <div className="ui-empty-state" style={{ border: "none", padding: "18px 12px" }}>
              <p className="ui-empty-state__title">No device data yet</p>
            </div>
          )}
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={deviceData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                dataKey="value"
                paddingAngle={3}
              >
                {deviceData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #E5E7EB",
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            {deviceData.map((d, i) => (
              <div
                key={d.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 12,
                  color: "#6B7280",
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: COLORS[i],
                    display: "inline-block",
                  }}
                />
                {d.name} ({d.value}%)
              </div>
            ))}
          </div>
        </div>

        {/* Referrers */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #E5E7EB",
            borderRadius: 12,
            padding: "22px",
          }}
        >
          <h2
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "#111827",
              marginBottom: 16,
            }}
          >
            Top Referrers
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {referrers.length === 0 && (
              <div className="ui-empty-state" style={{ border: "none", padding: "24px 12px" }}>
                <p className="ui-empty-state__title">No referrers yet</p>
                <p className="ui-empty-state__copy">External traffic sources will appear here after visitors open your public card from another website.</p>
              </div>
            )}
            {referrers.map((r) => (
              <div key={r.source}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <span style={{ fontSize: 12, color: "#374151" }}>
                    {r.source}
                  </span>
                  <span
                    style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}
                  >
                    {r.visits}
                  </span>
                </div>
                <div
                  style={{
                    height: 4,
                    background: "#F3F4F6",
                    borderRadius: 999,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min((r.visits / Math.max(...referrers.map((item) => item.visits), 1)) * 100, 100)}%`,
                      height: "100%",
                      background: "#0d6ffd",
                      borderRadius: 999,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>}

    </>
  );
}
