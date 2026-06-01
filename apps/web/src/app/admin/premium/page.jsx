import AdminResourcePage from "../AdminResourcePage";

async function updateFeature(row) {
  const response = await fetch(`/api/admin/platform/features/${row.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_enabled: !row.is_enabled }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Unable to update feature.");
}

const columns = [
  { label: "Feature", key: "name", strong: true },
  { label: "Plan", key: "plan" },
  { label: "Enabled", key: "is_enabled" },
  { label: "Description", key: "description", wrap: true, maxWidth: 420 },
];

export default function AdminPremiumPage() {
  return (
    <AdminResourcePage
      title="Premium Features"
      description="Manage gated capabilities and the plans where they are enabled."
      dataset="features"
      columns={columns}
      emptyTitle="No premium features yet"
      emptyCopy="Premium feature controls will appear here."
      statCards={[
        ["Features", (data) => data?.features?.length || 0, "#2563EB", "#EFF6FF"],
        ["Enabled", (data) => data?.features?.filter((item) => item.is_enabled).length || 0, "#047857", "#ECFDF5"],
        ["Premium Features Renewal", (data) => data?.features?.filter((item) => item.plan === "premium_renewal").length || 0, "#7C3AED", "#F5F3FF"],
      ]}
      rowAction={{
        label: (row) => (row.is_enabled ? "Disable" : "Enable"),
        color: (row) => (row.is_enabled ? "#DC2626" : "#047857"),
        run: updateFeature,
      }}
    />
  );
}
