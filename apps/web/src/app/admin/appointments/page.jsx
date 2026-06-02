import { useEffect, useMemo, useState } from "react";
import { Calendar, CheckCircle, RefreshCcw, XCircle } from "lucide-react";

const STATUS_FILTERS = ["all", "pending", "approved", "rejected", "cancelled", "completed"];
const STATUS_ACTIONS = ["pending", "approved", "rejected", "cancelled", "completed"];

function statusLabel(status) {
  return String(status || "pending").replace(/^\w/, (letter) => letter.toUpperCase());
}

function appointmentDateTime(appointment) {
  if (appointment.starts_at) return new Date(appointment.starts_at).toLocaleString();
  return [appointment.appointmentDate, appointment.appointmentTime].filter(Boolean).join(" ");
}

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loadError, setLoadError] = useState("");
  const [busyId, setBusyId] = useState("");

  async function load() {
    setLoadError("");
    try {
      const response = await fetch("/api/admin/overview", { credentials: "same-origin" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Unable to load admin appointments.");
      setAppointments(data.appointments || []);
    } catch (error) {
      setLoadError(error.message || "Unable to load admin appointments.");
      setAppointments([]);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const counts = useMemo(
    () =>
      appointments.reduce(
        (items, appointment) => {
          const status = appointment.status || "pending";
          items.total += 1;
          items[status] = (items[status] || 0) + 1;
          return items;
        },
        { total: 0, pending: 0, approved: 0, rejected: 0, cancelled: 0, completed: 0 },
      ),
    [appointments],
  );

  const rows = appointments.filter((appointment) =>
    statusFilter === "all" ? true : appointment.status === statusFilter,
  );

  const updateStatus = async (appointment, status) => {
    setBusyId(appointment.id);
    setLoadError("");
    try {
      const response = await fetch(`/api/admin/appointments/${appointment.id}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Unable to update appointment.");
      await load();
    } catch (error) {
      setLoadError(error.message || "Unable to update appointment.");
    } finally {
      setBusyId("");
    }
  };

  return (
    <>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", marginBottom: 4 }}>Appointments</h1>
          <p style={{ fontSize: 14, color: "#6B7280" }}>Manage appointment requests across all user cards.</p>
        </div>
        <button onClick={load} style={{ display: "inline-flex", alignItems: "center", gap: 7, border: "1px solid #E5E7EB", background: "#fff", borderRadius: 9, padding: "9px 13px", fontSize: 13, fontWeight: 700, color: "#374151", cursor: "pointer", height: 38 }}>
          <RefreshCcw size={14} /> Refresh
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, marginBottom: 20 }}>
        {[
          ["Total", counts.total, "#0d6ffd", "#eaf3ff"],
          ["Pending", counts.pending, "#ff9f0d", "#FFFBEB"],
          ["Approved", counts.approved, "#047857", "#ECFDF5"],
          ["Completed", counts.completed, "#0f172a", "#f5f5f5"],
        ].map(([label, value, color, bg]) => (
          <div key={label} style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: 18 }}>
            <p style={{ fontSize: 24, fontWeight: 800, color: "#111827" }}>{value}</p>
            <p style={{ fontSize: 12, color, background: bg, borderRadius: 999, display: "inline-flex", padding: "3px 9px", fontWeight: 800, marginTop: 8 }}>{label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {STATUS_FILTERS.map((status) => (
          <button key={status} type="button" onClick={() => setStatusFilter(status)} style={{ border: "1px solid #E5E7EB", borderRadius: 999, background: statusFilter === status ? "#0d6ffd" : "#fff", color: statusFilter === status ? "#fff" : "#374151", padding: "7px 12px", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
            {status === "all" ? "All" : statusLabel(status)}
          </button>
        ))}
      </div>

      {loadError && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C", borderRadius: 10, padding: "11px 14px", fontSize: 13, fontWeight: 700, marginBottom: 16 }}>{loadError}</div>}

      <section style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden" }}>
        {rows.length === 0 ? (
          <div className="ui-empty-state" style={{ border: "none" }}>
            <div className="ui-empty-state__icon"><Calendar size={18} /></div>
            <p className="ui-empty-state__title">No appointments yet</p>
            <p className="ui-empty-state__copy">Booked appointment requests will appear here.</p>
          </div>
        ) : (
          rows.map((appointment, index) => (
            <div key={appointment.id} style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 120px minmax(260px, auto)", gap: 16, padding: "16px 18px", borderTop: index ? "1px solid #F3F4F6" : "none" }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>{appointment.visitorName || appointment.guest_name}</p>
                <p style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{appointment.visitorEmail || appointment.guest_email}</p>
                {appointment.visitorPhone && <p style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{appointment.visitorPhone}</p>}
                {appointment.appointmentMessage && <p style={{ fontSize: 12, color: "#4B5563", marginTop: 8, lineHeight: 1.5 }}>{appointment.appointmentMessage}</p>}
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 800, color: "#111827" }}>{appointment.owner}</p>
                <p style={{ fontSize: 12, color: "#6B7280", marginTop: 5 }}>{appointmentDateTime(appointment) || appointment.starts || "No date"}</p>
              </div>
              <span style={{ alignSelf: "start", justifySelf: "start", fontSize: 11, fontWeight: 800, color: "#0d6ffd", background: "#eaf3ff", borderRadius: 999, padding: "3px 8px" }}>
                {statusLabel(appointment.status)}
              </span>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
                {STATUS_ACTIONS.filter((status) => status !== appointment.status).map((status) => (
                  <button key={status} type="button" onClick={() => updateStatus(appointment, status)} disabled={busyId === appointment.id} style={{ display: "inline-flex", alignItems: "center", gap: 5, border: "1px solid #E5E7EB", borderRadius: 8, background: "#fff", color: status === "rejected" || status === "cancelled" ? "#B91C1C" : "#0d6ffd", padding: "7px 10px", fontSize: 12, fontWeight: 800, cursor: busyId === appointment.id ? "wait" : "pointer" }}>
                    {status === "rejected" || status === "cancelled" ? <XCircle size={13} /> : <CheckCircle size={13} />}
                    {busyId === appointment.id ? "Saving..." : statusLabel(status)}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </section>
    </>
  );
}
