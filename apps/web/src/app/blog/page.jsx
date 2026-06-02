import Footer from "../../components/Footer";
import Navbar from "../../components/Navbar";
import "../info-pages.css";

const posts = [
  {
    tag: "Networking",
    title: "How NFC cards make follow-up faster",
    desc: "A practical look at replacing paper card exchanges with tap-to-share profiles, saved contacts, and appointment links.",
  },
  {
    tag: "Profiles",
    title: "What to include on a digital business card",
    desc: "The essential profile sections professionals should complete before sharing a JOSTAP card at events or meetings.",
  },
  {
    tag: "Analytics",
    title: "Reading QR scans and profile views correctly",
    desc: "How to use engagement data to understand which conversations, events, and links are working.",
  },
];

export default function BlogPage() {
  return (
    <div className="info-page">
      <Navbar />
      <main className="info-main">
        <section className="info-hero">
          <p className="info-kicker">Blog</p>
          <h1>Ideas for smarter business card sharing.</h1>
          <p>
            Notes from the JOSTAP team on NFC cards, QR profiles, networking,
            appointment booking, and digital identity.
          </p>
        </section>

        <section className="info-article-list">
          {posts.map((post) => (
            <article className="info-article" key={post.title}>
              <small>{post.tag}</small>
              <h2>{post.title}</h2>
              <p>{post.desc}</p>
            </article>
          ))}
        </section>
      </main>
      <Footer />
    </div>
  );
}
