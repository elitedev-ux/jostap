import { ArrowLeft, Mail } from "lucide-react";
import logo from "../../../assets/jostap logo.png3.png";

export default function ForgotPasswordPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 420, background: "#fff", border: "1px solid #E5E7EB", borderRadius: 14, padding: 28 }}>
        <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#6B7280", textDecoration: "none", fontSize: 13, marginBottom: 26 }}>
          <ArrowLeft size={14} /> Back to home
        </a>
        <img src={logo} alt="JOSTAP" style={{ width: 118, height: 46, objectFit: "contain", marginBottom: 24 }} />
        <h1 style={{ fontSize: 25, fontWeight: 800, color: "#111827", marginBottom: 6 }}>Reset your password</h1>
        <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.6, marginBottom: 24 }}>
          Password reset by email is being finalized. For now, contact support from your registered email so an admin can verify your account safely.
        </p>
        <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Email address</label>
        <div style={{ display: "flex", alignItems: "center", gap: 9, border: "1px solid #E5E7EB", borderRadius: 9, padding: "10px 12px", marginBottom: 16 }}>
          <Mail size={15} color="#9CA3AF" />
          <input type="email" placeholder="you@company.com" disabled style={{ border: "none", outline: "none", flex: 1, fontSize: 14, background: "transparent", color: "#9CA3AF" }} />
        </div>
        <a href="/dashboard/support" style={{ display: "block", width: "100%", boxSizing: "border-box", textAlign: "center", textDecoration: "none", border: "none", background: "#0d6ffd", color: "#fff", borderRadius: 9, padding: 11, fontSize: 14, fontWeight: 700 }}>
          Contact support
        </a>
        <p style={{ textAlign: "center", marginTop: 18, fontSize: 13, color: "#6B7280" }}>
          Remembered it? <a href="/auth/signin" style={{ color: "#0d6ffd", textDecoration: "none", fontWeight: 700 }}>Sign in</a>
        </p>
      </div>
    </div>
  );
}
