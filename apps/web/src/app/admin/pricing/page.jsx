import AdminResourcePage from "../AdminResourcePage";

async function updatePlan(row) {
  const response = await fetch(`/api/admin/platform/pricing/${row.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_active: !row.is_active }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Unable to update pricing plan.");
}

const columns = [
  { label: "Plan", key: "name", strong: true },
  { label: "Slug", key: "slug" },
  { label: "Monthly", key: (row) => `$${Number(row.monthly_cents || 0) / 100}` },
  { label: "Yearly", key: (row) => `$${Number(row.yearly_cents || 0) / 100}` },
  { label: "Cards", key: "card_limit" },
  { label: "Active", key: "is_active" },
];

export default function AdminPricingPage() {
  return (
    <AdminResourcePage
      title="Pricing Plans"
      description="Manage pricing plans, card limits, and plan availability."
      dataset="pricingPlans"
      columns={columns}
      emptyTitle="No pricing plans yet"
      emptyCopy="Pricing plan records will appear here."
      statCards={[
        ["Plans", (data) => data?.pricingPlans?.length || 0, "#0d6ffd", "#eaf3ff"],
        ["Active", (data) => data?.pricingPlans?.filter((item) => item.is_active).length || 0, "#047857", "#ECFDF5"],
      ]}
      rowAction={{
        label: (row) => (row.is_active ? "Disable" : "Enable"),
        color: (row) => (row.is_active ? "#DC2626" : "#047857"),
        run: updatePlan,
      }}
    />
  );
}
