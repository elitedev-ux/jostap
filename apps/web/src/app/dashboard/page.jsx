import { useEffect, useMemo, useState } from "react";
import {
  Eye,
  Wifi,
  QrCode,
  Plus,
  ArrowRight,
  Activity,
  CreditCard,
  Shield,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getCards } from "../../utils/cardsStore";

const chartData = [
  { day: "Mon", views: 0, taps: 0 },
  { day: "Tue", views: 0, taps: 0 },
  { day: "Wed", views: 0, taps: 0 },
  { day: "Thu", views: 0, taps: 0 },
  { day: "Fri", views: 0, taps: 0 },
  { day: "Sat", views: 0, taps: 0 },
  { day: "Sun", views: 0, taps: 0 },
];

function StatCard({ stat }) {
  const Icon = stat.icon;
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #E5E7EB",
        borderRadius: 12,
        padding: "20px 22px",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#D1D5DB")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#E5E7EB")}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 500, color: "#6B7280" }}>
          {stat.label}
        </span>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 9,
            background: stat.bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={16} color={stat.color} />
        </div>
      </div>
      <p
        style={{
          fontSize: 26,
          fontWeight: 700,
          color: "#111827",
          marginBottom: 6,
        }}
      >
        {stat.value}
      </p>
      <p style={{ fontSize: 12, color: "#9CA3AF" }}>{stat.note}</p>
    </div>
  );
}

function initialsFor(name) {
  return (
    (name || "Card")
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2) || "C"
  );
}

