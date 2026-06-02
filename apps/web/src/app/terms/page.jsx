import Footer from "../../components/Footer";
import Navbar from "../../components/Navbar";
import "../info-pages.css";

export default function TermsPage() {
  return (
    <div className="info-page">
      <Navbar />
      <main className="info-main">
        <section className="info-hero">
          <p className="info-kicker">Terms of Service</p>
          <h1>Rules for using JOSTAP.</h1>
          <p>
            These terms set the expectations for accounts, digital cards, NFC cards,
            public profiles, analytics, support, and responsible use of the platform.
          </p>
        </section>

        <section className="info-grid">
          <article className="info-card">
            <h2>Accounts</h2>
            <p>
              Users are responsible for accurate account information and for keeping login
              access secure. Admin-created cards may be assigned to users after registration.
            </p>
          </article>
          <article className="info-card">
            <h2>Published Content</h2>
            <p>
              Card profiles must not contain unlawful, misleading, abusive, or harmful
              content. JOSTAP may restrict cards that violate platform rules.
            </p>
          </article>
          <article className="info-card">
            <h2>Plans & Features</h2>
            <p>
              Free accounts include limited access. Premium card features, analytics, and
              additional capabilities may require a paid plan or NFC card purchase.
            </p>
          </article>
        </section>

        <section className="info-section info-panel">
          <h2>Platform Use</h2>
          <ul className="info-list">
            <li>Use QR codes, NFC links, and public card URLs only for legitimate contact sharing.</li>
            <li>Do not attempt to access admin areas, private data, or another user&apos;s dashboard.</li>
            <li>Do not upload or publish content that infringes third-party rights.</li>
            <li>Report technical or account problems through the Help Center.</li>
          </ul>
        </section>

        <section className="info-section info-panel">
          <h2>Support & Changes</h2>
          <p>
            JOSTAP may update these terms as the product evolves. Continued use of the
            platform means you accept the current terms shown on this page.
          </p>
          <div className="info-actions">
            <a className="info-button info-button--primary" href="/help">Contact Support</a>
            <a className="info-button" href="/privacy">Privacy Policy</a>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
