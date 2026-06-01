import { useEffect, useState } from "react";
import { Calendar, Check, Clock, ExternalLink, LockKeyhole, Plus, User } from "lucide-react";

const PREMIUM_FEATURE_PLANS = new Set(["jostap_nfc", "custom_nfc", "premium_renewal"]);

function hasPremiumFeatures(plan) {
  return PREMIUM_FEATURE_PLANS.has(String(plan || "").toLowerCase());
}

function UpgradeGate() {
  return (
    <div className="ui-empty-state">
      <div className="ui-empty-state__icon">
        <LockKeyhole size={18} />
      </div>
      <p className="ui-empty-state__title">Appointment booking is a premium feature</p>
      <p className="ui-empty-state__copy">Upgrade to a JOSTAP NFC plan to add booking links and monitor appointment activity.</p>
      <a href="/pricing" style={{ display: "inline-flex", marginTop: 16, background: "#2563EB", color: "#fff", borderRadius: 9, padding: "10px 16px", textDecoration: "none", fontSize: 13, fontWeight: 800 }}>
        Upgrade plan
      </a>
    </div>
  );
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [flashMessage, setFlashMessage] = useState("");
  const [locked, setLocked] = useState(null);
  const [calendarStatus, setCalendarStatus] = useState({
    loading: true,
    configured: false,
    connected: false,
    email: "",
  });
  const [calendarBusy, setCalendarBusy] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const success = url.searchParams.get("success");
    const error = url.searchParams.get("error");
    if (!success && !error) return;
    setFlashMessage(success || error || "");
    url.searchParams.delete("success");
    url.searchParams.delete("error");
    window.history.replaceState({}, "", url.toString());
  }, []);

  useEffect(() => {
    let active = true;

    async function loadAppointments() {
      try {
        const billingResponse = await fetch("/api/billing", { credentials: "same-origin" });
        const billingData = await billingResponse.json().catch(() => ({}));
        if (!active) return;
        if (billingResponse.status === 401) {
          window.location.href = "/auth/signin?callbackUrl=/dashboard/appointments";
          return;
        }
        if (!hasPremiumFeatures(billingData.subscription?.plan)) {
          setLocked(true);
          setAppointments([]);
          return;
        }
        setLocked(false);

        const calendarResponse = await fetch("/api/integrations/google-calendar/status", {
          credentials: "same-origin",
        });
        const calendarData = await calendarResponse.json().catch(() => ({}));
        if (active) {
          setCalendarStatus({
            loading: false,
            configured: Boolean(calendarData.configured),
            connected: Boolean(calendarData.connected),
            email: calendarData.email || "",
          });
        }

        const response = await fetch("/api/appointments", {
          credentials: "same-origin",
        });
        const data = await response.json().catch(() => ({}));

        if (response.status === 401) {
          if (active) setAppointments([]);
          return;
        }

        if (!response.ok) {
          throw new Error(data.error || "Unable to load appointments.");
        }

        if (active) setAppointments(data.appointments || []);
      } catch (error) {
        if (active) {
          setAppointments([]);
          setLoadError(error.message || "Unable to load appointments.");
          setCalendarStatus((current) => ({ ...current, loading: false }));
        }
      }
    }

    loadAppointments();

    return () => {
      active = false;
    };
  }, []);

  const completedThisMonth = appointments.filter(
    (appointment) => appointment.status === "completed",
  ).length;

  if (locked) {
    return <UpgradeGate />;
  }

  const connectCalendarUrl =
    "/api/integrations/google-calendar/connect?callbackUrl=/dashboard/appointments";

  const disconnectCalendar = async () => {
    setCalendarBusy(true);
    try {
      const response = await fetch("/api/integrations/google-calendar/status", {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (!response.ok) {
        throw new Error("Unable to disconnect Google Calendar.");
      }
      setCalendarStatus((current) => ({
        ...current,
        connected: false,
        email: "",
      }));
    } catch (error) {
      setLoadError(error.message || "Unable to disconnect Google Calendar.");
    } finally {
      setCalendarBusy(false);
    }
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#111827",
              marginBottom: 3,
            }}
          >
            Appointments
          </h1>
          <p style={{ fontSize: 14, color: "#6B7280" }}>
            Bookings from your digital cards will appear here.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {calendarStatus.connected ? (
            <button
              onClick={disconnectCalendar}
              disabled={calendarBusy}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
                fontWeight: 600,
                color: "#374151",
                background: "#fff",
                border: "1px solid #E5E7EB",
                borderRadius: 8,
                padding: "8px 14px",
                cursor: calendarBusy ? "wait" : "pointer",
              }}
            >
              <ExternalLink size={13} />
              {calendarBusy ? "Disconnecting..." : "Disconnect Google Calendar"}
            </button>
          ) : (
            <a
              href={connectCalendarUrl}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
                fontWeight: 600,
                color: "#fff",
                background: "#2563EB",
                textDecoration: "none",
                border: "none",
                borderRadius: 8,
                padding: "8px 14px",
              }}
            >
              <Plus size={13} /> Connect Google Calendar
            </a>
          )}
        </div>
      </div>

      {!calendarStatus.loading && (
        <div
          style={{
            marginBottom: 16,
            background: calendarStatus.connected ? "#ECFDF5" : "#F9FAFB",
            border: `1px solid ${calendarStatus.connected ? "#A7F3D0" : "#E5E7EB"}`,
            color: calendarStatus.connected ? "#065F46" : "#4B5563",
            borderRadius: 10,
            padding: "10px 12px",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {calendarStatus.configured
            ? calendarStatus.connected
              ? `Google Calendar connected${calendarStatus.email ? ` (${calendarStatus.email})` : ""}. New bookings will sync automatically.`
              : "Google Calendar is ready to connect. New bookings will sync after you connect."
            : "Google Calendar is not configured yet. Add Google OAuth env vars to enable sync."}
        </div>
      )}

      {flashMessage && (
        <div
          style={{
            marginBottom: 16,
            background: "#EFF6FF",
            border: "1px solid #BFDBFE",
            color: "#1E40AF",
            borderRadius: 10,
            padding: "10px 12px",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {flashMessage}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
          gap: 14,
          marginBottom: 24,
        }}
      >
        {[
          [appointments.length, "Upcoming", "#2563EB", "#EFF6FF", Calendar],
          [completedThisMonth, "Completed this month", "#059669", "#ECFDF5", Check],
          ["0m", "Avg. meeting length", "#7C3AED", "#F5F3FF", Clock],
          ["0%", "Show-up rate", "#D97706", "#FFFBEB", User],
        ].map(([val, label, color, bg, Icon]) => (
          <div
            key={label}
            style={{
              background: "#fff",
              border: "1px solid #E5E7EB",
              borderRadius: 12,
              padding: "18px 20px",
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 10,
              }}
            >
              <Icon size={14} color={color} />
            </div>
            <p
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "#111827",
                marginBottom: 3,
              }}
            >
              {val}
            </p>
            <p style={{ fontSize: 12, color: "#6B7280" }}>{label}</p>
          </div>
        ))}
      </div>

      <div
        style={{
          background: "#fff",
          border: "1px solid #E5E7EB",
          borderRadius: 12,
        }}
      >
        {loadError && (
          <div
            style={{
              background: "#FEF2F2",
              borderBottom: "1px solid #FECACA",
              color: "#B91C1C",
              fontSize: 13,
              fontWeight: 500,
              padding: "12px 16px",
            }}
          >
            {loadError}
          </div>
        )}
        {appointments.length === 0 ? (
          <div className="ui-empty-state" style={{ border: "none" }}>
            <div className="ui-empty-state__icon">
              <Calendar size={18} />
            </div>
            <p className="ui-empty-state__title">No appointments yet</p>
            <p className="ui-empty-state__copy">
              Appointment activity will begin once visitors book from cards you create.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {appointments.map((appointment, index) => (
              <div
                key={appointment.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 130px",
                  gap: 16,
                  padding: "14px 18px",
                  borderBottom:
                    index < appointments.length - 1
                      ? "1px solid #F3F4F6"
                      : "none",
                }}
              >
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
                    {appointment.guestName}
                  </p>
                  <p style={{ fontSize: 12, color: "#6B7280" }}>
                    {appointment.guestEmail}
                  </p>
                </div>
                <p style={{ fontSize: 13, color: "#374151" }}>
                  {appointment.startsAt
                    ? new Date(appointment.startsAt).toLocaleString()
                    : "No date"}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span
                    style={{
                      alignSelf: "start",
                      justifySelf: "start",
                      fontSize: 11,
                      fontWeight: 800,
                      color: "#2563EB",
                      background: "#EFF6FF",
                      borderRadius: 999,
                      padding: "3px 8px",
                    }}
                  >
                    {appointment.status}
                  </span>
                  {appointment.googleEventId ? (
                    <span
                      style={{
                        alignSelf: "start",
                        justifySelf: "start",
                        fontSize: 10,
                        fontWeight: 800,
                        color: "#047857",
                        background: "#ECFDF5",
                        borderRadius: 999,
                        padding: "2px 7px",
                      }}
                    >
                      Synced to Google
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
