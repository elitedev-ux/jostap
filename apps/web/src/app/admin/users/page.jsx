import { Ban, CheckCircle2, Download, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const statusStyle = {
  Active: ["#ECFDF5", "#047857", "#A7F3D0"],
  Trial: ["#eaf3ff", "#0d6ffd", "#BFDBFE"],
  Suspended: ["#FEF2F2", "#DC2626", "#FECACA"],
  "No plan": ["#f5f5f5", "#6B7280", "#E5E7EB"],
};

function downloadCsv(rows) {
  const columns = ["name", "email", "company", "role", "status", "plan", "subscriptionStatus", "cards", "revenue", "joined"];
  const body = rows.map((row) => columns.map((column) => JSON.stringify(String(row[column] ?? ""))).join(",")).join("\n");
  const blob = new Blob([[columns.join(","), body].filter(Boolean).join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "users.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [loadError, setLoadError] = useState("");
  const [busyId, setBusyId] = useState("");

  async function loadUsers(active = true) {
    setLoadError("");
    try {
      const response = await fetch("/api/admin/overview", { credentials: "same-origin" });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Unable to load users.");
      }

      if (active) setUsers(data.users || []);
    } catch (error) {
      if (active) setLoadError(error.message || "Unable to load users.");
    }
  }

  async function updateUser(user, updates) {
    setBusyId(user.id);
    setLoadError("");
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Unable to update user.");
      await loadUsers();
    } catch (error) {
      setLoadError(error.message || "Unable to update user.");
    } finally {
      setBusyId("");
    }
  }

  useEffect(() => {
    let active = true;
    loadUsers(active);

    return () => {
      active = false;
    };
  }, []);

  const filteredUsers = useMemo(
    () =>
      users.filter((user) =>
        [user.name, user.email, user.company, user.plan, user.status, user.subscriptionStatus, user.role]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query.toLowerCase())),
      ),
    [query, users],
  );

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", marginBottom: 4 }}>Users</h1>
          <p style={{ fontSize: 14, color: "#6B7280" }}>Manage accounts, plans, verification, and account status.</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => downloadCsv(filteredUsers)} style={{ display: "inline-flex", alignItems: "center", gap: 7, border: "1px solid #E5E7EB", background: "#fff", borderRadius: 9, padding: "9px 13px", fontSize: 13, fontWeight: 700, color: "#374151", cursor: "pointer" }}>
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: 16, borderBottom: "1px solid #E5E7EB", display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid #E5E7EB", borderRadius: 9, padding: "8px 12px", minWidth: 280, flex: 1, maxWidth: 360 }}>
            <Search size={14} color="#9CA3AF" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search users..." style={{ border: "none", outline: "none", background: "transparent", width: "100%", fontSize: 13 }} />
          </div>
          {["All plans", "All status", "Newest first"].map((filter) => (
            <button key={filter} style={{ border: "1px solid #E5E7EB", background: "#fff", borderRadius: 9, padding: "8px 12px", color: "#374151", fontSize: 13, fontWeight: 600 }}>
              {filter}
            </button>
          ))}
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#f5f5f5" }}>
              <tr>
                {["User", "Plan", "Status", "Cards", "Revenue", "Actions"].map((heading) => (
                  <th key={heading} style={{ textAlign: "left", padding: "12px 16px", fontSize: 12, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.04em" }}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loadError && (
                <tr>
                  <td colSpan={6}>
                    <div style={{ background: "#FEF2F2", color: "#B91C1C", padding: 16, fontSize: 13, fontWeight: 700 }}>{loadError}</div>
                  </td>
                </tr>
              )}
              {!loadError && filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="ui-empty-state" style={{ border: "none" }}>
                      <p className="ui-empty-state__title">No users yet</p>
                      <p className="ui-empty-state__copy">User records will appear here as accounts are created.</p>
                    </div>
                  </td>
                </tr>
              )}
              {filteredUsers.map((user, index) => {
                const status = user.status === "suspended" ? "Suspended" : "Active";
                const [bg, color, border] = statusStyle[status] || statusStyle["No plan"];
                return (
                  <tr key={user.email} style={{ borderTop: index ? "1px solid #F3F4F6" : "none" }}>
                    <td style={{ padding: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#eaf3ff", color: "#0d6ffd", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, overflow: "hidden" }}>
                          {user.avatarUrl ? <img src={user.avatarUrl} alt={user.name} loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : user.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}
                        </div>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{user.name}</p>
                          <p style={{ fontSize: 12, color: "#6B7280" }}>{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: 16, fontSize: 13, color: "#374151", fontWeight: 600, textTransform: "capitalize" }}>
                      {user.plan}
                      <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 3 }}>{user.subscriptionStatus}</p>
                    </td>
                    <td style={{ padding: 16 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: bg, color, border: `1px solid ${border}`, borderRadius: 999, padding: "3px 9px", fontSize: 12, fontWeight: 700 }}>
                        {status === "Suspended" ? <Ban size={11} /> : <CheckCircle2 size={11} />} {status}
                      </span>
                    </td>
                    <td style={{ padding: 16, fontSize: 13, color: "#6B7280" }}>{user.cards}</td>
                    <td style={{ padding: 16, fontSize: 13, color: "#111827", fontWeight: 700 }}>{user.revenue}</td>
                    <td style={{ padding: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button
                        onClick={() => updateUser(user, { status: user.status === "suspended" ? "active" : "suspended" })}
                        disabled={busyId === user.id}
                        style={{ border: "1px solid #E5E7EB", background: "#fff", borderRadius: 8, padding: "7px 10px", fontSize: 12, fontWeight: 800, color: user.status === "suspended" ? "#047857" : "#DC2626", cursor: busyId === user.id ? "wait" : "pointer" }}
                      >
                        {busyId === user.id ? "Saving..." : user.status === "suspended" ? "Activate" : "Suspend"}
                      </button>
                      <button
                        onClick={() => updateUser(user, { role: user.role === "admin" ? "user" : "admin" })}
                        disabled={busyId === user.id}
                        style={{ border: "1px solid #E5E7EB", background: "#fff", borderRadius: 8, padding: "7px 10px", fontSize: 12, fontWeight: 800, color: "#0d6ffd", cursor: busyId === user.id ? "wait" : "pointer" }}
                      >
                        {user.role === "admin" ? "Make user" : "Make admin"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
