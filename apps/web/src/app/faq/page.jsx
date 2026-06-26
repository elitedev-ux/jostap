import Footer from "../../components/Footer";
import Navbar from "../../components/Navbar";
import { faqs } from "../../components/landing/landingData";
import "../info-pages.css";

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
          {faqs.map(({ question, answer }) => (
            <article className="info-card" key={question}>
              <h2>{question}</h2>
              {answer.split("\n\n").map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </article>
          ))}
        </section>
      </main>
      <Footer />
    </div>
  );
}
