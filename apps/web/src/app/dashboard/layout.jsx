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
  Gem,
  Menu,
  X,
  Wallet,
  ShoppingBag,
} from "lucide-react";
import logo from "../../assets/jostap logo.png3.png";
import faviconMark from "../../assets/jostap favicon bg.png";
import { clearDashboardDataCache, getDashboardData } from "../../utils/dashboardDataStore";
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
  const [account, setAccount] = useState(null);
  const [billing, setBilling] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [readTrialNotices, setReadTrialNotices] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(window.localStorage.getItem("jostap_trial_notice_reads") || "[]");
    } catch {
      return [];
    }
  });
  const path = typeof window !== "undefined" ? window.location.pathname : "";

  const handleSignOut = async () => {
    clearDashboardDataCache();
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
    }).catch(() => {});

    window.location.href = "/auth/signin";
  };

  const markAnnouncementRead = async (id) => {
    if (String(id || "").startsWith("trial-")) {
      const next = Array.from(new Set([...readTrialNotices, id]));
      setReadTrialNotices(next);
      window.localStorage?.setItem("jostap_trial_notice_reads", JSON.stringify(next));
      return;
    }

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

    async function loadDashboardShell(force = false) {
      try {
        const data = await getDashboardData({ period: "7d", force });

        if (!active) return;

        setAccount(data.account || null);
        setBilling(data.billing || null);
        setAnnouncements(data.announcements?.announcements || []);

        if (data.account && !data.account.kycComplete) {
          window.location.href = "/kyc";
        }
      } catch (error) {
        if (active && error.status === 401) {
          window.location.href = "/auth/signin";
          return;
        }

        if (active) setAnnouncements([]);
      }
    }

    loadDashboardShell(true);
    const reloadDashboardShell = () => loadDashboardShell(true);
    window.addEventListener("jostap-cards-change", reloadDashboardShell);

    return () => {
      active = false;
      window.removeEventListener("jostap-cards-change", reloadDashboardShell);
    };
  }, []);

  const accountName = account?.name || "Account";
  const accountAvatar = account?.kyc?.avatarUrl || "";
  const planName =
    billing?.subscription?.plan === "trial"
      ? "Free Trial"
      : billing?.subscription?.plan === "custom_nfc"
        ? "Custom NFC"
        : billing?.subscription?.plan === "jostap_nfc"
          ? "JOSTAP NFC"
          : billing?.subscription?.plan === "premium_renewal"
            ? "Premium Renewal"
            : "Free";
  const cardLimit = billing?.subscription?.cardLimit ?? 5;
  const cardsUsed = billing?.usage?.cards ?? 0;
  const cardLimitLabel = cardLimit ? `${cardsUsed} / ${cardLimit}` : `${cardsUsed}`;
  const cardUsageProgress = cardLimit ? Math.min((cardsUsed / cardLimit) * 100, 100) : 100;
  const isPaidPremium =
    Boolean(billing?.subscription?.features?.hasPremiumFeatures) &&
    !["free", "trial"].includes(String(billing?.subscription?.plan || "free"));
  const accountInitials =
    accountName
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "ME";
  const trial = billing?.subscription?.trial;
  const trialAnnouncement =
    trial && billing?.subscription?.plan === "trial"
      ? {
          id: `trial-${trial.daysRemaining}`,
          title: trial.daysRemaining <= 1 ? "Your free trial ends soon" : "Free trial reminder",
          message:
            trial.daysRemaining <= 1
              ? "Your premium trial expires in 1 day. Upgrade to keep premium features active."
              : `${trial.daysRemaining} days left in your 14-day premium trial. Upgrade anytime to keep access after it ends.`,
          type: "warning",
          isRead: readTrialNotices.includes(`trial-${trial.daysRemaining}`),
        }
      : trial?.expired && billing?.subscription?.plan === "free"
        ? {
            id: "trial-expired",
            title: "Your free trial has ended",
            message: "Premium features are locked again. Upgrade to restore advanced cards, QR downloads, booking, and analytics.",
            type: "warning",
            isRead: readTrialNotices.includes("trial-expired"),
          }
        : null;
  const visibleAnnouncements = trialAnnouncement
    ? [trialAnnouncement, ...announcements]
    : announcements;
  const unreadAnnouncements = visibleAnnouncements.filter((item) => !item.isRead).length;

  const SidebarContent = ({ mobile = false } = {}) => {
    const sidebarCollapsed = mobile ? false : collapsed;

    return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Logo */}
      <div
        className={cn(
          "flex items-center border-b border-slate-200",
          sidebarCollapsed ? "px-4 py-5 justify-center" : "px-5 py-5 justify-between"
        )}
      >
        {!sidebarCollapsed && (
          <a
            href="/"
            className="flex items-center gap-2 no-underline"
          >
            <img
              src={logo}
              alt="JOSTAP"
              decoding="async"
              className="block w-24 h-10 object-contain"
            />
          </a>
        )}
        {sidebarCollapsed && (
          <img
            src={faviconMark}
            alt="JOSTAP"
            decoding="async"
            className="block w-7 h-7 object-contain"
          />
        )}
        {!mobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 bg-transparent border-none cursor-pointer text-slate-400 hover:text-slate-600 transition-colors"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}
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
                  sidebarCollapsed ? "justify-center px-3" : "justify-start"
                )}
                title={sidebarCollapsed ? label : ""}
              >
                <Icon size={17} />
                {!sidebarCollapsed && <span>{label}</span>}
              </a>
            );
          })}
        </div>
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-slate-200">
        {/* Plan badge */}
        {!sidebarCollapsed && (
          <div
            className={cn(
              "dashboard-plan-card",
              isPaidPremium ? "dashboard-plan-card--premium" : "dashboard-plan-card--free",
            )}
          >
            <div className="dashboard-plan-card__shine" aria-hidden="true" />
            <div className="dashboard-plan-card__row">
              <div>
                <p className="dashboard-plan-card__name">
                  {planName}
                </p>
                <p className="dashboard-plan-card__status">
                  {isPaidPremium
                    ? "Premium active"
                    : billing?.subscription?.plan === "trial"
                    ? `${billing.subscription.trial?.daysRemaining || 0} days left`
                    : `${cardLimitLabel} cards used`}
                </p>
              </div>
              {isPaidPremium ? (
                <span className="dashboard-plan-card__badge">
                  <Gem size={12} /> Premium
                </span>
              ) : (
                <a
                  href="/dashboard/billing"
                  className="dashboard-plan-card__upgrade"
                >
                  Upgrade
                </a>
              )}
            </div>
            <div className="dashboard-plan-card__meter">
              <div
                className="dashboard-plan-card__meter-fill"
                style={{ width: `${cardUsageProgress}%` }}
              />
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={handleSignOut}
          className={cn(
            "flex items-center gap-2.5 px-3 py-2 rounded-lg border-none bg-transparent text-sm font-normal text-slate-500 transition-colors cursor-pointer",
            sidebarCollapsed ? "justify-center px-3" : "justify-start",
            "hover:bg-red-50 hover:text-red-600"
          )}
        >
          <LogOut size={16} />
          {!sidebarCollapsed && <span>Sign out</span>}
        </button>
      </div>
    </div>
    );
  };

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
            <SidebarContent mobile />
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
                className="dashboard-announcements-menu"
              >
                <div style={{ padding: "12px 14px", borderBottom: "1px solid #F3F4F6" }}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: "#111827" }}>Announcements</p>
                </div>
                {visibleAnnouncements.length === 0 ? (
                  <div style={{ padding: 18, fontSize: 13, color: "#6B7280" }}>
                    No announcements.
                  </div>
                ) : (
                  visibleAnnouncements.slice(0, 5).map((item) => (
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
            <div className="dashboard-user-chip flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 cursor-pointer hover:bg-slate-100 transition-colors">
              <div
                className="w-6.5 h-6.5 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-[11px] overflow-hidden"
                style={{ width: 26, height: 26 }}
              >
                {accountAvatar ? (
                  <img
                    src={accountAvatar}
                    alt={accountName}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  accountInitials
                )}
              </div>
              <span className="dashboard-user-name text-sm font-medium text-slate-900">{accountName}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-7">{children}</main>
      </div>
    </div>
  );
}
