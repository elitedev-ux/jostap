import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import logo from "../../../assets/jostap logo.png3.png";
import authMockup from "../../../assets/JOSTAP Design (5).png";
import AuthShell from "../../../components/auth/AuthShell";
import PasswordRequirements from "../../../components/auth/PasswordRequirements";
import {
  isValidPassword,
  PASSWORD_PATTERN,
  PASSWORD_RULES,
} from "../../../utils/passwordPolicy";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const requestReset = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Unable to send reset code.");

      setNotice(data.message || "If an account exists for that email, a reset code has been sent.");
      setStep("reset");
    } catch (err) {
      setError(err.message || "Unable to send reset code.");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");

    if (!isValidPassword(password)) {
      setError(`Password must include: ${PASSWORD_RULES}`);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Unable to reset password.");

      setNotice(data.message || "Password reset successfully.");
      setCode("");
      setPassword("");
      setStep("done");
    } catch (err) {
      setError(err.message || "Unable to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell mockup={authMockup} mockupAlt="JOSTAP NFC card and mobile profile mockup">
      <div className="auth-form">
        <img className="auth-form__logo" src={logo} alt="JOSTAP" />
        <h1>Reset your password.</h1>
        <p className="auth-form__switch">
          Remembered it? <a href="/auth/signin">Sign in</a>
        </p>

        {error && <div className="auth-error">{error}</div>}
        {notice && (
          <div className="auth-error" style={{ borderColor: "#bbf7d0", background: "#f0fdf4", color: "#047857" }}>
            {notice}
          </div>
        )}

        {step === "done" ? (
          <a className="auth-submit" href="/auth/signin" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
            Go to sign in
          </a>
        ) : step === "reset" ? (
          <form onSubmit={resetPassword}>
            <div className="auth-fields">
              <label className="auth-field">
                <span>Reset code</span>
                <input
                  inputMode="numeric"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="6-digit code"
                  required
                />
              </label>
            </div>

            <div className="auth-password-row">
              <div className="auth-password-label">
                <span>New password</span>
              </div>
              <label className="auth-field auth-password-input">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="New password"
                  required
                  minLength={8}
                  pattern={PASSWORD_PATTERN}
                  title={PASSWORD_RULES}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((current) => !current)}
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </label>
              <PasswordRequirements password={password} />
            </div>

            <button className="auth-submit" disabled={loading} type="submit">
              {loading ? "Resetting..." : "Reset Password"}
            </button>
            <p className="auth-bottom-link">
              Did not get a code?{" "}
              <button
                type="button"
                onClick={() => setStep("request")}
                style={{ border: 0, background: "transparent", color: "#0d6ffd", fontWeight: 750, cursor: "pointer", padding: 0 }}
              >
                Send again
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={requestReset}>
            <div className="auth-fields">
              <label className="auth-field">
                <span>Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@company.com"
                  required
                />
              </label>
            </div>

            <button className="auth-submit" disabled={loading} type="submit" style={{ marginTop: 18 }}>
              {loading ? "Sending..." : "Send Reset Code"}
            </button>
          </form>
        )}
      </div>
    </AuthShell>
  );
}
