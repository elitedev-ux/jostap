import { ArrowRight, Wifi } from "lucide-react";
import heroMockup from "../../assets/JOSTAP Design.png";
import { previewStats } from "./landingData";

export default function HeroSection() {
  return (
    <section className="landing-hero">
      <div className="landing-hero__copy">
        <h1 className="landing-hero__title">
          Your entire professional
          <br />
          identity, <span>one tap away.</span>
        </h1>

        <p className="landing-hero__text">
          JOSTAP NFC gives you a polished digital business card, real-time
          analytics, appointment booking, and lead capture, all from one smart
          card.
        </p>

        <div className="landing-actions">
          <a
            className="landing-button landing-button--primary"
            href="/checkout?plan=professional&billing=monthly"
          >
            Get Started Free <ArrowRight size={16} />
          </a>
          <a className="landing-button landing-button--secondary" href="/pricing">
            View Pricing
          </a>
        </div>

        <p className="landing-trust-note">
          No credit card required - 14-day free trial
        </p>
      </div>

      <div className="landing-hero__preview">
        <div className="landing-hero__preview-grid">
          <div className="landing-hero__mockup">
            <img
              src={heroMockup}
              alt="JOSTAP NFC card and digital profile mockup"
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
          </div>

          <div className="landing-hidden-card" aria-hidden="true">
            <div className="landing-hidden-card__circle landing-hidden-card__circle--top" />
            <div className="landing-hidden-card__circle landing-hidden-card__circle--bottom" />
            <div className="landing-hidden-card__avatar">JD</div>
            <p className="landing-hidden-card__name">Jordan Daley</p>
            <p className="landing-hidden-card__role">VP of Product - Arclite Inc.</p>
            <div className="landing-hidden-card__chips">
              {["LinkedIn", "Twitter", "Calendar"].map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
            <div className="landing-hidden-card__footer">
              <span>jostap.com/jordan</span>
              <div>
                <Wifi size={14} color="#0d6ffd" />
              </div>
            </div>
          </div>

          <div className="landing-preview-stats">
            {previewStats.map(([value, label]) => (
              <div className="landing-preview-stat" key={label}>
                <span>{value}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
