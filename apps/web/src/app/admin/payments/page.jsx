import AdminResourcePage from "../AdminResourcePage";

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
        ["Total Payments", (data) => data?.payments?.length || 0, "#2563EB", "#EFF6FF"],
        ["Successful", (data) => data?.payments?.filter((item) => item.status === "succeeded").length || 0, "#047857", "#ECFDF5"],
        ["Revenue", (data) => data?.stats?.revenueCents ? `$${Math.round(data.stats.revenueCents / 100).toLocaleString()}` : "$0", "#4F46E5", "#EEF2FF"],
      ]}
    />
  );
}
