import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  CreditCard,
  BarChart3,
  Calendar,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
  Menu,
  X,
  Wallet,
  Shield,
} from "lucide-react";
import logo from "../../assets/jostap logo.png3.png";
import faviconMark from "../../assets/jostap favicon bg.png";
import ThemeToggle from "../../components/ThemeToggle";
import { getCards } from "../../utils/cardsStore";

const NAV = [
  { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
  { icon: CreditCard, label: "My Cards", href: "/dashboard/cards" },
  { icon: BarChart3, label: "Analytics", href: "/dashboard/analytics" },
  { icon: Calendar, label: "Appointments", href: "/dashboard/appointments" },
  { icon: Users, label: "Leads", href: "/dashboard/leads" },
  { icon: Wallet, label: "Billing", href: "/dashboard/billing" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export default function DashboardLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cards, setCards] = useState([]);
  const path = typeof window !== "undefined" ? window.location.pathname : "";
  const cardLimit = 5;
  const cardsUsed = Math.min(cards.length, cardLimit);

  const handleSignOut = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
    }).catch(() => {});

    window.location.href = "/auth/signin";
  };

  useEffect(() => {
    const refreshCards = async () => {
      try {
        setCards(await getCards());
      } catch {
        setCards([]);
      }
    };

    refreshCards();
    window.addEventListener("jostap-cards-change", refreshCards);
    return () => window.removeEventListener("jostap-cards-change", refreshCards);
  }, []);

  const SidebarContent = () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: collapsed ? "20px 16px" : "20px 20px",
          borderBottom: "1px solid #E5E7EB",
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
        }}
      >
        {!collapsed && (
          <a
            href="/"
            style={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <img
              src={logo}
              alt="JOSTAP"
              style={{
                display: "block",
                width: 104,
                height: 42,
                objectFit: "contain",
                objectPosition: "left center",
              }}
            />
          </a>
        )}
        {collapsed && (
          <img
            src={faviconMark}
            alt="JOSTAP"
            style={{
              width: 28,
              height: 28,
              objectFit: "contain",
              display: "block",
            }}
          />
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#9CA3AF",
            padding: 4,
            display: "flex",
            alignItems: "center",
          }}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV.map(({ icon: Icon, label, href }) => {
            const active =
              path === href || (href !== "/dashboard" && path.startsWith(href));
            return (
              <a
                key={href}
                href={href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: collapsed ? "10px" : "9px 12px",
                  borderRadius: 8,
                  textDecoration: "none",
                  justifyContent: collapsed ? "center" : "flex-start",
                  background: active ? "#EFF6FF" : "transparent",
                  color: active ? "#2563EB" : "#6B7280",
                  fontWeight: active ? 600 : 400,
                  fontSize: 14,
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "#F9FAFB";
                    e.currentTarget.style.color = "#374151";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#6B7280";
                  }
                }}
                title={collapsed ? label : ""}
              >
                <Icon size={17} />
                {!collapsed && <span>{label}</span>}
              </a>
            );
          })}
        </div>
      </nav>

      {/* User section */}
      <div style={{ padding: "12px 10px", borderTop: "1px solid #E5E7EB" }}>
        {/* Plan badge */}
        {!collapsed && (
          <div
            style={{
              background: "#F9FAFB",
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              padding: "10px 12px",
              marginBottom: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: "#111827" }}>
                  Professional
                </p>
                <p style={{ fontSize: 11, color: "#6B7280" }}>
                  {cardsUsed} / {cardLimit} cards used
                </p>
              </div>
              <a
                href="/dashboard/billing"
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#2563EB",
                  textDecoration: "none",
                  background: "#EFF6FF",
                  borderRadius: 999,
                  padding: "3px 8px",
                }}
              >
                Upgrade
              </a>
            </div>
            <div
              style={{
                marginTop: 8,
                height: 4,
                background: "#E5E7EB",
                borderRadius: 999,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${(cardsUsed / cardLimit) * 100}%`,
                  height: "100%",
                  background: "#2563EB",
                  borderRadius: 999,
                }}
              />
            </div>
          </div>
        )}
        <a
          href="/admin"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: collapsed ? "10px" : "9px 12px",
            borderRadius: 8,
            textDecoration: "none",
            color: "#2563EB",
            background: "#EFF6FF",
            border: "1px solid #BFDBFE",
            fontSize: 14,
            fontWeight: 700,
            justifyContent: collapsed ? "center" : "flex-start",
            marginBottom: 8,
          }}
          title={collapsed ? "Admin Preview" : ""}
        >
          <Shield size={16} />
          {!collapsed && <span>Admin Preview</span>}
        </a>
        <button
          type="button"
          onClick={handleSignOut}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: collapsed ? "10px" : "9px 12px",
            borderRadius: 8,
            border: "none",
            background: "transparent",
            color: "#6B7280",
            fontSize: 14,
            justifyContent: collapsed ? "center" : "flex-start",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#FEF2F2";
            e.currentTarget.style.color = "#B91C1C";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#6B7280";
          }}
        >
          <LogOut size={16} />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#F9FAFB",
      }}
    >
      {/* Desktop sidebar */}
      <aside
        style={{
          width: collapsed ? 60 : 232,
          flexShrink: 0,
          backgroundColor: "#fff",
          borderRight: "1px solid #E5E7EB",
          transition: "width 0.2s",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
        className="sidebar-desktop"
      >
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex" }}
        >
          <div
            style={{
              flex: "none",
              width: 240,
              backgroundColor: "#fff",
              borderRight: "1px solid #E5E7EB",
              height: "100vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <SidebarContent />
          </div>
          <div
            style={{ flex: 1, background: "rgba(0,0,0,0.4)" }}
            onClick={() => setMobileOpen(false)}
          />
        </div>
      )}

      {/* Main content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        {/* Top bar */}
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 50,
            backgroundColor: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            borderBottom: "1px solid #E5E7EB",
            padding: "0 24px",
            height: 56,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#6B7280",
                padding: 4,
              }}
              className="mobile-menu-btn"
            >
              <Menu size={20} />
            </button>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "#F9FAFB",
                border: "1px solid #E5E7EB",
                borderRadius: 8,
                padding: "7px 12px",
                width: 220,
              }}
            >
              <Search size={14} color="#9CA3AF" />
              <input
                placeholder="Search..."
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: 13,
                  color: "#374151",
                  outline: "none",
                  width: "100%",
                }}
              />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <ThemeToggle compact />
            <button
              style={{
                background: "none",
                border: "1px solid #E5E7EB",
                borderRadius: 8,
                cursor: "pointer",
                padding: "6px",
                display: "flex",
                alignItems: "center",
                position: "relative",
              }}
            >
              <Bell size={16} color="#6B7280" />
              <span
                style={{
                  position: "absolute",
                  top: 5,
                  right: 5,
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#2563EB",
                  border: "1.5px solid #fff",
                }}
              />
            </button>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "#F9FAFB",
                border: "1px solid #E5E7EB",
                borderRadius: 8,
                padding: "6px 10px",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: "#EFF6FF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#2563EB",
                }}
              >
                ME
              </div>
              <span style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>
                Account
              </span>
            </div>
          </div>
        </header>

        <main style={{ flex: 1, padding: "28px 24px" }}>{children}</main>
      </div>

      <style jsx global>{`
        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
        }
        @media (min-width: 769px) {
          .mobile-menu-btn { display: none !important; }
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #F9FAFB; }
      `}</style>
    </div>
  );
}
