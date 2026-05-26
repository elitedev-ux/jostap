import { Ban, CheckCircle2, Download, MoreVertical, Search, UserPlus } from "lucide-react";

const users = [];

const statusStyle = {
  Active: ["#ECFDF5", "#047857", "#A7F3D0"],
  Trial: ["#EFF6FF", "#2563EB", "#BFDBFE"],
  Suspended: ["#FEF2F2", "#DC2626", "#FECACA"],
};

export default function AdminUsersPage() {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", marginBottom: 4 }}>Users</h1>
          <p style={{ fontSize: 14, color: "#6B7280" }}>Manage accounts, plans, verification, and account status.</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={{ display: "inline-flex", alignItems: "center", gap: 7, border: "1px solid #E5E7EB", background: "#fff", borderRadius: 9, padding: "9px 13px", fontSize: 13, fontWeight: 700, color: "#374151" }}>
            <Download size={14} /> Export
          </button>
          <button style={{ display: "inline-flex", alignItems: "center", gap: 7, border: "none", background: "#2563EB", borderRadius: 9, padding: "9px 14px", fontSize: 13, fontWeight: 700, color: "#fff" }}>
            <UserPlus size={14} /> Add User
          </button>
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: 16, borderBottom: "1px solid #E5E7EB", display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid #E5E7EB", borderRadius: 9, padding: "8px 12px", minWidth: 280, flex: 1, maxWidth: 360 }}>
            <Search size={14} color="#9CA3AF" />
            <input placeholder="Search users..." style={{ border: "none", outline: "none", background: "transparent", width: "100%", fontSize: 13 }} />
          </div>
          {["All plans", "All status", "Newest first"].map((filter) => (
            <button key={filter} style={{ border: "1px solid #E5E7EB", background: "#fff", borderRadius: 9, padding: "8px 12px", color: "#374151", fontSize: 13, fontWeight: 600 }}>
              {filter}
            </button>
          ))}
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#F9FAFB" }}>
              <tr>
                {["User", "Plan", "Status", "Cards", "Revenue", "Actions"].map((heading) => (
                  <th key={heading} style={{ textAlign: "left", padding: "12px 16px", fontSize: 12, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.04em" }}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="ui-empty-state" style={{ border: "none" }}>
                      <p className="ui-empty-state__title">No users yet</p>
                      <p className="ui-empty-state__copy">User records will appear here when the backend is connected.</p>
                    </div>
                  </td>
                </tr>
              )}
              {users.map(([name, email, plan, status, cards, revenue], index) => {
                const [bg, color, border] = statusStyle[status];
                return (
                  <tr key={email} style={{ borderTop: index ? "1px solid #F3F4F6" : "none" }}>
                    <td style={{ padding: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#EFF6FF", color: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>
                          {name.split(" ").map((part) => part[0]).join("").slice(0, 2)}
                        </div>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{name}</p>
                          <p style={{ fontSize: 12, color: "#6B7280" }}>{email}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: 16, fontSize: 13, color: "#374151", fontWeight: 600 }}>{plan}</td>
                    <td style={{ padding: 16 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: bg, color, border: `1px solid ${border}`, borderRadius: 999, padding: "3px 9px", fontSize: 12, fontWeight: 700 }}>
                        {status === "Suspended" ? <Ban size={11} /> : <CheckCircle2 size={11} />} {status}
                      </span>
                    </td>
                    <td style={{ padding: 16, fontSize: 13, color: "#6B7280" }}>{cards}</td>
                    <td style={{ padding: 16, fontSize: 13, color: "#111827", fontWeight: 700 }}>{revenue}</td>
                    <td style={{ padding: 16 }}>
                      <button style={{ border: "1px solid #E5E7EB", background: "#fff", borderRadius: 8, width: 30, height: 30 }}>
                        <MoreVertical size={14} />
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
