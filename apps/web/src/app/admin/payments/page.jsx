import { useState } from "react";
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

function PaystackReferenceImporter() {
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const importReference = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    const value = reference.trim();
    if (!value) {
      setError("Paste the Paystack reference from the paid transaction.");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/admin/payments/sync", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: value }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Unable to import this Paystack payment.");
      }

      const status = data.payment?.status || "synced";
      setMessage(`Paystack reference imported. Status: ${status}. Refreshing payments...`);
      setTimeout(() => window.location.reload(), 700);
    } catch (syncError) {
      setError(syncError.message || "Unable to import this Paystack payment.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={importReference}
      style={{
        background: "#fff",
        border: "1px solid #E5E7EB",
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        display: "grid",
        gridTemplateColumns: "minmax(220px,1fr) auto",
        gap: 10,
        alignItems: "end",
      }}
    >
      <label style={{ display: "grid", gap: 7, fontSize: 12, fontWeight: 800, color: "#374151" }}>
        Import missing paid Paystack transaction
        <input
          value={reference}
          onChange={(event) => setReference(event.target.value)}
          placeholder="Paste Paystack reference"
          style={{
            border: "1px solid #D1D5DB",
            borderRadius: 9,
            padding: "11px 12px",
            fontSize: 13,
            outline: "none",
          }}
        />
      </label>
      <button
        type="submit"
        disabled={busy}
        style={{
          border: "none",
          background: "#0d6ffd",
          color: "#fff",
          borderRadius: 9,
          padding: "12px 14px",
          fontSize: 13,
          fontWeight: 800,
          cursor: busy ? "wait" : "pointer",
        }}
      >
        {busy ? "Verifying..." : "Import Payment"}
      </button>
      {(message || error) && (
        <p
          style={{
            gridColumn: "1 / -1",
            margin: 0,
            fontSize: 13,
            fontWeight: 700,
            color: error ? "#B91C1C" : "#047857",
          }}
        >
          {error || message}
        </p>
      )}
    </form>
  );
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
    >
      <PaystackReferenceImporter />
    </AdminResourcePage>
  );
}
