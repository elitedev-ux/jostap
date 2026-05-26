import { useState, useEffect } from "react";
import logo from "../assets/jostap logo.png3.png";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const links = [
    { label: "Features", href: "/#features" },
    { label: "Pricing", href: "/pricing" },
    { label: "FAQ", href: "/faq" },
  ];

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        backgroundColor: scrolled ? "rgba(255,255,255,0.96)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid #E5E7EB" : "1px solid transparent",
        transition: "all 0.2s",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          margin: "0 auto",
          padding: "0 clamp(18px,5vw,64px)",
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
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
              height: 44,
              width: 110,
              objectFit: "contain",
              objectPosition: "left center",
            }}
          />
        </a>

        <div
          className="site-navbar-links"
          style={{ display: "flex", alignItems: "center", gap: 32 }}
        >
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: "#6B7280",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => (e.target.style.color = "#111827")}
              onMouseLeave={(e) => (e.target.style.color = "#6B7280")}
            >
              {l.label}
            </a>
          ))}
        </div>

        <div
          className="site-navbar-actions"
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          <ThemeToggle compact />
          <a
            href="/auth/signin"
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "#374151",
              textDecoration: "none",
              padding: "8px 14px",
              borderRadius: 8,
            }}
          >
            Sign in
          </a>
          <a
            href="/auth/signup"
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#fff",
              textDecoration: "none",
              padding: "8px 18px",
              borderRadius: 8,
              background: "#2563EB",
            }}
          >
            Get Started
          </a>
        </div>
      </div>
    </nav>
  );
}
