import AdminResourcePage from "../AdminResourcePage";

function money(cents) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(cents || 0) / 100);
}

const DEFAULT_PLAN_PRICE_KOBO = {
  jostap_nfc: { monthly_cents: 4000000 },
  custom_nfc: { monthly_cents: 5000000 },
  basic_renewal: { yearly_cents: 120000 },
  premium_renewal: { yearly_cents: 200000 },
};

function planPrice(row, key) {
  const fallback = DEFAULT_PLAN_PRICE_KOBO[row.slug]?.[key] || 0;
  const amount = Number(row[key] || 0);

  return fallback ? Math.max(amount, fallback) : amount;
}

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
  { label: "Monthly", key: (row) => money(planPrice(row, "monthly_cents")) },
  { label: "Yearly", key: (row) => money(planPrice(row, "yearly_cents")) },
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
