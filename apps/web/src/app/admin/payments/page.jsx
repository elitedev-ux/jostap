import AdminResourcePage from "../AdminResourcePage";

function money(cents) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(cents || 0) / 100);
}

const columns = [
  { label: "Order ID", key: "orderId", strong: true },
  { label: "Account", key: "account", strong: true },
  { label: "Email", key: "accountEmail" },
  { label: "Product", key: "product" },
  { label: "Amount", key: "amount" },
  { label: "Status", key: "status" },
  { label: "Created", key: "created" },
  { label: "Paid", key: "paidAt" },
  { label: "Payment ID", key: "id" },
];

async function syncPaystackPayment(row) {
  const response = await fetch("/api/admin/payments/sync", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paymentId: row.id }),
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Unable to sync this payment.");
  }

  if (data.payment?.status === "succeeded") {
    return "Payment verified with Paystack and marked successful.";
  }

  if (data.payment?.status === "failed") {
    return "Paystack did not confirm this payment, so it was marked failed.";
  }

  return "Payment sync completed.";
}

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
      rowAction={{
        label: (row) => {
          if (row.status === "pending") return "Sync Paystack";
          if (row.status === "succeeded") return "Paid";
          if (row.status === "failed") return "Failed";
          return "Synced";
        },
        color: (row) => (row.status === "failed" ? "#B91C1C" : "#0d6ffd"),
        disabled: (row) => row.status !== "pending",
        run: syncPaystackPayment,
      }}
    />
  );
}
