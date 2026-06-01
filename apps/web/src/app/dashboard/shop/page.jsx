import { ShoppingBag } from "lucide-react";

export default function ShopPage() {
  return (
    <div
      style={{
        minHeight: "calc(100vh - 140px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 520,
          background: "#fff",
          border: "1px solid #E5E7EB",
          borderRadius: 12,
          padding: 32,
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: "#EFF6FF",
            color: "#2563EB",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <ShoppingBag size={22} />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", marginBottom: 8 }}>
          Shop
        </h1>
        <p style={{ fontSize: 15, color: "#6B7280", lineHeight: 1.6 }}>
          Coming Soon
        </p>
      </section>
    </div>
  );
}
