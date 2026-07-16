import { useEffect, useState } from "react";
import { Calendar, CheckCircle, Clock, LockKeyhole, XCircle } from "lucide-react";
import { clearDashboardDataCache, getDashboardData } from "../../../utils/dashboardDataStore";

const PREMIUM_FEATURE_PLANS = new Set(["trial", "jostap_nfc", "custom_nfc", "basic_renewal", "premium_renewal"]);
const STATUS_FILTERS = ["all", "pending", "approved", "rejected", "cancelled", "completed"];
const APPOINTMENTS_PAGE_SIZE = 10;
const STATUS_ACTIONS = {
  pending: [
    ["approved", "Approve"],
    ["rejected", "Reject"],
  ],
  approved: [
    ["completed", "Mark completed"],
    ["cancelled", "Cancel"],
  ],
};

function hasPremiumFeatures(plan) {
  return PREMIUM_FEATURE_PLANS.has(String(plan || "").toLowerCase());
}
function statusLabel(status) {
  return String(status || "pending").replace(/^\w/, (letter) => letter.toUpperCase());
}

function appointmentDateTime(appointment) {
  if (appointment.startsAt) return new Date(appointment.startsAt).toLocaleString();
  return [appointment.appointmentDate, appointment.appointmentTime].filter(Boolean).join(" ");
}

