import { useEffect, useMemo, useState } from "react";
import { Headphones, MessageSquare, Search, Send, TicketCheck } from "lucide-react";

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #E5E7EB",
  fontSize: 14,
  color: "#111827",
  outline: "none",
  background: "#fff",
  boxSizing: "border-box",
};

export default function UserSupportPage() {
  const [tickets, setTickets] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    subject: "",
    category: "General",
    priority: "normal",
    message: "",
  });
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const selectedTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === selectedId) || null,
    [tickets, selectedId],
  );

  const filteredTickets = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return tickets;

    return tickets.filter((ticket) =>
      [
        ticket.subject,
        ticket.message,
        ticket.category,
        ticket.priority,
        ticket.status,
        ...(ticket.messages || []).map((message) => message.message),
      ].some((item) => String(item || "").toLowerCase().includes(value)),
    );
  }, [tickets, search]);

  async function loadTickets() {
    const response = await fetch("/api/support", { credentials: "same-origin" });
    const data = await response.json().catch(() => ({}));

    if (response.status === 401) {
      window.location.href = "/auth/signin?callbackUrl=/dashboard/support";
      return;
    }

    if (!response.ok) {
      throw new Error(data.error || "Unable to load support tickets.");
    }

    const rows = data.tickets || [];
    setTickets(rows);
    setSelectedId((currentId) => {
      if (rows.some((ticket) => ticket.id === currentId)) return currentId;
      return rows[0]?.id || "";
    });
  }

  useEffect(() => {
    loadTickets().catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      loadTickets().catch((err) => setError(err.message));
    }, 15000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setSelectedId((currentId) => {
      if (filteredTickets.some((ticket) => ticket.id === currentId)) return currentId;
      return filteredTickets[0]?.id || "";
    });
  }, [filteredTickets]);

  const submitTicket = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/support", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Unable to submit ticket.");
      }

      setForm({ subject: "", category: "General", priority: "normal", message: "" });
      setNotice("Ticket submitted to admin support.");
      await loadTickets();
    } catch (err) {
      setError(err.message || "Unable to submit ticket.");
    } finally {
      setLoading(false);
    }
  };

  const sendReply = async () => {
    if (!selectedTicket || !reply.trim()) return;
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/support/${selectedTicket.id}/messages`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: reply.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Unable to send reply.");
      setReply("");
      setNotice("Reply sent.");
      await loadTickets();
    } catch (err) {
      setError(err.message || "Unable to send reply.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", marginBottom: 3 }}>
          Support
        </h1>
        <p style={{ fontSize: 14, color: "#6B7280" }}>
          Send account, billing, card, or profile issues directly to the admin team.
        </p>
      </div>

      {error && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C", borderRadius: 10, padding: "11px 14px", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
          {error}
        </div>
      )}
      {notice && (
        <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", color: "#047857", borderRadius: 10, padding: "11px 14px", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
          {notice}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 380px", gap: 20 }}>
        <section style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <Headphones size={17} color="#0d6ffd" />
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>Create Ticket</h2>
          </div>
          <form onSubmit={submitTicket} style={{ display: "grid", gap: 14 }}>
            <input
              value={form.subject}
              onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
              placeholder="Subject"
              required
              style={inputStyle}
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <select
                value={form.category}
                onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                style={inputStyle}
              >
                {["General", "Billing", "Cards", "Profile", "Security", "Bug"].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
              <select
                value={form.priority}
                onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}
                style={inputStyle}
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <textarea
              value={form.message}
              onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
              placeholder="Describe what happened..."
              rows={7}
              required
              style={{ ...inputStyle, resize: "vertical" }}
            />
            <button
              disabled={loading}
              type="submit"
              style={{ display: "inline-flex", alignItems: "center", gap: 7, width: "fit-content", background: "#0d6ffd", color: "#fff", border: "none", borderRadius: 9, padding: "10px 16px", fontSize: 14, fontWeight: 700, cursor: loading ? "wait" : "pointer" }}
            >
              <Send size={14} /> {loading ? "Submitting..." : "Submit Ticket"}
            </button>
          </form>
        </section>

        <section style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: 16, borderBottom: "1px solid #E5E7EB", display: "flex", alignItems: "center", gap: 8 }}>
            <TicketCheck size={17} color="#059669" />
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>Your Tickets</h2>
          </div>
          <div style={{ padding: 12, borderBottom: "1px solid #E5E7EB" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid #E5E7EB", borderRadius: 8, padding: "8px 10px" }}>
              <Search size={14} color="#9CA3AF" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search tickets"
                style={{ border: "none", outline: "none", flex: 1, fontSize: 13 }}
              />
            </label>
          </div>
          {tickets.length === 0 ? (
            <div className="ui-empty-state" style={{ border: "none", padding: "30px 10px" }}>
              <p className="ui-empty-state__title">No tickets yet</p>
              <p className="ui-empty-state__copy">Submitted tickets will appear here.</p>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="ui-empty-state" style={{ border: "none", padding: "30px 10px" }}>
              <p className="ui-empty-state__title">No tickets found</p>
              <p className="ui-empty-state__copy">Try a different search term.</p>
            </div>
          ) : (
            <>
              <div style={{ maxHeight: 200, overflowY: "auto", borderBottom: "1px solid #E5E7EB" }}>
                {filteredTickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    type="button"
                    onClick={() => setSelectedId(ticket.id)}
                    style={{
                      width: "100%",
                      border: "none",
                      borderTop: "1px solid #F3F4F6",
                      padding: "10px 12px",
                      textAlign: "left",
                      background: selectedId === ticket.id ? "#F8FAFC" : "#fff",
                      cursor: "pointer",
                    }}
                  >
                    <p style={{ fontSize: 13, fontWeight: 800, color: "#111827" }}>{ticket.subject}</p>
                    <p style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>
                      {ticket.category} - {ticket.priority}
                    </p>
                    <span style={{ display: "inline-flex", marginTop: 7, fontSize: 11, fontWeight: 800, color: "#0d6ffd", background: "#eaf3ff", borderRadius: 999, padding: "3px 8px" }}>
                      {ticket.status}
                    </span>
                  </button>
                ))}
              </div>

              <div style={{ padding: 12, maxHeight: 230, overflowY: "auto", background: "#f5f5f5" }}>
                {(selectedTicket?.messages || []).length === 0 ? (
                  <div className="ui-empty-state" style={{ border: "none", padding: "22px 10px" }}>
                    <p className="ui-empty-state__title">No replies yet</p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 8 }}>
                    {selectedTicket.messages.map((message) => {
                      const isAdmin = message.sender_role !== "user";
                      return (
                        <div key={message.id} style={{ marginLeft: isAdmin ? "auto" : 0, maxWidth: "82%", background: isAdmin ? "#eaf3ff" : "#fff", border: "1px solid #E5E7EB", borderRadius: 9, padding: "9px 10px", overflow: "hidden" }}>
                          <p style={{ fontSize: 11, color: "#6B7280", marginBottom: 3 }}>{isAdmin ? "Admin" : "You"}</p>
                          <p style={{ fontSize: 13, color: "#111827", lineHeight: 1.45, margin: 0, whiteSpace: "pre-wrap", overflowWrap: "anywhere", wordBreak: "break-word" }}>{message.message}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div style={{ padding: 12, borderTop: "1px solid #E5E7EB", display: "grid", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <MessageSquare size={14} color="#6B7280" />
                  <input
                    value={reply}
                    onChange={(event) => setReply(event.target.value)}
                    placeholder={selectedTicket ? "Reply to this ticket..." : "Select a ticket to reply"}
                    disabled={!selectedTicket}
                    style={{ ...inputStyle, padding: "8px 10px" }}
                  />
                </div>
                <button
                  type="button"
                  onClick={sendReply}
                  disabled={!selectedTicket || !reply.trim() || loading}
                  style={{ width: "fit-content", border: "none", background: "#0d6ffd", color: "#fff", borderRadius: 8, padding: "8px 12px", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: !selectedTicket || !reply.trim() ? 0.55 : 1 }}
                >
                  {loading ? "Sending..." : "Send Reply"}
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}
