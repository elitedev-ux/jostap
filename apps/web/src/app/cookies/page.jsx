import Footer from "../../components/Footer";
import Navbar from "../../components/Navbar";
import "../info-pages.css";

export default function CookiesPage() {
  return (
    <div className="info-page">
      <Navbar />
      <main className="info-main">
        <section className="info-hero">
          <p className="info-kicker">Cookies</p>
          <h1>How JOSTAP uses cookies and local storage.</h1>
          <p>
            Cookies and similar storage help keep users signed in, protect sessions,
            remember app preferences, and understand basic product performance.
          </p>
        </section>

        <section className="info-grid">
          <article className="info-card">
            <h2>Essential Cookies</h2>
            <p>Used for authentication, security, session continuity, and preventing repeated verification prompts.</p>
          </article>
          <article className="info-card">
            <h2>Preference Storage</h2>
            <p>Used to remember interface choices and keep app workflows consistent between visits.</p>
          </article>
          <article className="info-card">
            <h2>Analytics Signals</h2>
            <p>Used to understand card views, QR scans, taps, and contact saves so users can see real engagement.</p>
          </article>
        </section>

        <section className="info-section info-panel">
          <h2>Managing Cookies</h2>
          <p>
            You can control cookies through your browser settings. Blocking essential cookies
            may prevent login, dashboard access, or support workflows from working correctly.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