function UpgradeGate() {
  return (
    <div className="ui-empty-state">
      <div className="ui-empty-state__icon">
        <LockKeyhole size={18} />
      </div>
      <p className="ui-empty-state__title">Appointment booking is a premium feature</p>
      <p className="ui-empty-state__copy">Upgrade to a JOSTAP Card plan to receive and manage appointment requests from your public card profiles.</p>
      <a href="/pricing" style={{ display: "inline-flex", marginTop: 16, background: "#0d6ffd", color: "#fff", borderRadius: 9, padding: "10px 16px", textDecoration: "none", fontSize: 13, fontWeight: 800 }}>
        Upgrade plan
      </a>
    </div>
  );
}
export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [locked, setLocked] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [busyId, setBusyId] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const [pageInfo, setPageInfo] = useState({ limit: APPOINTMENTS_PAGE_SIZE, offset: 0, total: 0, hasMore: false });
  const [counts, setCounts] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, cancelled: 0, completed: 0 });

  async function loadAppointments({ active = true, offset = 0, append = false } = {}) {
    try {
      const dashboardData = await getDashboardData({ period: "30d" });
      const billingData = dashboardData.billing || {};
      if (!active) return;
      const features = billingData.subscription?.features || {};
      const canUseAppointments = features.hasPremiumFeatures === undefined
        ? hasPremiumFeatures(billingData.subscription?.plan)
        : features.hasPremiumFeatures;
      if (!canUseAppointments) {
        setLocked(true);
        setAppointments([]);
        return;
      }
      setLocked(false);

      const params = new URLSearchParams({
        limit: String(APPOINTMENTS_PAGE_SIZE),
        offset: String(offset),
      });
      if (statusFilter !== "all") params.set("status", statusFilter);

      const response = await fetch(`/api/appointments?${params.toString()}`, { credentials: "same-origin" });
      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        if (active) setAppointments([]);
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "Unable to load appointments.");
      }

      if (active) {
        setAppointments((current) => (append ? [...current, ...(data.appointments || [])] : data.appointments || []));
        setPageInfo(data.pagination || { limit: APPOINTMENTS_PAGE_SIZE, offset, total: 0, hasMore: false });
        setCounts(data.counts || { total: 0, pending: 0, approved: 0, rejected: 0, cancelled: 0, completed: 0 });
        setLoadError("");
      }
    } catch (error) {
      if (error.status === 401) {
        window.location.href = "/auth/signin?callbackUrl=/dashboard/appointments";
        return;
      }

      if (active) {
        setAppointments([]);
        setLoadError(error.message || "Unable to load appointments.");
      }
    }
  }

  useEffect(() => {
    let active = true;
    setAppointments([]);
    loadAppointments({ active, offset: 0 });
    return () => {
      active = false;
    };
  }, [statusFilter]);

  const filteredAppointments = appointments;

  const loadMoreAppointments = async () => {
    setLoadingMore(true);
    try {
      await loadAppointments({ offset: appointments.length, append: true });
    } finally {
      setLoadingMore(false);
    }
  };

  const updateStatus = async (appointment, status) => {
    setBusyId(appointment.id);
    setLoadError("");
    try {
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Unable to update appointment.");
      clearDashboardDataCache();
      await loadAppointments({ offset: 0 });
    } catch (error) {
      setLoadError(error.message || "Unable to update appointment.");
    } finally {
      setBusyId("");
    }
  };

  if (locked) return <UpgradeGate />;

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", marginBottom: 3 }}>Appointments</h1>
          <p style={{ fontSize: 14, color: "#6B7280" }}>View and manage appointment requests from your public card profiles.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 14, marginBottom: 20 }}>
        {[
          [counts.total, "Total", "#0d6ffd", "#eaf3ff", Calendar],
          [counts.pending, "Pending", "#ff9f0d", "#FFFBEB", Clock],
          [counts.approved, "Approved", "#059669", "#ECFDF5", CheckCircle],
          [counts.completed, "Completed", "#0f172a", "#f5f5f5", CheckCircle],
        ].map(([val, label, color, bg, Icon]) => (
          <div key={label} style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "18px 20px" }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
              <Icon size={14} color={color} />
            </div>
            <p style={{ fontSize: 24, fontWeight: 700, color: "#111827", marginBottom: 3 }}>{val}</p>
            <p style={{ fontSize: 12, color: "#6B7280" }}>{label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {STATUS_FILTERS.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            style={{
              border: "1px solid #E5E7EB",
              borderRadius: 999,
              background: statusFilter === status ? "#0d6ffd" : "#fff",
              color: statusFilter === status ? "#fff" : "#374151",
              padding: "7px 12px",
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            {status === "all" ? "All" : statusLabel(status)}
          </button>
        ))}
      </div>

      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden" }}>
        {loadError && (
          <div style={{ background: "#FEF2F2", borderBottom: "1px solid #FECACA", color: "#B91C1C", fontSize: 13, fontWeight: 600, padding: "12px 16px" }}>
            {loadError}
          </div>
        )}

        {filteredAppointments.length === 0 ? (
          <div className="ui-empty-state" style={{ border: "none" }}>
            <div className="ui-empty-state__icon">
              <Calendar size={18} />
            </div>
            <p className="ui-empty-state__title">No appointments yet</p>
            <p className="ui-empty-state__copy">Appointment requests will appear here after visitors book from your cards.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {filteredAppointments.map((appointment, index) => {
              const actions = STATUS_ACTIONS[appointment.status] || [];
              return (
                <div
                  key={appointment.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.2fr 1fr 120px minmax(180px, auto)",
                    gap: 16,
                    padding: "16px 18px",
                    borderBottom: index < filteredAppointments.length - 1 ? "1px solid #F3F4F6" : "none",
                  }}
                >
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>{appointment.visitorName || appointment.guestName}</p>
                    <p style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{appointment.visitorEmail || appointment.guestEmail}</p>
                    {appointment.visitorPhone && <p style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{appointment.visitorPhone}</p>}
                    {appointment.appointmentMessage && <p style={{ fontSize: 12, color: "#4B5563", marginTop: 8, lineHeight: 1.5 }}>{appointment.appointmentMessage}</p>}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{appointment.cardName || "Card profile"}</p>
                    <p style={{ fontSize: 12, color: "#6B7280", marginTop: 5 }}>{appointmentDateTime(appointment) || "No date"}</p>
                  </div>
                  <span style={{ alignSelf: "start", justifySelf: "start", fontSize: 11, fontWeight: 800, color: "#0d6ffd", background: "#eaf3ff", borderRadius: 999, padding: "3px 8px" }}>
                    {statusLabel(appointment.status)}
                  </span>
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
                    {actions.length === 0 ? (
                      <span style={{ fontSize: 12, color: "#9CA3AF", alignSelf: "center" }}>No action</span>
                    ) : actions.map(([nextStatus, label]) => (
                      <button
                        key={nextStatus}
                        type="button"
                        onClick={() => updateStatus(appointment, nextStatus)}
                        disabled={busyId === appointment.id}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          border: "1px solid #E5E7EB",
                          borderRadius: 8,
                          background: "#fff",
                          color: nextStatus === "rejected" || nextStatus === "cancelled" ? "#B91C1C" : "#0d6ffd",
                          padding: "7px 10px",
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: busyId === appointment.id ? "wait" : "pointer",
                        }}
                      >
                        {nextStatus === "rejected" || nextStatus === "cancelled" ? <XCircle size={13} /> : <CheckCircle size={13} />}
                        {busyId === appointment.id ? "Saving..." : label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
            {pageInfo.hasMore && (
              <div style={{ display: "flex", justifyContent: "center", padding: 16, borderTop: "1px solid #F3F4F6" }}>
                <button
                  type="button"
                  onClick={loadMoreAppointments}
                  disabled={loadingMore}
                  style={{ border: "1px solid #E5E7EB", borderRadius: 8, background: "#fff", color: "#0d6ffd", padding: "8px 13px", fontSize: 13, fontWeight: 800, cursor: loadingMore ? "wait" : "pointer" }}
                >
                  {loadingMore ? "Loading..." : `Load more (${filteredAppointments.length}/${pageInfo.total})`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
