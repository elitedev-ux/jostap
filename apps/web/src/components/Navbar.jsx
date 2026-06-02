import { useState, useEffect } from "react";
import logo from "../assets/jostap logo.png3.png";
import "./Navbar.css";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const links = [
    { label: "Pricing", href: "/pricing" },
    { label: "FAQ", href: "/faq" },
    { label: "About", href: "/about" },
  ];

  return (
    <nav className={`site-navbar${scrolled ? " site-navbar--scrolled" : ""}`}>
      <div className="site-navbar__inner">
        <a href="/" className="site-navbar__brand" aria-label="JOSTAP home">
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
      </div>
    </nav>
  );
}
