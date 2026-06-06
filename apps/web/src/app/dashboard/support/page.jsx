import { useEffect, useMemo, useState } from "react";
import { Headphones, MessageSquare, RefreshCcw, Send, TicketCheck } from "lucide-react";

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
const SUPPORT_PAGE_SIZE = 10;

export default function UserSupportPage() {
  const [tickets, setTickets] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState({
    subject: "",
    category: "General",
    priority: "normal",
    message: "",
  });
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pageInfo, setPageInfo] = useState({ limit: SUPPORT_PAGE_SIZE, offset: 0, total: 0, hasMore: false });
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const selectedTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === selectedId) || null,
    [tickets, selectedId],
  );

  async function loadTickets({ offset = 0, append = false } = {}) {
    const params = new URLSearchParams({
      limit: String(SUPPORT_PAGE_SIZE),
      offset: String(offset),
    });
    const response = await fetch(`/api/support?${params.toString()}`, { credentials: "same-origin" });
    const data = await response.json().catch(() => ({}));

    if (response.status === 401) {
      window.location.href = "/auth/signin?callbackUrl=/dashboard/support";
      return;
    }

    if (!response.ok) {
      throw new Error(data.error || "Unable to load support tickets.");
    }

    const rows = data.tickets || [];
    const nextRows = append ? [...tickets, ...rows] : rows;
    setTickets(nextRows);
    setSelectedId((currentId) => {
      if (nextRows.some((ticket) => ticket.id === currentId)) return currentId;
      return nextRows[0]?.id || "";
    });
    setPageInfo(data.pagination || { limit: SUPPORT_PAGE_SIZE, offset, total: 0, hasMore: false });
    setError("");
  }

  useEffect(() => {
    loadTickets().catch((err) => setError(err.message));
  }, []);

  const refreshTickets = async () => {
    setRefreshing(true);
    setNotice("");
    try {
      await loadTickets({ offset: 0 });
    } catch (err) {
      setError(err.message || "Unable to refresh support tickets.");
    } finally {
      setRefreshing(false);
    }
  };

  const loadMoreTickets = async () => {
    setLoadingMore(true);
    try {
      await loadTickets({ offset: tickets.length, append: true });
    } catch (err) {
      setError(err.message || "Unable to load more support tickets.");
    } finally {
      setLoadingMore(false);
    }
  };

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
      await loadTickets({ offset: 0 });
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
      await loadTickets({ offset: 0 });
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

      <div
        className="support-dashboard-grid"
        style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 380px", gap: 20 }}
      >
        <section
          className="support-create-card"
          style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: 22, minWidth: 0 }}
        >
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
            <div className="support-form-split" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
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

        <section
          className="support-tickets-card"
          style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden", minWidth: 0 }}
        >
          <div style={{ padding: 16, borderBottom: "1px solid #E5E7EB", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <TicketCheck size={17} color="#059669" />
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>Your Tickets</h2>
            </div>
            <button
              type="button"
              onClick={refreshTickets}
              disabled={refreshing}
              title="Refresh tickets"
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, border: "1px solid #E5E7EB", borderRadius: 8, background: "#fff", color: "#6B7280", cursor: refreshing ? "wait" : "pointer" }}
            >
              <RefreshCcw size={14} style={{ transform: refreshing ? "rotate(45deg)" : "none" }} />
            </button>
          </div>
          {tickets.length === 0 ? (
            <div className="ui-empty-state" style={{ border: "none", padding: "30px 10px" }}>
              <p className="ui-empty-state__title">No tickets yet</p>
              <p className="ui-empty-state__copy">Submitted tickets will appear here.</p>
            </div>
          ) : (
            <>
              <div style={{ maxHeight: 200, overflowY: "auto", borderBottom: "1px solid #E5E7EB" }}>
                {tickets.map((ticket) => (
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
                {pageInfo.hasMore && (
                  <div style={{ padding: 10, borderTop: "1px solid #F3F4F6", display: "flex", justifyContent: "center" }}>
                    <button
                      type="button"
                      onClick={loadMoreTickets}
                      disabled={loadingMore}
                      style={{ border: "1px solid #E5E7EB", borderRadius: 8, background: "#fff", color: "#0d6ffd", padding: "7px 11px", fontSize: 12, fontWeight: 800, cursor: loadingMore ? "wait" : "pointer" }}
                    >
                      {loadingMore ? "Loading..." : `Load more (${tickets.length}/${pageInfo.total})`}
                    </button>
                  </div>
                )}
              </div>

              <div className="support-messages-panel" style={{ padding: 12, maxHeight: 230, overflowY: "auto", background: "#f5f5f5" }}>
                {(selectedTicket?.messages || []).length === 0 ? (
                  <div className="ui-empty-state" style={{ border: "none", padding: "22px 10px" }}>
                    <p className="ui-empty-state__title">No replies yet</p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 8 }}>
                    {selectedTicket.messages.map((message) => {
                      const isAdmin = message.sender_role !== "user";
                      return (
                        <div
                          className="support-message-bubble"
                          key={message.id}
                          style={{ marginLeft: isAdmin ? "auto" : 0, maxWidth: "82%", background: isAdmin ? "#eaf3ff" : "#fff", border: "1px solid #E5E7EB", borderRadius: 9, padding: "9px 10px", overflow: "hidden" }}
                        >
                          <p style={{ fontSize: 11, color: "#6B7280", marginBottom: 3 }}>{isAdmin ? "Admin" : "You"}</p>
                          <p style={{ fontSize: 13, color: "#111827", lineHeight: 1.45, margin: 0, whiteSpace: "pre-wrap", overflowWrap: "anywhere", wordBreak: "break-word" }}>{message.message}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="support-reply-panel" style={{ padding: 12, borderTop: "1px solid #E5E7EB", display: "grid", gap: 8 }}>
                <div className="support-reply-row" style={{ display: "flex", alignItems: "center", gap: 7 }}>
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
                  className="support-reply-button"
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
      <style jsx global>{`
        .support-dashboard-grid,
        .support-create-card,
        .support-tickets-card {
          min-width: 0;
          width: 100%;
        }

        .support-tickets-card button,
        .support-tickets-card p,
        .support-create-card input,
        .support-create-card select,
        .support-create-card textarea {
          max-width: 100%;
        }

        @media (max-width: 900px) {
          .support-dashboard-grid {
            grid-template-columns: minmax(0, 1fr) !important;
          }

          .support-tickets-card {
            order: 1;
          }

          .support-create-card {
            order: 2;
          }
        }

        @media (max-width: 520px) {
          .support-dashboard-grid {
            gap: 14px !important;
            padding-bottom: 72px;
          }

          .support-create-card {
            padding: 16px !important;
          }

          .support-form-split {
            grid-template-columns: minmax(0, 1fr) !important;
          }

          .support-messages-panel {
            max-height: 260px !important;
          }

          .support-message-bubble {
            max-width: 100% !important;
          }

          .support-reply-row {
            display: grid !important;
            grid-template-columns: 18px minmax(0, 1fr);
            align-items: center;
          }

          .support-reply-button {
            width: 100% !important;
            justify-content: center;
          }
        }
      `}</style>
    </>
  );
}
