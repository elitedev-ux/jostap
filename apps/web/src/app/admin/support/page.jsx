import { useEffect, useMemo, useState } from "react";
import { Filter, RefreshCcw, Send } from "lucide-react";

const panelStyle = {
  background: "#fff",
  border: "1px solid #E5E7EB",
  borderRadius: 12,
};

function statusColor(status) {
  if (status === "resolved") return { fg: "#047857", bg: "#ECFDF5" };
  if (status === "closed") return { fg: "#374151", bg: "#F3F4F6" };
  if (status === "pending") return { fg: "#1D4ED8", bg: "#eaf3ff" };
  return { fg: "#B45309", bg: "#FFFBEB" };
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [thread, setThread] = useState([]);
  const [threadTicket, setThreadTicket] = useState(null);
  const [filters, setFilters] = useState({ status: "", priority: "" });
  const [reply, setReply] = useState("");
  const [nextStatus, setNextStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const selectedTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === selectedId) || null,
    [tickets, selectedId],
  );

  const loadTickets = async () => {
    setError("");
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.priority) params.set("priority", filters.priority);

    const response = await fetch(`/api/admin/support?${params.toString()}`, {
      credentials: "same-origin",
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || "Unable to load support tickets.");
    }

    const rows = data.tickets || [];
    setTickets(rows);
    setError("");
    setSelectedId((currentId) => {
      if (rows.some((ticket) => ticket.id === currentId)) return currentId;
      return rows[0]?.id || "";
    });
  };

  const loadThread = async (id) => {
    if (!id) {
      setThread([]);
      setThreadTicket(null);
      return;
    }
    const response = await fetch(`/api/admin/support/${id}`, {
      credentials: "same-origin",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Unable to load ticket conversation.");
    setThread(data.messages || []);
    setThreadTicket(data.ticket || null);
  };

  useEffect(() => {
    loadTickets().catch((err) => setError(err.message));
  }, [filters.status, filters.priority]);

  useEffect(() => {
    loadThread(selectedId).catch((err) => setError(err.message));
  }, [selectedId]);

  const refreshSupport = async () => {
    setRefreshing(true);
    setError("");
    try {
      await loadTickets();
      if (selectedId) {
        await loadThread(selectedId);
      }
    } catch (err) {
      setError(err.message || "Unable to refresh support tickets.");
    } finally {
      setRefreshing(false);
    }
  };

  const patchStatus = async (id, status) => {
    const response = await fetch(`/api/admin/support/${id}`, {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Unable to update ticket status.");
  };

  const sendReply = async () => {
    if (!selectedId || !reply.trim()) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/support/${selectedId}/reply`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: reply.trim(),
          status: nextStatus || undefined,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Unable to send reply.");

      setReply("");
      setNextStatus("");
      await loadTickets();
      await loadThread(selectedId);
    } catch (err) {
      setError(err.message || "Unable to send reply.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", marginBottom: 4 }}>Support Tickets</h1>
        <p style={{ fontSize: 14, color: "#6B7280" }}>
          View, reply, and update ticket statuses across all users.
        </p>
      </div>

      {error && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C", borderRadius: 10, padding: "11px 14px", fontSize: 13, fontWeight: 700, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "340px minmax(0,1fr)", gap: 18 }}>
        <section style={{ ...panelStyle, overflow: "hidden" }}>
          <div style={{ padding: 14, borderBottom: "1px solid #E5E7EB", display: "grid", gap: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8 }}>
              <select
                value={filters.status}
                onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
                style={{ border: "1px solid #E5E7EB", borderRadius: 8, padding: "8px 10px", fontSize: 13 }}
              >
                <option value="">All Statuses</option>
                <option value="open">Open</option>
                <option value="pending">Pending</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              <select
                value={filters.priority}
                onChange={(event) => setFilters((current) => ({ ...current, priority: event.target.value }))}
                style={{ border: "1px solid #E5E7EB", borderRadius: 8, padding: "8px 10px", fontSize: 13 }}
              >
                <option value="">All Priority</option>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
              <button
                type="button"
                onClick={refreshSupport}
                disabled={refreshing}
                title="Refresh tickets"
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 36, border: "1px solid #E5E7EB", borderRadius: 8, background: "#fff", color: "#6B7280", cursor: refreshing ? "wait" : "pointer" }}
              >
                <RefreshCcw size={14} style={{ transform: refreshing ? "rotate(45deg)" : "none" }} />
              </button>
            </div>
          </div>

          <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
            {tickets.length === 0 && (
              <div className="ui-empty-state" style={{ border: "none", padding: "32px 12px" }}>
                <p className="ui-empty-state__title">No tickets found</p>
                <p className="ui-empty-state__copy">Try resetting the status or priority filters.</p>
              </div>
            )}
            {tickets.map((ticket) => {
              const colors = statusColor(ticket.status);
              const selected = ticket.id === selectedId;
              return (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => setSelectedId(ticket.id)}
                  style={{
                    width: "100%",
                    border: "none",
                    borderTop: "1px solid #F3F4F6",
                    background: selected ? "#F8FAFC" : "#fff",
                    textAlign: "left",
                    padding: "12px 14px",
                    cursor: "pointer",
                  }}
                >
                  <p style={{ fontSize: 13, fontWeight: 800, color: "#111827" }}>{ticket.subject}</p>
                  <p style={{ fontSize: 12, color: "#374151", marginTop: 3, fontWeight: 700 }}>{ticket.contactName || ticket.account}</p>
                  {ticket.contactEmail && (
                    <p style={{ fontSize: 12, color: "#0d6ffd", marginTop: 2 }}>{ticket.contactEmail}</p>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: colors.fg, background: colors.bg, borderRadius: 999, padding: "3px 7px" }}>
                      {ticket.status}
                    </span>
                    <span style={{ fontSize: 11, color: "#9CA3AF" }}>{ticket.priority}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section style={{ ...panelStyle, display: "grid", gridTemplateRows: "auto 1fr auto", minHeight: "72vh" }}>
          <div style={{ padding: 16, borderBottom: "1px solid #E5E7EB" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: "#111827" }}>
                  {threadTicket?.subject || selectedTicket?.subject || "Select a ticket"}
                </h2>
                <p style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>
                  {threadTicket?.contactName || selectedTicket?.contactName || threadTicket?.account || selectedTicket?.account || ""}
                </p>
                {(threadTicket?.contactEmail || selectedTicket?.contactEmail) && (
                  <a
                    href={`mailto:${threadTicket?.contactEmail || selectedTicket?.contactEmail}`}
                    style={{ display: "inline-flex", marginTop: 5, color: "#0d6ffd", fontSize: 12, fontWeight: 800, textDecoration: "none" }}
                  >
                    {threadTicket?.contactEmail || selectedTicket?.contactEmail}
                  </a>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Filter size={14} color="#6B7280" />
                <select
                  value={nextStatus || threadTicket?.status || ""}
                  onChange={(event) => setNextStatus(event.target.value)}
                  style={{ border: "1px solid #E5E7EB", borderRadius: 8, padding: "7px 9px", fontSize: 12 }}
                >
                  <option value="">Keep current status</option>
                  <option value="open">Open</option>
                  <option value="pending">Pending</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                {threadTicket?.id && (
                  <button
                    type="button"
                    onClick={() => patchStatus(threadTicket.id, nextStatus || "pending").then(() => loadTickets()).then(() => loadThread(threadTicket.id)).catch((err) => setError(err.message))}
                    style={{ border: "1px solid #E5E7EB", background: "#fff", borderRadius: 8, padding: "7px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                  >
                    Update
                  </button>
                )}
              </div>
            </div>
          </div>

          <div style={{ padding: 14, overflowY: "auto", background: "#f5f5f5" }}>
            {thread.length === 0 ? (
              <div className="ui-empty-state" style={{ border: "none", padding: "32px 12px" }}>
                <p className="ui-empty-state__title">No conversation yet</p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {thread.map((message) => {
                  const isAdmin = message.sender_role === "admin" || message.sender_role === "system";
                  return (
                    <div
                      key={message.id}
                      style={{
                        marginLeft: isAdmin ? "auto" : 0,
                        maxWidth: "82%",
                        background: isAdmin ? "#eaf3ff" : "#fff",
                        border: "1px solid #E5E7EB",
                        borderRadius: 10,
                        padding: "10px 12px",
                        overflow: "hidden",
                      }}
                    >
                      <p style={{ fontSize: 11, color: "#6B7280", marginBottom: 4 }}>
                        {message.sender || message.sender_role}
                      </p>
                      <p style={{ fontSize: 13, color: "#111827", lineHeight: 1.45, margin: 0, whiteSpace: "pre-wrap", overflowWrap: "anywhere", wordBreak: "break-word" }}>{message.message}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ padding: 14, borderTop: "1px solid #E5E7EB", display: "grid", gap: 10 }}>
            <textarea
              value={reply}
              onChange={(event) => setReply(event.target.value)}
              placeholder={selectedId ? "Type your reply to user..." : "Select a ticket to reply"}
              rows={3}
              disabled={!selectedId}
              style={{ border: "1px solid #E5E7EB", borderRadius: 10, padding: "10px 12px", fontSize: 13, resize: "vertical", outline: "none" }}
            />
            <button
              type="button"
              disabled={!selectedId || !reply.trim() || loading}
              onClick={sendReply}
              style={{ width: "fit-content", display: "inline-flex", alignItems: "center", gap: 7, border: "none", borderRadius: 8, background: "#0d6ffd", color: "#fff", padding: "9px 13px", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: !selectedId || !reply.trim() ? 0.55 : 1 }}
            >
              <Send size={13} /> {loading ? "Sending..." : "Send Reply"}
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
