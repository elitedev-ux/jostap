import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function TermsPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#fff" }}>
      <Navbar />
      <main style={{ maxWidth: 860, margin: "0 auto", padding: "120px 24px 72px" }}>
        <h1 style={{ fontSize: 38, fontWeight: 800, color: "#111827", marginBottom: 14 }}>Terms of Service</h1>
        <p style={{ fontSize: 15, color: "#6B7280", lineHeight: 1.7, marginBottom: 28 }}>
          This frontend-ready terms page gives you a clean legal placeholder before backend and legal review.
        </p>
        {[
          ["Accounts", "Users are responsible for maintaining accurate account information and protecting their login credentials."],
          ["Digital Cards", "Published profiles, QR codes, and NFC links should not contain unlawful, misleading, or abusive content."],
          ["Billing", "Subscription and NFC card order billing will be governed by the payment provider once backend integration is connected."],
          ["Availability", "Service availability, analytics accuracy, and support workflows will be finalized during backend implementation."],
        ].map(([title, copy]) => (
          <section key={title} style={{ borderTop: "1px solid #E5E7EB", padding: "22px 0" }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111827", marginBottom: 8 }}>{title}</h2>
            <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.7 }}>{copy}</p>
          </section>
        ))}
      </main>
      <Footer />
    </div>
  );
}
