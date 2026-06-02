import { useState } from "react";
import AdminResourcePage from "../AdminResourcePage";

async function updateNotification(row) {
  const response = await fetch(`/api/admin/platform/notifications/${row.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_read: !row.is_read }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Unable to update notification.");
}

const columns = [
  { label: "Title", key: "title", strong: true },
  { label: "Type", key: "type" },
  { label: "Read", key: "is_read" },
  { label: "Message", key: "message", wrap: true, maxWidth: 460 },
  { label: "Created", key: "created_at" },
];

export default function AdminNotificationsPage() {
  const [form, setForm] = useState({
    title: "",
    message: "",
    type: "info",
    audience: "all",
  });
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const publishAnnouncement = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setNotice("");
    setError("");

    try {
      const response = await fetch("/api/admin/announcements", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Unable to publish announcement.");
      }

      setForm({ title: "", message: "", type: "info", audience: "all" });
      setNotice("Announcement published to users.");
    } catch (err) {
      setError(err.message || "Unable to publish announcement.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
    <section style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: 20, marginBottom: 20 }}>
      <h2 style={{ fontSize: 16, fontWeight: 800, color: "#111827", marginBottom: 4 }}>Send Announcement</h2>
      <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 16 }}>Publish a notification that appears in user dashboard announcement bells.</p>
      {notice && <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", color: "#047857", borderRadius: 9, padding: "10px 12px", fontSize: 13, fontWeight: 700, marginBottom: 12 }}>{notice}</div>}
      {error && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C", borderRadius: 9, padding: "10px 12px", fontSize: 13, fontWeight: 700, marginBottom: 12 }}>{error}</div>}
      <form onSubmit={publishAnnouncement} style={{ display: "grid", gridTemplateColumns: "1fr 180px 180px", gap: 12 }}>
        <input
          value={form.title}
          onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
          placeholder="Announcement title"
          required
          style={{ border: "1px solid #E5E7EB", borderRadius: 9, padding: "10px 12px", fontSize: 13 }}
        />
        <select
          value={form.type}
          onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
          style={{ border: "1px solid #E5E7EB", borderRadius: 9, padding: "10px 12px", fontSize: 13 }}
        >
          <option value="info">Info</option>
          <option value="success">Success</option>
          <option value="warning">Warning</option>
          <option value="error">Error</option>
        </select>
        <select
          value={form.audience}
          onChange={(event) => setForm((current) => ({ ...current, audience: event.target.value }))}
          style={{ border: "1px solid #E5E7EB", borderRadius: 9, padding: "10px 12px", fontSize: 13 }}
        >
          <option value="all">All users</option>
          <option value="users">Users only</option>
          <option value="admins">Admins only</option>
        </select>
        <textarea
          value={form.message}
          onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
          placeholder="Message"
          required
          rows={3}
          style={{ gridColumn: "1 / -1", border: "1px solid #E5E7EB", borderRadius: 9, padding: "10px 12px", fontSize: 13, resize: "vertical" }}
        />
        <button disabled={submitting} type="submit" style={{ width: "fit-content", border: "none", background: "#0d6ffd", color: "#fff", borderRadius: 9, padding: "10px 14px", fontSize: 13, fontWeight: 800, cursor: submitting ? "wait" : "pointer" }}>
          {submitting ? "Publishing..." : "Publish Announcement"}
        </button>
      </form>
    </section>
    <AdminResourcePage
      title="Notification Center"
      description="Monitor internal platform notifications and admin follow-up items."
      dataset="notifications"
      columns={columns}
      emptyTitle="No notifications yet"
      emptyCopy="Platform notifications will appear here."
      statCards={[
        ["Notifications", (data) => data?.notifications?.length || 0, "#0d6ffd", "#eaf3ff"],
        ["Unread", (data) => data?.notifications?.filter((item) => !item.is_read).length || 0, "#B45309", "#FEF3C7"],
      ]}
      rowAction={{
        label: (row) => (row.is_read ? "Mark unread" : "Mark read"),
        color: (row) => (row.is_read ? "#B45309" : "#047857"),
        run: updateNotification,
      }}
    />
    </>
  );
}
