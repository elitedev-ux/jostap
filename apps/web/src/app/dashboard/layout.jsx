import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  CreditCard,
  BarChart3,
  Calendar,
  Headphones,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
  Menu,
  X,
  Wallet,
  ShoppingBag,
} from "lucide-react";
import logo from "../../assets/jostap logo.png3.png";
import faviconMark from "../../assets/jostap favicon bg.png";
import { getCards } from "../../utils/cardsStore";
import cn from "classnames";
import "./dashboard-layout.css";

const NAV = [
  { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
  { icon: CreditCard, label: "My Cards", href: "/dashboard/cards" },
  { icon: BarChart3, label: "Analytics", href: "/dashboard/analytics" },
  { icon: Calendar, label: "Appointments", href: "/dashboard/appointments" },
  { icon: Headphones, label: "Support", href: "/dashboard/support" },
  { icon: ShoppingBag, label: "Shop", href: "/dashboard/shop" },
  { icon: Wallet, label: "Billing", href: "/dashboard/billing" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export default function DashboardLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cards, setCards] = useState([]);
  const [account, setAccount] = useState(null);
  const [billing, setBilling] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const path = typeof window !== "undefined" ? window.location.pathname : "";

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

  useEffect(() => {
    let active = true;

    async function loadAnnouncements() {
      try {
        const response = await fetch("/api/announcements", { credentials: "same-origin" });
        const data = await response.json().catch(() => ({}));

        if (active && response.ok) {
          setAnnouncements(data.announcements || []);
        }
      } catch {
        if (active) {
          setAnnouncements([]);
        }
      }
    }

    loadAnnouncements();

    return () => {
      active = false;
    };
  }, []);

  const markAnnouncementRead = async (id) => {
    setAnnouncements((items) =>
      items.map((item) => (item.id === id ? { ...item, isRead: true } : item)),
    );

    await fetch(`/api/announcements/${id}/read`, {
      method: "POST",
      credentials: "same-origin",
    }).catch(() => {});
  };

  useEffect(() => {
    let active = true;

    async function loadBilling() {
      try {
        const response = await fetch("/api/billing", { credentials: "same-origin" });
        const data = await response.json().catch(() => ({}));

        if (active && response.ok) {
          setBilling(data);
        }
      } catch {
        if (active) {
          setBilling(null);
        }
      }
    }

    loadBilling();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function requireKyc() {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "same-origin",
        });

        if (response.status === 401) {
          window.location.href = "/auth/signin";
          return;
        }

        const data = await response.json().catch(() => ({}));

        if (active && response.ok && data.user) {
          setAccount(data.user);
        }

        if (active && response.ok && data.user && !data.user.kycComplete) {
          window.location.href = "/kyc";
        }
      } catch {
        if (active) {
          window.location.href = "/auth/signin";
        }
      }
    }

    requireKyc();

    return () => {
      active = false;
    };
  }, []);

  const accountName = account?.name || "Account";
  const accountAvatar = account?.kyc?.avatarUrl || "";
  const planName =
    billing?.subscription?.plan === "custom_nfc"
      ? "Custom NFC"
      : billing?.subscription?.plan === "jostap_nfc"
        ? "JOSTAP NFC"
        : billing?.subscription?.plan === "premium_renewal"
          ? "Premium Renewal"
          : "Free";
  const cardLimit = billing?.subscription?.cardLimit ?? 5;
  const cardsUsed = cards.length;
  const cardLimitLabel = cardLimit ? `${cardsUsed} / ${cardLimit}` : `${cardsUsed}`;
  const accountInitials =
    accountName
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "ME";
  const unreadAnnouncements = announcements.filter((item) => !item.isRead).length;

  const SidebarContent = () => (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Logo */}
      <div
        className={cn(
          "flex items-center border-b border-slate-200",
          collapsed ? "px-4 py-5 justify-center" : "px-5 py-5 justify-between"
        )}
      >
        {!collapsed && (
          <a
            href="/"
            className="flex items-center gap-2 no-underline"
          >
            <img
              src={logo}
              alt="JOSTAP"
              className="block w-24 h-10 object-contain"
            />
          </a>
        )}
        {collapsed && (
          <img
            src={faviconMark}
            alt="JOSTAP"
            className="block w-7 h-7 object-contain"
          />
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 bg-transparent border-none cursor-pointer text-slate-400 hover:text-slate-600 transition-colors"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto">
        <div className="flex flex-col gap-0.5">
          {NAV.map(({ icon: Icon, label, href }) => {
            const active =
              path === href || (href !== "/dashboard" && path.startsWith(href));
            return (
              <a
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150 no-underline text-sm font-normal",
                  active
                    ? "bg-blue-50 text-blue-600 font-semibold"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700",
                  collapsed ? "justify-center px-3" : "justify-start"
                )}
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
      <div className="p-3 border-t border-slate-200">
        {/* Plan badge */}
        {!collapsed && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-2.5">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[11px] font-semibold text-slate-900 leading-tight">
                  {planName}
                </p>
                <p className="text-[11px] text-slate-500 leading-tight">
                  {cardLimitLabel} cards used
                </p>
              </div>
              <a
                href="/dashboard/billing"
                className="text-[11px] font-semibold text-blue-600 no-underline bg-blue-50 rounded-full px-2 py-1 hover:bg-blue-100 transition-colors"
              >
                Upgrade
              </a>
            </div>
            <div className="mt-2 h-1 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{
                  width: cardLimit
                    ? `${Math.min((cardsUsed / cardLimit) * 100, 100)}%`
                    : "100%",
                }}
              />
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={handleSignOut}
          className={cn(
            "flex items-center gap-2.5 px-3 py-2 rounded-lg border-none bg-transparent text-sm font-normal text-slate-500 transition-colors cursor-pointer",
            collapsed ? "justify-center px-3" : "justify-start",
            "hover:bg-red-50 hover:text-red-600"
          )}
        >
          <LogOut size={16} />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "sticky top-0 h-screen overflow-hidden bg-white border-r border-slate-200 transition-all duration-200",
          collapsed ? "w-16" : "w-56"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[200] flex">
          <div className="flex-none w-60 bg-white border-r border-slate-200 h-screen overflow-hidden">
            <SidebarContent />
          </div>
          <div
            className="flex-1 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header
          className="sticky top-0 z-50 flex items-center justify-between gap-4 px-6 h-14 bg-white/95 backdrop-blur-sm border-b border-slate-200"
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="dashboard-menu-button p-1 bg-transparent border-none cursor-pointer text-slate-500"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 w-56">
              <Search size={14} className="text-slate-400" />
              <input
                placeholder="Search..."
                className="border-none bg-transparent text-sm text-slate-700 outline-none w-full"
              />
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setAnnouncementOpen((open) => !open)}
              className="relative p-1.5 bg-white border border-slate-200 rounded-lg cursor-pointer transition-colors hover:bg-slate-50"
            >
              <Bell size={16} className="text-slate-500" />
              {unreadAnnouncements > 0 && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-blue-600 border-[1.5px] border-white" />
              )}
            </button>
            {announcementOpen && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: 38,
                  width: 320,
                  maxWidth: "80vw",
                  background: "#fff",
                  border: "1px solid #E5E7EB",
                  borderRadius: 10,
                  boxShadow: "0 12px 30px rgba(15,23,42,0.12)",
                  zIndex: 80,
                  overflow: "hidden",
                }}
              >
                <div style={{ padding: "12px 14px", borderBottom: "1px solid #F3F4F6" }}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: "#111827" }}>Announcements</p>
                </div>
                {announcements.length === 0 ? (
                  <div style={{ padding: 18, fontSize: 13, color: "#6B7280" }}>
                    No announcements.
                  </div>
                ) : (
                  announcements.slice(0, 5).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => markAnnouncementRead(item.id)}
                      style={{
                        width: "100%",
                        border: "none",
                        borderTop: "1px solid #F3F4F6",
                        background: item.isRead ? "#fff" : "#f5f5f5",
                        padding: "12px 14px",
                        textAlign: "left",
                        cursor: "pointer",
                      }}
                    >
                      <p style={{ fontSize: 13, fontWeight: 800, color: "#111827" }}>{item.title}</p>
                      <p style={{ fontSize: 12, color: "#6B7280", marginTop: 3, lineHeight: 1.4 }}>{item.message}</p>
                    </button>
                  ))
                )}
              </div>
            )}
            </div>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 cursor-pointer hover:bg-slate-100 transition-colors">
              <div
                className="w-6.5 h-6.5 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-[11px] overflow-hidden"
                style={{ width: 26, height: 26 }}
              >
                {accountAvatar ? (
                  <img
                    src={accountAvatar}
                    alt={accountName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  accountInitials
                )}
              </div>
              <span className="text-sm font-medium text-slate-900">{accountName}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-7">{children}</main>
      </div>
    </div>
  );
}
