import { ArrowRight, BarChart3, CalendarDays, QrCode, Wifi } from "lucide-react";
import heroMockup from "../../assets/jostap-design.optimized.jpg";

export default function HeroSection() {
  const heroSignals = [
    { icon: <Wifi size={17} />, label: "NFC tap sharing" },
    { icon: <QrCode size={17} />, label: "QR profile backup" },
    { icon: <CalendarDays size={17} />, label: "Bookings built in" },
    { icon: <BarChart3 size={17} />, label: "Live analytics" },
  ];

  return (
    <section className="landing-hero">
      <div className="landing-hero__shape landing-hero__shape--left" aria-hidden="true" />
      <div className="landing-hero__shape landing-hero__shape--right" aria-hidden="true" />

      <div className="landing-hero__copy">
        <h1 className="landing-hero__title">
          Your smart digital identity
        </h1>

        <p className="landing-hero__tagline">one tap away.</p>

        <p className="landing-hero__text">
          JOSTAP turns one premium NFC card into your live digital profile,
          contact saver, booking link, and networking dashboard.
        </p>

        <div className="landing-actions">
          <a
            className="landing-button landing-button--primary"
            href="/auth/signup"
          >
            Get Started Free <ArrowRight size={16} />
          </a>
          <a className="landing-button landing-button--secondary" href="/pricing">
            View Pricing
          </a>
        </div>
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
          <div className="landing-hero-signals">
            {heroSignals.map((signal) => (
              <div className="landing-hero-signal" key={signal.label}>
                {signal.icon}
                <span>{signal.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
