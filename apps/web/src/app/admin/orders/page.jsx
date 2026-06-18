import { CheckCircle2, Clock, Package, Printer, Search, Truck } from "lucide-react";
import { useMemo, useEffect, useState } from "react";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [query, setQuery] = useState("");
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadOrders() {
      try {
        const response = await fetch("/api/admin/overview", { credentials: "same-origin" });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Unable to load orders.");

        const rows = (data.orders || []).map((order) => [
          order.orderId,
          order.customer,
          order.product,
          order.payment,
          order.status,
          order.date,
        ]);

        if (active) {
          setOrders(rows);
          setStats({ ...(data.stats || {}), nfcOrders: rows.length });
        }
      } catch (error) {
        if (active) setLoadError(error.message || "Unable to load orders.");
      }
    }

    loadOrders();

    return () => {
      active = false;
    };
  }, []);

  const filteredOrders = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return orders;
    return orders.filter((order) => order.some((value) => String(value).toLowerCase().includes(search)));
  }, [orders, query]);

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", marginBottom: 4 }}>NFC Orders</h1>
          <p style={{ fontSize: 14, color: "#6B7280" }}>Track card production, shipping, artwork approval, and fulfillment status.</p>
        </div>
        <button onClick={() => window.print()} style={{ display: "inline-flex", alignItems: "center", gap: 7, alignSelf: "flex-start", background: "#0d6ffd", color: "#fff", border: "none", borderRadius: 9, padding: "10px 15px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          <Printer size={14} /> Print Batch
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, marginBottom: 20 }}>
        {[
          ["Paid Orders", stats.nfcOrders || 0, Package, "#0d6ffd", "#eaf3ff"],
          ["In Production", 0, Clock, "#D97706", "#FFFBEB"],
          ["Shipped Today", "0", Truck, "#ff9f0d", "#F5F3FF"],
          ["Delivered", "0", CheckCircle2, "#059669", "#ECFDF5"],
        ].map(([label, value, Icon, color, bg]) => (
          <div key={label} style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontSize: 23, fontWeight: 800, color: "#111827" }}>{value}</p>
                <p style={{ fontSize: 12, color: "#6B7280" }}>{label}</p>
              </div>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={17} color={color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <section style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: 16, borderBottom: "1px solid #E5E7EB", display: "flex", alignItems: "center", gap: 10 }}>
          <Search size={15} color="#9CA3AF" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search orders..." style={{ border: "none", outline: "none", background: "transparent", flex: 1, fontSize: 13 }} />
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#f5f5f5" }}>
              <tr>{["Order", "Customer", "Product", "Payment", "Status", "Date"].map((heading) => <th key={heading} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, color: "#6B7280", textTransform: "uppercase" }}>{heading}</th>)}</tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    {loadError ? (
                      <div style={{ background: "#FEF2F2", color: "#B91C1C", padding: 16, fontSize: 13, fontWeight: 700 }}>{loadError}</div>
                    ) : query ? (
                    <div className="ui-empty-state" style={{ border: "none" }}>
                      <p className="ui-empty-state__title">No matching orders</p>
                      <p className="ui-empty-state__copy">Try a different order number, customer, product, status, or date.</p>
                    </div>
                    ) : (
                    <div className="ui-empty-state" style={{ border: "none" }}>
                      <p className="ui-empty-state__title">No orders yet</p>
                      <p className="ui-empty-state__copy">Invoices and NFC fulfillment orders will appear here when created.</p>
                    </div>
                    )}
                  </td>
                </tr>
              )}
              {filteredOrders.map((order, index) => (
                <tr key={order[0]} style={{ borderTop: index ? "1px solid #F3F4F6" : "none" }}>
                  {order.map((cell, cellIndex) => (
                    <td key={cellIndex} style={{ padding: "15px 16px", fontSize: 13, color: cellIndex === 0 ? "#0d6ffd" : "#374151", fontWeight: cellIndex === 0 || cellIndex === 1 ? 700 : 500 }}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
