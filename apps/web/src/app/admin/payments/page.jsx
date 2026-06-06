import AdminResourcePage from "../AdminResourcePage";

function money(cents) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(cents || 0) / 100);
}

const columns = [
  { label: "Account", key: "account", strong: true },
  { label: "Amount", key: "amount" },
  { label: "Status", key: "status" },
  { label: "Created", key: "created" },
  { label: "Payment ID", key: "id" },
];

export default function AdminPaymentsPage() {
  return (
    <AdminResourcePage
      title="Payments"
      description="Monitor payment status, successful revenue, failed payments, and account billing records."
      dataset="payments"
      columns={columns}
      emptyTitle="No payments yet"
      emptyCopy="Payment activity will appear here when users subscribe or renew."
      statCards={[
        ["Total Payments", (data) => data?.payments?.length || 0, "#0d6ffd", "#eaf3ff"],
        ["Successful", (data) => data?.payments?.filter((item) => item.status === "succeeded").length || 0, "#047857", "#ECFDF5"],
        ["Revenue", (data) => money(data?.stats?.revenueCents), "#4F46E5", "#EEF2FF"],
      ]}
    />
  );
}
