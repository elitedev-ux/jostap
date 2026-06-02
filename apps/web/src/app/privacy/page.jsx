import Footer from "../../components/Footer";
import Navbar from "../../components/Navbar";
import "../info-pages.css";

export default function PrivacyPage() {
  return (
    <div className="info-page">
      <Navbar />
      <main className="info-main">
        <section className="info-hero">
          <p className="info-kicker">Privacy Policy</p>
          <h1>How JOSTAP handles your information.</h1>
          <p>
            JOSTAP stores the information needed to create digital cards, public profiles,
            QR links, appointments, analytics, and support workflows. This page explains the
            practical privacy rules for users and visitors.
          </p>
        </section>

        <section className="info-grid">
          <article className="info-card">
            <h2>Account Data</h2>
            <p>
              We collect account details such as name, email, company, role, and plan status
              so users can manage cards and admins can provide support.
            </p>
          </article>
          <article className="info-card">
            <h2>Card Profile Data</h2>
            <p>
              Public cards may show names, headlines, contact links, addresses, socials,
              appointment options, and other information the card owner or admin publishes.
            </p>
          </article>
          <article className="info-card">
            <h2>Engagement Data</h2>
            <p>
              We record safe activity signals such as profile views, QR scans, link taps,
              and contact downloads to power user and admin analytics.
            </p>
          </article>
        </section>

        <section className="info-section info-panel">
          <h2>How Data Is Used</h2>
          <ul className="info-list">
            <li>To display digital business cards and public profile pages.</li>
            <li>To process card updates, assignments, support tickets, and admin actions.</li>
            <li>To improve security, prevent abuse, and troubleshoot technical issues.</li>
            <li>To send operational notifications such as support replies or card assignment notices.</li>
          </ul>
        </section>

        <section className="info-section info-panel">
          <h2>Your Choices</h2>
          <p>
            Users can update their card details from the dashboard. If you need help changing,
            reviewing, or removing information, open a support ticket from the Help Center.
          </p>
          <div className="info-actions">
            <a className="info-button info-button--primary" href="/help">Open a Ticket</a>
            <a className="info-button" href="/terms">Read Terms</a>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
