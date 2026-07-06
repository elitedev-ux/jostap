import { useEffect, useMemo, useState } from "react";
import { Download, RefreshCcw } from "lucide-react";

function valueFor(row, key) {
  if (typeof key === "function") return key(row);
  return key.split(".").reduce((value, part) => value?.[part], row) ?? "";
}

function downloadCsv(filename, rows, columns) {
  const header = columns.map((column) => column.label).join(",");
  const body = rows
    .map((row) =>
      columns
        .map((column) => JSON.stringify(String(valueFor(row, column.key) ?? "")))
        .join(","),
    )
    .join("\n");
  const blob = new Blob([[header, body].filter(Boolean).join("\n")], {
    type: "text/csv",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function AdminResourcePage({
  title,
  description,
  dataset,
  columns,
  emptyTitle,
  emptyCopy,
  statCards = [],
  rowAction,
}) {
  const [admin, setAdmin] = useState(null);
  const [query, setQuery] = useState("");
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState("");

  async function load() {
    setLoadError("");
    try {
      const response = await fetch("/api/admin/overview", { credentials: "same-origin" });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Unable to load admin data.");
      }

      setAdmin(data);
    } catch (error) {
      setLoadError(error.message || "Unable to load admin data.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const rows = admin?.[dataset] || [];
  const filteredRows = useMemo(
    () =>
      rows.filter((row) =>
        columns.some((column) =>
          String(valueFor(row, column.key)).toLowerCase().includes(query.toLowerCase()),
        ),
      ),
    [columns, query, rows],
  );

  const runAction = async (row) => {
    if (!rowAction) return;
    if (rowAction.disabled?.(row)) return;
    setBusyId(row.id);
    setLoadError("");
    setNotice("");
    try {
      const message = await rowAction.run(row);
      if (message) setNotice(message);
      await load();
    } catch (error) {
      setLoadError(error.message || "Unable to update this record.");
    } finally {
      setBusyId("");
    }
  };

  return (
    <>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", marginBottom: 4 }}>{title}</h1>
          <p style={{ fontSize: 14, color: "#6B7280" }}>{description}</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <button
            onClick={load}
            style={{ display: "inline-flex", alignItems: "center", gap: 7, border: "1px solid #E5E7EB", background: "#fff", borderRadius: 9, padding: "9px 13px", fontSize: 13, fontWeight: 700, color: "#374151", cursor: "pointer" }}
          >
            <RefreshCcw size={14} /> Refresh
          </button>
          <button
            onClick={() => downloadCsv(`${dataset}.csv`, filteredRows, columns)}
            style={{ display: "inline-flex", alignItems: "center", gap: 7, border: "none", background: "#0d6ffd", borderRadius: 9, padding: "9px 13px", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer" }}
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {statCards.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, marginBottom: 20 }}>
          {statCards.map(([label, value, color, bg]) => (
            <div key={label} style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: 18 }}>
              <p style={{ fontSize: 24, fontWeight: 800, color: "#111827" }}>{typeof value === "function" ? value(admin) : value}</p>
              <p style={{ fontSize: 12, color, background: bg, borderRadius: 999, display: "inline-flex", padding: "3px 9px", fontWeight: 800, marginTop: 8 }}>{label}</p>
            </div>
          ))}
        </div>
      )}

      {loadError && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C", borderRadius: 10, padding: "11px 14px", fontSize: 13, fontWeight: 700, marginBottom: 16 }}>
          {loadError}
        </div>
      )}

      {notice && (
        <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", color: "#047857", borderRadius: 10, padding: "11px 14px", fontSize: 13, fontWeight: 700, marginBottom: 16 }}>
          {notice}
        </div>
      )}

      <section style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: 16, borderBottom: "1px solid #E5E7EB" }}>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search ${title.toLowerCase()}...`}
            style={{ width: "100%", border: "1px solid #E5E7EB", outline: "none", background: "#f5f5f5", borderRadius: 9, padding: "10px 12px", fontSize: 13, boxSizing: "border-box" }}
          />
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#f5f5f5" }}>
              <tr>
                {columns.map((column) => (
                  <th key={column.label} style={{ textAlign: "left", padding: "12px 16px", fontSize: 12, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
                    {column.label}
                  </th>
                ))}
                {rowAction && <th style={{ padding: "12px 16px" }}>Action</th>}
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={columns.length + (rowAction ? 1 : 0)}>
                    <div className="ui-empty-state" style={{ border: "none" }}>
                      <p className="ui-empty-state__title">{emptyTitle}</p>
                      <p className="ui-empty-state__copy">{emptyCopy}</p>
                    </div>
                  </td>
                </tr>
              )}
              {filteredRows.map((row, index) => (
                <tr key={row.id || index} style={{ borderTop: index ? "1px solid #F3F4F6" : "none" }}>
                  {columns.map((column) => (
                    <td key={column.label} style={{ padding: "14px 16px", fontSize: 13, color: column.strong ? "#111827" : "#374151", fontWeight: column.strong ? 800 : 500, maxWidth: column.maxWidth || 260, whiteSpace: column.wrap ? "normal" : "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {String(valueFor(row, column.key))}
                    </td>
                  ))}
                  {rowAction && (
                    <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                      {(() => {
                        const disabled = rowAction.disabled?.(row) || false;

                        return (
                          <button
                            onClick={() => runAction(row)}
                            disabled={busyId === row.id || disabled}
                            style={{
                              border: "1px solid #E5E7EB",
                              background: disabled ? "#F9FAFB" : "#fff",
                              borderRadius: 8,
                              padding: "7px 11px",
                              fontSize: 12,
                              fontWeight: 800,
                              color: disabled ? "#9CA3AF" : rowAction.color?.(row) || "#0d6ffd",
                              cursor: busyId === row.id ? "wait" : disabled ? "not-allowed" : "pointer",
                            }}
                          >
                            {busyId === row.id ? "Saving..." : rowAction.label(row)}
                          </button>
                        );
                      })()}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
