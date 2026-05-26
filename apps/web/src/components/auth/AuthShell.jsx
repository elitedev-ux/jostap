import { ArrowLeft } from "lucide-react";
import ThemeToggle from "../ThemeToggle";
import "./auth.css";

export default function AuthShell({
  children,
  mockup,
  mockupAlt,
  reverse = false,
}) {
  return (
    <main className="auth-page">
      <div className={`auth-card${reverse ? " auth-card--reverse" : ""}`}>
        <section className="auth-visual">
          <div className="auth-visual__mockup">
            <img src={mockup} alt={mockupAlt} />
          </div>
        </section>

        <section className="auth-form-panel">
          <div className="auth-form-panel__top">
            <a href="/" className="auth-back">
              <ArrowLeft size={14} /> Back to home
            </a>
            <ThemeToggle compact />
          </div>
          {children}
        </section>
      </div>
    </main>
  );
}
