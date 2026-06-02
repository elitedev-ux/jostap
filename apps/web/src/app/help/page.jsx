import { useState } from "react";
import Footer from "../../components/Footer";
import Navbar from "../../components/Navbar";
import "../info-pages.css";

const categories = ["General", "Card setup", "QR code", "Billing", "Login", "Appointment booking"];

export default function HelpPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    category: "General",
    priority: "normal",
    message: "",
  });
  const [state, setState] = useState({ loading: false, error: "", success: "" });

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submitTicket = async (event) => {
    event.preventDefault();
    setState({ loading: true, error: "", success: "" });

    try {
      const response = await fetch("/api/support/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Unable to submit your ticket.");
      }

      setForm({ name: "", email: "", subject: "", category: "General", priority: "normal", message: "" });
      setState({ loading: false, error: "", success: "Ticket submitted. The admin support team will review it from the dashboard." });
    } catch (error) {
      setState({ loading: false, error: error.message || "Unable to submit your ticket.", success: "" });
    }
  };

  return (
    <div className="info-page">
      <Navbar />
      <main className="info-main">
        <section className="info-hero">
          <p className="info-kicker">Help Center</p>
          <h1>Get help with your JOSTAP card.</h1>
          <p>
            Search the common guidance below or open a ticket. Tickets submitted here are
            sent directly to the admin support dashboard.
          </p>
        </section>

        <section className="info-grid">
          <article className="info-card">
            <h2>QR Code Issues</h2>
            <p>Make sure your card is published and scan the QR in good light. QR links should open the public card page.</p>
          </article>
          <article className="info-card">
            <h2>Card Profile Updates</h2>
            <p>Edit your card from My Cards. Admin-created cards appear in your dashboard once assigned to your account.</p>
          </article>
          <article className="info-card">
            <h2>Billing & Premium</h2>
            <p>Free accounts include one digital card. Premium features unlock with JOSTAP Card access.</p>
          </article>
        </section>

        <section className="info-section info-panel">
          <h2>Open a Support Ticket</h2>
          <p style={{ marginBottom: 18 }}>
            Describe the issue clearly. Include the card name, public link, or account email if it helps the admin team investigate faster.
          </p>
          <form className="info-form" onSubmit={submitTicket}>
            <label>
              Name
              <input required value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Your name" />
            </label>
            <label>
              Email
              <input required type="email" value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="you@example.com" />
            </label>
            <label>
              Subject
              <input required value={form.subject} onChange={(event) => update("subject", event.target.value)} placeholder="What do you need help with?" />
            </label>
            <label>
              Category
              <select value={form.category} onChange={(event) => update("category", event.target.value)}>
                {categories.map((category) => <option key={category}>{category}</option>)}
              </select>
            </label>
            <label>
              Priority
              <select value={form.priority} onChange={(event) => update("priority", event.target.value)}>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </label>
            <label>
              Message
              <textarea required value={form.message} onChange={(event) => update("message", event.target.value)} placeholder="Tell us what happened..." />
            </label>
            {state.error && <p className="info-message info-message--error">{state.error}</p>}
            {state.success && <p className="info-message info-message--success">{state.success}</p>}
            <button className="info-button info-button--primary" type="submit" disabled={state.loading}>
              {state.loading ? "Submitting..." : "Submit Ticket"}
            </button>
          </form>
        </section>
      </main>
      <Footer />
    </div>
  );
}
