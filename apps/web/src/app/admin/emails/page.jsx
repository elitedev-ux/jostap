import AdminResourcePage from "../AdminResourcePage";

async function updateEmail(row) {
  const response = await fetch(`/api/admin/platform/emails/${row.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_active: !row.is_active }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Unable to update email template.");
}

const columns = [
  { label: "Key", key: "key", strong: true },
  { label: "Subject", key: "subject" },
  { label: "Active", key: "is_active" },
  { label: "Body", key: "body", wrap: true, maxWidth: 460 },
];

export default function AdminEmailsPage() {
  return (
    <AdminResourcePage
      title="Email Templates"
      description="Manage transactional and lifecycle email templates."
      dataset="emailTemplates"
      columns={columns}
      emptyTitle="No email templates yet"
      emptyCopy="Email templates will appear here."
      statCards={[
        ["Templates", (data) => data?.emailTemplates?.length || 0, "#2563EB", "#EFF6FF"],
        ["Active", (data) => data?.emailTemplates?.filter((item) => item.is_active).length || 0, "#047857", "#ECFDF5"],
      ]}
      rowAction={{
        label: (row) => (row.is_active ? "Disable" : "Enable"),
        color: (row) => (row.is_active ? "#DC2626" : "#047857"),
        run: updateEmail,
      }}
    />
  );
}
