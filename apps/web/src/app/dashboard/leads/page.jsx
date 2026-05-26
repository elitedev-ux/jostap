import { useEffect, useState } from "react";
import { Download, Search, Tag, Users, Wifi } from "lucide-react";

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadLeads() {
      try {
        const response = await fetch("/api/leads", { credentials: "same-origin" });
        const data = await response.json().catch(() => ({}));

        if (response.status === 401) {
          if (active) setLeads([]);
          return;
        }

        if (!response.ok) {
          throw new Error(data.error || "Unable to load leads.");
        }

        if (active) setLeads(data.leads || []);
      } catch (error) {
        if (active) {
          setLeads([]);
          setLoadError(error.message || "Unable to load leads.");
        }
      }
    }

    loadLeads();

    return () => {
      active = false;
    };
  }, []);

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
            Leads
          </h1>
          <p style={{ fontSize: 14, color: "#6B7280" }}>
            Contacts captured from your NFC card interactions will appear here.
          </p>
        </div>
        <button
          disabled
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            fontWeight: 500,
            color: "#9CA3AF",
            background: "#fff",
            border: "1px solid #E5E7EB",
            borderRadius: 8,
            padding: "8px 14px",
            cursor: "not-allowed",
          }}
        >
          <Download size={13} /> Export CSV
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
          gap: 14,
          marginBottom: 20,
        }}
      >
        {[
          [leads.length, "Total Leads", Users, "#2563EB", "#EFF6FF"],
          [leads.filter((lead) => lead.status === "qualified").length, "Hot Leads", Tag, "#D97706", "#FFFBEB"],
          [leads.filter((lead) => lead.source === "nfc").length, "NFC Source", Wifi, "#059669", "#ECFDF5"],
          [0, "Avg per card/week", Search, "#7C3AED", "#F5F3FF"],
        ].map(([val, label, Icon, color, bg]) => (
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
                fontSize: 22,
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
          overflow: "hidden",
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
        {leads.length === 0 ? (
          <div className="ui-empty-state" style={{ border: "none" }}>
            <div className="ui-empty-state__icon">
              <Users size={18} />
            </div>
            <p className="ui-empty-state__title">No leads yet</p>
            <p className="ui-empty-state__copy">
              Leads will appear here after people interact with cards you create.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {leads.map((lead, index) => (
              <div
                key={lead.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 140px 110px",
                  gap: 16,
                  padding: "14px 18px",
                  borderBottom:
                    index < leads.length - 1 ? "1px solid #F3F4F6" : "none",
                }}
              >
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
                    {lead.name}
                  </p>
                  <p style={{ fontSize: 12, color: "#6B7280" }}>{lead.email}</p>
                </div>
                <p style={{ fontSize: 13, color: "#374151" }}>
                  {lead.company || lead.cardName || "No company"}
                </p>
                <p style={{ fontSize: 12, color: "#6B7280" }}>
                  {lead.source || "Card"}
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
                  {lead.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
