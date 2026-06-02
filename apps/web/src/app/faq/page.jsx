import Footer from "../../components/Footer";
import Navbar from "../../components/Navbar";
import "../info-pages.css";

const faqs = [
  ["What is JOSTAP?", "JOSTAP is a digital business card platform with public profiles, NFC card sharing, QR codes, contact saving, and analytics."],
  ["Do I need a physical card?", "No. You can use a free digital business card first. The JOSTAP Card adds a physical NFC card and premium features."],
  ["How does the QR code work?", "Each card QR code opens a public card page in the browser without requiring login."],
  ["Can admins create cards for customers?", "Yes. Admins can create cards, leave them unassigned, assign them to users, or reassign them later."],
  ["Can visitors book appointments?", "Premium card profiles can show appointment booking so visitors can submit a request from the public profile."],
  ["Where do support tickets go?", "Tickets submitted from the dashboard or Help Center appear in the admin support panel."],
];

export default function FaqPage() {
  return (
    <div className="info-page">
      <Navbar />
      <main className="info-main">
        <section className="info-hero">
          <p className="info-kicker">FAQ</p>
          <h1>Answers before you start sharing.</h1>
          <p>Quick answers about JOSTAP digital profiles, QR codes, NFC cards, accounts, and support.</p>
        </section>

        <section className="info-grid">
          {faqs.map(([question, answer]) => (
            <article className="info-card" key={question}>
              <h2>{question}</h2>
              <p>{answer}</p>
            </article>
          ))}
        </section>
      </main>
      <Footer />
    </div>
  );
}
