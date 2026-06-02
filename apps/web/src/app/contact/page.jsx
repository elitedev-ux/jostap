import Footer from "../../components/Footer";
import Navbar from "../../components/Navbar";
import "../info-pages.css";

export default function ContactPage() {
  return (
    <div className="info-page">
      <Navbar />
      <main className="info-main">
        <section className="info-hero">
          <p className="info-kicker">Contact</p>
          <h1>Talk to JOSTAP support or sales.</h1>
          <p>
            Need help ordering a card, setting up a public profile, or managing a user
            account? Send a support ticket from the Help Center and the admin team can
            respond from the dashboard.
          </p>
        </section>

        <section className="info-grid">
          <article className="info-card">
            <h2>Support</h2>
            <p>Use the Help Center for card setup, login, QR code, billing, and account questions.</p>
            <div className="info-actions">
              <a className="info-button info-button--primary" href="/help">Open Help Center</a>
            </div>
          </article>
          <article className="info-card">
            <h2>Orders</h2>
            <p>For JOSTAP Card orders, include your name, email, preferred card details, and delivery notes.</p>
          </article>
          <article className="info-card">
            <h2>Existing Users</h2>
            <p>Signed-in users can also open and track tickets from the dashboard support page.</p>
            <div className="info-actions">
              <a className="info-button" href="/dashboard/support">Dashboard Support</a>
            </div>
          </article>
        </section>
      </main>
      <Footer />
    </div>
  );
}
