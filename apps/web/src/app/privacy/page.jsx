import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#fff" }}>
      <Navbar />
      <main style={{ maxWidth: 860, margin: "0 auto", padding: "120px 24px 72px" }}>
        <h1 style={{ fontSize: 38, fontWeight: 800, color: "#111827", marginBottom: 14 }}>Privacy Policy</h1>
        <p style={{ fontSize: 15, color: "#6B7280", lineHeight: 1.7, marginBottom: 28 }}>
          This privacy page is a polished placeholder for launch preparation and backend data mapping.
        </p>
        {[
          ["Profile Data", "Card names, roles, contact links, QR codes, and public slugs are used to render digital profiles."],
          ["Analytics", "Views, taps, scans, and referrers will be processed to provide dashboard insights after backend tracking is connected."],
          ["Payments", "Billing data will be handled through the payment provider and surfaced in the dashboard and admin panel."],
          ["Controls", "Users should be able to edit, delete, and manage their card data once persistence is connected."],
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
