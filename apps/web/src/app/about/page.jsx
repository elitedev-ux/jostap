import Footer from "../../components/Footer";
import Navbar from "../../components/Navbar";
import "../info-pages.css";

export default function AboutPage() {
  return (
    <div className="info-page">
      <Navbar />
      <main className="info-main">
        <section className="info-hero">
          <p className="info-kicker">About JOSTAP</p>
          <h1>Digital business cards built for modern networking.</h1>
          <p>
            JOSTAP helps professionals replace paper cards with NFC sharing, QR codes,
            public profiles, appointment requests, and practical analytics.
          </p>
        </section>

        <section className="info-grid">
          <article className="info-card">
            <h2>What We Build</h2>
            <p>
              Every JOSTAP card combines a physical NFC card with a digital profile that
              can be shared by tap, QR scan, or direct link.
            </p>
          </article>
          <article className="info-card">
            <h2>Who It Is For</h2>
            <p>
              Founders, creators, consultants, teams, salespeople, and service
              professionals who need a faster way to exchange information.
            </p>
          </article>
          <article className="info-card">
            <h2>Our Standard</h2>
            <p>
              Clean design, reliable links, simple dashboards, and support workflows that
              make card management easier for users and admins.
            </p>
          </article>
        </section>

        <section className="info-section info-panel">
          <h2>Why JOSTAP Exists</h2>
          <p>
            Paper cards are easy to lose and hard to update. JOSTAP gives each person a
            living profile that can be edited after printing, shared instantly, and
            measured through real engagement activity.
          </p>
          <div className="info-actions">
            <a className="info-button info-button--primary" href="/pricing">View Pricing</a>
            <a className="info-button" href="/contact">Contact Us</a>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
