import AdminResourcePage from "../AdminResourcePage";

async function updateTemplate(row) {
  const response = await fetch(`/api/admin/platform/templates/${row.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_active: !row.is_active }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Unable to update template.");
}

const columns = [
  { label: "Template", key: "name", strong: true },
  { label: "Description", key: "description", wrap: true, maxWidth: 360 },
  { label: "Premium", key: "is_premium" },
  { label: "Active", key: "is_active" },
  { label: "Primary", key: "color_primary" },
  { label: "Secondary", key: "color_secondary" },
];

export default function AdminTemplatesPage() {
  return (
    <AdminResourcePage
      title="Templates"
      description="Manage card templates, themes, premium access, and availability."
      dataset="templates"
      columns={columns}
      emptyTitle="No templates yet"
      emptyCopy="Card templates and themes will appear here."
      statCards={[
        ["Templates", (data) => data?.templates?.length || 0, "#0d6ffd", "#eaf3ff"],
        ["Premium", (data) => data?.templates?.filter((item) => item.is_premium).length || 0, "#ff9f0d", "#F5F3FF"],
        ["Active", (data) => data?.templates?.filter((item) => item.is_active).length || 0, "#047857", "#ECFDF5"],
      ]}
      rowAction={{
        label: (row) => (row.is_active ? "Disable" : "Enable"),
        color: (row) => (row.is_active ? "#DC2626" : "#047857"),
        run: updateTemplate,
      }}
    />
  );
}