export default function DashboardPage() {
  const [period, setPeriod] = useState("7d");
  const [cards, setCards] = useState([]);

  const refreshCards = async () => {
    try {
      setCards(await getCards());
    } catch {
      setCards([]);
    }
  };

  useEffect(() => {
    refreshCards();
    window.addEventListener("jostap-cards-change", refreshCards);
    return () => window.removeEventListener("jostap-cards-change", refreshCards);
  }, []);

  const totals = useMemo(
    () =>
      cards.reduce(
        (acc, card) => ({
          views: acc.views + Number(card.views || 0),
          taps: acc.taps + Number(card.taps || 0),
          qr: acc.qr + Number(card.qr || 0),
          live: acc.live + (card.active ? 1 : 0),
        }),
        { views: 0, taps: 0, qr: 0, live: 0 },
      ),
    [cards],
  );

  const stats = [
    {
      label: "Profile Views",
      value: totals.views.toLocaleString(),
      note: "Across your created cards",
      icon: Eye,
      color: "#2563EB",
      bg: "#EFF6FF",
    },
    {
      label: "NFC Taps",
      value: totals.taps.toLocaleString(),
      note: "Recorded from your cards",
      icon: Wifi,
      color: "#059669",
      bg: "#ECFDF5",
    },
    {
      label: "QR Scans",
      value: totals.qr.toLocaleString(),
      note: "Recorded from your cards",
      icon: QrCode,
      color: "#7C3AED",
      bg: "#F5F3FF",
    },
    {
      label: "Cards",
      value: cards.length.toLocaleString(),
      note: `${totals.live} live`,
      icon: CreditCard,
      color: "#D97706",
      bg: "#FFFBEB",
    },
  ];

  const dashboardChartData = chartData.map((item) => ({
    ...item,
    views: totals.views ? Math.round(totals.views / chartData.length) : 0,
    taps: totals.taps ? Math.round(totals.taps / chartData.length) : 0,
  }));

  const visibleCards = cards.slice(0, 3);

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 28,
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
              marginBottom: 3,
            }}
          >
            Good morning
          </h1>
          <p style={{ fontSize: 14, color: "#6B7280" }}>
            Create your first card to start seeing engagement here.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <a
            href="/admin"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              fontSize: 14,
              fontWeight: 700,
              color: "#2563EB",
              textDecoration: "none",
              padding: "9px 16px",
              borderRadius: 9,
              background: "#EFF6FF",
              border: "1px solid #BFDBFE",
            }}
          >
            <Shield size={15} /> Admin Preview
          </a>
          <a
            href="/dashboard/cards/new"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              fontSize: 14,
              fontWeight: 600,
              color: "#fff",
              textDecoration: "none",
              padding: "9px 18px",
              borderRadius: 9,
              background: "#2563EB",
            }}
          >
            <Plus size={15} /> New Card
          </a>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
          gap: 14,
          marginBottom: 24,
        }}
      >
        {stats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 340px",
          gap: 20,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            background: "#fff",
            border: "1px solid #E5E7EB",
            borderRadius: 12,
            padding: "22px 22px 10px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>
                Engagement Overview
              </h2>
              <p style={{ fontSize: 13, color: "#6B7280" }}>
                Views and NFC taps from cards you create
              </p>
            </div>
            <div
              style={{
                display: "inline-flex",
                background: "#F9FAFB",
                border: "1px solid #E5E7EB",
                borderRadius: 8,
                padding: 3,
                gap: 2,
              }}
            >
              {["7d", "30d", "90d"].map((item) => (
                <button
                  key={item}
                  onClick={() => setPeriod(item)}
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    padding: "5px 10px",
                    borderRadius: 6,
                    cursor: "pointer",
                    background: period === item ? "#fff" : "transparent",
                    color: period === item ? "#111827" : "#6B7280",
                    border:
                      period === item
                        ? "1px solid #E5E7EB"
                        : "1px solid transparent",
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart
              data={dashboardChartData}
              margin={{ top: 4, right: 4, bottom: 4, left: -20 }}
            >
              <defs>
                <linearGradient id="gViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gTaps" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#F3F4F6"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 12, fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #E5E7EB",
                  boxShadow: "none",
                  fontSize: 13,
                }}
              />
              <Area
                type="monotone"
                dataKey="views"
                stroke="#2563EB"
                strokeWidth={2}
                fill="url(#gViews)"
                name="Views"
              />
              <Area
                type="monotone"
                dataKey="taps"
                stroke="#059669"
                strokeWidth={2}
                fill="url(#gTaps)"
                name="NFC Taps"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div
          style={{
            background: "#fff",
            border: "1px solid #E5E7EB",
            borderRadius: 12,
            padding: "22px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 18,
            }}
          >
            <Activity size={16} color="#6B7280" />
            <h2 style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>
              Recent Activity
            </h2>
          </div>
          {cards.length === 0 ? (
            <div className="ui-empty-state" style={{ padding: "36px 12px" }}>
              <p className="ui-empty-state__title">No activity yet</p>
              <p className="ui-empty-state__copy">
                Publish a card and your views, taps, and scans will appear here.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {visibleCards.map((card, index) => (
                <div
                  key={card.id}
                  style={{
                    display: "flex",
                    gap: 12,
                    padding: "12px 0",
                    borderBottom:
                      index < visibleCards.length - 1
                        ? "1px solid #F3F4F6"
                        : "none",
                  }}
                >
                  <div
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      marginTop: 5,
                      flexShrink: 0,
                      background: "#2563EB",
                    }}
                  />
                  <div>
                    <p
                      style={{
                        fontSize: 13,
                        color: "#374151",
                        lineHeight: 1.4,
                      }}
                    >
                      {card.name || "Untitled card"} is ready to share.
                    </p>
                    <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>
                      Created {card.created || "today"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          background: "#fff",
          border: "1px solid #E5E7EB",
          borderRadius: 12,
          padding: "22px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 18,
          }}
        >
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>
            Your Cards
          </h2>
          <a
            href="/dashboard/cards"
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "#2563EB",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            View all <ArrowRight size={13} />
          </a>
        </div>

        {visibleCards.length === 0 ? (
          <div className="ui-empty-state" style={{ padding: "34px 12px" }}>
            <p className="ui-empty-state__title">No cards yet</p>
            <p className="ui-empty-state__copy">
              Your dashboard starts empty. Create a card and it will show here.
            </p>
            <a
              href="/dashboard/cards/new"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                marginTop: 18,
                fontSize: 14,
                fontWeight: 600,
                color: "#fff",
                textDecoration: "none",
                padding: "9px 18px",
                borderRadius: 9,
                background: "#2563EB",
              }}
            >
              <Plus size={15} /> Create Card
            </a>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {visibleCards.map((card, index) => (
              <div
                key={card.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "14px 0",
                  borderBottom:
                    index < visibleCards.length - 1 ? "1px solid #F3F4F6" : "none",
                  gap: 14,
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 9,
                    background: "linear-gradient(135deg,#2563EB,#7C3AED)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#fff",
                    flexShrink: 0,
                  }}
                >
                  {initialsFor(card.name)}
                </div>
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#111827",
                    }}
                  >
                    {card.name || "Untitled Card"}
                  </p>
                  <p style={{ fontSize: 12, color: "#6B7280" }}>
                    {card.role || card.title || "No title"}
                  </p>
                </div>
                <div style={{ textAlign: "center", minWidth: 60 }}>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#111827",
                    }}
                  >
                    {Number(card.views || 0).toLocaleString()}
                  </p>
                  <p style={{ fontSize: 11, color: "#9CA3AF" }}>views</p>
                </div>
                <div style={{ textAlign: "center", minWidth: 60 }}>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#111827",
                    }}
                  >
                    {Number(card.taps || 0).toLocaleString()}
                  </p>
                  <p style={{ fontSize: 11, color: "#9CA3AF" }}>taps</p>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    borderRadius: 999,
                    padding: "3px 10px",
                    background: card.active ? "#ECFDF5" : "#F3F4F6",
                    color: card.active ? "#059669" : "#6B7280",
                    border: card.active
                      ? "1px solid #A7F3D0"
                      : "1px solid #E5E7EB",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: card.active ? "#059669" : "#9CA3AF",
                      display: "inline-block",
                    }}
                  />
                  {card.active ? "Live" : "Draft"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
