import { useEffect, useState } from "react";
import {
  BarChart3,
  Bell,
  Calendar,
  ClipboardList,
  CreditCard,
  Download,
  FileText,
  Gem,
  HelpCircle,
  Headphones,
  Home,
  KeyRound,
  Mail,
  Menu,
  Package,
  Palette,
  Search,
  Settings,
  Shield,
  Tags,
  Target,
  Users,
  X,
} from "lucide-react";
import logo from "../../assets/jostap logo.png3.png";
import faviconMark from "../../assets/jostap favicon bg.png";
import ThemeToggle from "../../components/ThemeToggle";

const NAV = [
  { label: "Overview", href: "/admin", icon: Home },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Cards", href: "/admin/cards", icon: CreditCard },
  { label: "Subscriptions", href: "/admin/subscriptions", icon: BarChart3 },
  { label: "Payments", href: "/admin/payments", icon: Package },
  { label: "Appointments", href: "/admin/appointments", icon: Calendar },
  { label: "Leads", href: "/admin/leads", icon: Target },
  { label: "Templates", href: "/admin/templates", icon: Palette },
  { label: "Premium", href: "/admin/premium", icon: Gem },
  { label: "Emails", href: "/admin/emails", icon: Mail },
  { label: "Pages", href: "/admin/pages", icon: FileText },
  { label: "FAQs", href: "/admin/faqs", icon: HelpCircle },
  { label: "Pricing", href: "/admin/pricing", icon: Tags },
  { label: "Reports", href: "/admin/reports", icon: Download },
  { label: "Audit", href: "/admin/audit", icon: ClipboardList },
  { label: "Notifications", href: "/admin/notifications", icon: Bell },
  { label: "Roles", href: "/admin/roles", icon: KeyRound },
  { label: "Support", href: "/admin/support", icon: Headphones },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const path = typeof window !== "undefined" ? window.location.pathname : "";

  useEffect(() => {
    let active = true;

    async function requireAdmin() {
      try {
        const response = await fetch("/api/auth/me", { credentials: "same-origin" });
        const data = await response.json().catch(() => ({}));

        if (response.status === 401) {
          window.location.href = "/auth/signin?callbackUrl=/admin";
          if (active) setCheckingAdmin(false);
          return;
        }

        if (!response.ok || data.user?.role !== "admin") {
          window.location.href = "/dashboard";
          if (active) setCheckingAdmin(false);
          return;
        }

        if (active) {
          setAdminUser(data.user);
          setCheckingAdmin(false);
        }
      } catch {
        if (active) {
          setCheckingAdmin(false);
          window.location.href = "/dashboard";
        }
      }
    }

    requireAdmin();

    return () => {
      active = false;
    };
  }, []);

  if (checkingAdmin) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F9FAFB",
          color: "#6B7280",
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        Checking admin access...
      </div>
    );
  }

  const Sidebar = () => (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          height: 68,
          padding: "14px 18px",
          borderBottom: "1px solid #E5E7EB",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <img src={logo} alt="JOSTAP" style={{ width: 104, height: 42, objectFit: "contain" }} />
      </div>
      <nav style={{ flex: 1, padding: "14px 10px", overflowY: "auto" }}>
        {NAV.map(({ label, href, icon: Icon }) => {
          const active = path === href || (href !== "/admin" && path.startsWith(href));
          return (
            <a
              key={href}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                textDecoration: "none",
                padding: "10px 12px",
                borderRadius: 8,
                color: active ? "#2563EB" : "#6B7280",
                background: active ? "#EFF6FF" : "transparent",
                fontSize: 13,
                fontWeight: active ? 700 : 500,
                marginBottom: 3,
              }}
            >
              <Icon size={17} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
            </a>
          );
        })}
      </nav>
      <div style={{ padding: 12, borderTop: "1px solid #E5E7EB" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "#F9FAFB",
            border: "1px solid #E5E7EB",
            borderRadius: 10,
            padding: 10,
          }}
        >
          <img src={faviconMark} alt="" style={{ width: 28, height: 28, borderRadius: 8 }} />
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>Admin Console</p>
            <p style={{ fontSize: 11, color: "#6B7280" }}>{adminUser?.email || "Admin access"}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#F9FAFB" }}>
      <aside
        className="admin-sidebar"
        style={{
          width: 244,
          flexShrink: 0,
          background: "#fff",
          borderRight: "1px solid #E5E7EB",
          height: "100vh",
          position: "sticky",
          top: 0,
        }}
      >
        <Sidebar />
      </aside>

      {mobileOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex" }}>
          <div style={{ width: 244, background: "#fff", height: "100vh" }}>
            <Sidebar />
          </div>
          <button
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            style={{ flex: 1, border: "none", background: "rgba(15,23,42,0.45)" }}
          />
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <header
          style={{
            height: 64,
            background: "rgba(255,255,255,0.94)",
            backdropFilter: "blur(8px)",
            borderBottom: "1px solid #E5E7EB",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
            position: "sticky",
            top: 0,
            zIndex: 40,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              className="admin-mobile-menu"
              onClick={() => setMobileOpen(true)}
              style={{
                display: "none",
                border: "1px solid #E5E7EB",
                background: "#fff",
                borderRadius: 8,
                width: 36,
                height: 36,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Menu size={18} />
            </button>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: 280,
                maxWidth: "50vw",
                background: "#F9FAFB",
                border: "1px solid #E5E7EB",
                borderRadius: 9,
                padding: "8px 12px",
              }}
            >
              <Search size={15} color="#9CA3AF" />
              <input
                placeholder="Search admin data..."
                style={{
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontSize: 13,
                  width: "100%",
                  color: "#374151",
                }}
              />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <a
              href="/dashboard"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                textDecoration: "none",
                color: "#374151",
                background: "#fff",
                border: "1px solid #E5E7EB",
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <Shield size={14} /> User App
            </a>
            <ThemeToggle compact />
          </div>
        </header>
        <main style={{ flex: 1, padding: "28px 24px" }}>{children}</main>
      </div>

      <style jsx global>{`
        @media (max-width: 860px) {
          .admin-sidebar { display: none !important; }
          .admin-mobile-menu { display: inline-flex !important; }
        }
      `}</style>
    </div>
  );
}
