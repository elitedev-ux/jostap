import { useEffect, useState } from "react";
import { Calendar, Check, Clock, ExternalLink, Plus, User } from "lucide-react";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadAppointments() {
      try {
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
          <a
            href="https://cal.com"
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              fontWeight: 500,
              color: "#374151",
              textDecoration: "none",
              background: "#fff",
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              padding: "8px 14px",
            }}
          >
            <ExternalLink size={13} /> Cal.com Settings
          </a>
          <button
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              fontWeight: 600,
              color: "#fff",
              background: "#2563EB",
              border: "none",
              borderRadius: 8,
              padding: "8px 16px",
              cursor: "pointer",
            }}
          >
            <Plus size={13} /> Set Availability
          </button>
        </div>
      </div>

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
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
