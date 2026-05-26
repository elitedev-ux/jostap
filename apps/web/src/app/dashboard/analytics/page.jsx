import { useState } from "react";
import {
  BarChart3,
  Download,
  TrendingUp,
  Globe,
  Monitor,
  Smartphone,
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
  Legend,
} from "recharts";

const areaData = [
  { date: "May 1", views: 0, taps: 0, qr: 0 },
  { date: "May 5", views: 0, taps: 0, qr: 0 },
  { date: "May 10", views: 0, taps: 0, qr: 0 },
  { date: "May 15", views: 0, taps: 0, qr: 0 },
  { date: "May 20", views: 0, taps: 0, qr: 0 },
  { date: "May 25", views: 0, taps: 0, qr: 0 },
  { date: "May 26", views: 0, taps: 0, qr: 0 },
];

const barData = [
  { day: "Mon", clicks: 0 },
  { day: "Tue", clicks: 0 },
  { day: "Wed", clicks: 0 },
  { day: "Thu", clicks: 0 },
  { day: "Fri", clicks: 0 },
  { day: "Sat", clicks: 0 },
  { day: "Sun", clicks: 0 },
];

const deviceData = [];

const COLORS = ["#2563EB", "#7C3AED", "#059669"];

const LOCATIONS = [];

const REFERRERS = [];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("30d");
  const [card, setCard] = useState("All Cards");

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
              background: "#F9FAFB",
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
            <Download size={13} /> Export CSV
          </button>
        </div>
      </div>

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
          ["Total Views", "0", "0%", "#2563EB", "#EFF6FF"],
          ["NFC Taps", "0", "0%", "#059669", "#ECFDF5"],
          ["QR Scans", "0", "0%", "#7C3AED", "#F5F3FF"],
          ["Avg. Time on Profile", "0m", "0%", "#D97706", "#FFFBEB"],
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
          Views, NFC taps, and QR scans over time
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart
            data={areaData}
            margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
          >
            <defs>
              {[
                ["gV", "#2563EB"],
                ["gT", "#059669"],
                ["gQ", "#7C3AED"],
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
              stroke="#2563EB"
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
              stroke="#7C3AED"
              strokeWidth={2}
              fill="url(#gQ)"
              name="QR Scans"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div
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
            Link Clicks by Day
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
                fill="#EFF6FF"
                stroke="#2563EB"
                strokeWidth={1.5}
                radius={[4, 4, 0, 0]}
                name="Clicks"
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
            {REFERRERS.length === 0 && (
              <div className="ui-empty-state" style={{ border: "none", padding: "24px 12px" }}>
                <p className="ui-empty-state__title">No referrers yet</p>
                <p className="ui-empty-state__copy">Traffic sources will appear here after backend tracking is connected.</p>
              </div>
            )}
            {REFERRERS.map((r, i) => (
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
                      width: `${(r.visits / 1180) * 100}%`,
                      height: "100%",
                      background: "#2563EB",
                      borderRadius: 999,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Geo table */}
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
          Visitors by Country
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {LOCATIONS.length === 0 && (
            <div className="ui-empty-state" style={{ border: "none" }}>
              <p className="ui-empty-state__title">No location data yet</p>
              <p className="ui-empty-state__copy">Visitor country data will appear here after backend tracking is connected.</p>
            </div>
          )}
          {LOCATIONS.map((l, i) => (
            <div
              key={l.country}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "12px 0",
                borderBottom:
                  i < LOCATIONS.length - 1 ? "1px solid #F3F4F6" : "none",
              }}
            >
              <span style={{ fontSize: 14, flex: 1, color: "#374151" }}>
                {l.country}
              </span>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#111827",
                  minWidth: 50,
                  textAlign: "right",
                }}
              >
                {l.visits.toLocaleString()}
              </span>
              <div
                style={{
                  width: 120,
                  height: 5,
                  background: "#F3F4F6",
                  borderRadius: 999,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${l.pct}%`,
                    height: "100%",
                    background: "#2563EB",
                    borderRadius: 999,
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: 12,
                  color: "#9CA3AF",
                  minWidth: 32,
                  textAlign: "right",
                }}
              >
                {l.pct}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

