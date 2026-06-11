import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import logo from "../assets/jostap logo.png3.png";
import "./Navbar.css";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.body.classList.add("site-navbar-menu-open");
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.classList.remove("site-navbar-menu-open");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const links = [
    { label: "Shop", href: "/shop" },
    { label: "Pricing", href: "/pricing" },
    { label: "FAQ", href: "/faq" },
    { label: "About", href: "/about" },
  ];
  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className={`site-navbar${scrolled ? " site-navbar--scrolled" : ""}${menuOpen ? " site-navbar--menu-open" : ""}`}>
      <div className="site-navbar__inner">
        <a href="/" className="site-navbar__brand" aria-label="JOSTAP home" onClick={closeMenu}>
          <img src={logo} alt="JOSTAP" decoding="async" />
        </a>

        <div className="site-navbar-links">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="site-navbar-actions">
          <a href="/auth/signin" className="site-navbar__signin">
            Sign in
          </a>
          <a href="/auth/signup" className="site-navbar__cta">
            Get Started
          </a>
        </div>

        <button
          className="site-navbar__menu-button"
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="site-navbar-mobile-menu"
          onClick={() => setMenuOpen((current) => !current)}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <button
        className="site-navbar__drawer-backdrop"
        type="button"
        aria-label="Close menu"
        tabIndex={menuOpen ? 0 : -1}
        onClick={closeMenu}
      />

      <aside
        id="site-navbar-mobile-menu"
        className="site-navbar__drawer"
        aria-hidden={!menuOpen}
      >
        <div className="site-navbar__drawer-head">
          <img src={logo} alt="JOSTAP" decoding="async" />
          <button type="button" aria-label="Close menu" onClick={closeMenu}>
            <X size={20} />
          </button>
        </div>

        <div className="site-navbar__drawer-links">
          {links.map((link) => (
            <a key={link.label} href={link.href} onClick={closeMenu}>
              {link.label}
            </a>
          ))}
        </div>

        <div className="site-navbar__drawer-actions">
          <a href="/auth/signin" className="site-navbar__drawer-signin" onClick={closeMenu}>
            Sign in
          </a>
          <a href="/auth/signup" className="site-navbar__drawer-cta" onClick={closeMenu}>
            Get Started
          </a>
        </div>
      </aside>
    </nav>
  );
}
