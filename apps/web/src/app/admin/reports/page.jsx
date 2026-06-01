import { Download, RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react";

const REPORTS = [
  ["users", "Users", "All accounts, roles, KYC state, plan state, and revenue totals."],
  ["cards", "NFC Cards", "All cards, publication state, taps, QR scans, and contact downloads."],
  ["payments", "Payments", "Payment status and revenue records."],
  ["leads", "Leads", "Captured lead activity by card owner."],
  ["appointments", "Appointments", "Appointment requests and booking status."],
  ["auditLogs", "Audit Logs", "Admin changes across platform resources."],
];

function flatten(row) {
  return Object.fromEntries(
    Object.entries(row || {}).map(([key, value]) => [
      key,
      Array.isArray(value) || (value && typeof value === "object") ? JSON.stringify(value) : value,
    ]),
  );
}

function downloadCsv(filename, rows) {
  const flatRows = rows.map(flatten);
  const columns = [...new Set(flatRows.flatMap((row) => Object.keys(row)))];
  const header = columns.join(",");
  const body = flatRows
    .map((row) => columns.map((column) => JSON.stringify(String(row[column] ?? ""))).join(","))
    .join("\n");
  const blob = new Blob([[header, body].filter(Boolean).join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function AdminReportsPage() {
  const [admin, setAdmin] = useState(null);
  const [loadError, setLoadError] = useState("");

  async function load() {
    setLoadError("");
    try {
      const response = await fetch("/api/admin/overview", { credentials: "same-origin" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Unable to load reports.");
      setAdmin(data);
    } catch (error) {
      setLoadError(error.message || "Unable to load reports.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", marginBottom: 4 }}>Reports</h1>
          <p style={{ fontSize: 14, color: "#6B7280" }}>Export operational reports for users, cards, billing, activity, and audit history.</p>
        </div>
        <button onClick={load} style={{ display: "inline-flex", alignItems: "center", gap: 7, border: "1px solid #E5E7EB", background: "#fff", borderRadius: 9, padding: "9px 13px", fontSize: 13, fontWeight: 700, color: "#374151", cursor: "pointer", alignSelf: "flex-start" }}>
          <RefreshCcw size={14} /> Refresh
        </button>
      </div>

      {loadError && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C", borderRadius: 10, padding: "11px 14px", fontSize: 13, fontWeight: 700, marginBottom: 16 }}>
          {loadError}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 14 }}>
        {REPORTS.map(([key, title, copy]) => {
          const rows = admin?.[key] || [];
          return (
            <section key={key} style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: 18 }}>
              <p style={{ fontSize: 18, fontWeight: 800, color: "#111827", marginBottom: 6 }}>{title}</p>
              <p style={{ fontSize: 13, color: "#6B7280", minHeight: 38 }}>{copy}</p>
              <p style={{ fontSize: 26, fontWeight: 800, color: "#111827", marginTop: 14 }}>{rows.length}</p>
              <button
                onClick={() => downloadCsv(`${key}.csv`, rows)}
                disabled={!rows.length}
                style={{ marginTop: 14, display: "inline-flex", alignItems: "center", gap: 7, border: "none", background: rows.length ? "#2563EB" : "#E5E7EB", borderRadius: 9, padding: "9px 13px", fontSize: 13, fontWeight: 800, color: rows.length ? "#fff" : "#6B7280", cursor: rows.length ? "pointer" : "not-allowed" }}
              >
                <Download size={14} /> Export CSV
              </button>
            </section>
          );
        })}
      </div>
    </>
  );
}
