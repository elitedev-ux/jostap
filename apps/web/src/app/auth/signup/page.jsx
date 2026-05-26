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

export default function SignUpPage() {
  const checkoutParams =
    typeof window !== "undefined" ? window.location.search : "";
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    company: "",
    email: "",
    password: "",
    confirmPassword: "",
    updates: false,
    terms: false,
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isValidPassword(form.password)) {
      setError(`Password must include: ${PASSWORD_RULES}`);
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords must match.");
      return;
    }

    if (!form.terms) {
      setError("Please agree to the Terms and Privacy Policy.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          company: form.company,
          email: form.email,
          password: form.password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Unable to create your account.");
      }

      window.location.href = `/checkout${checkoutParams || "?plan=professional&billing=monthly"}`;
    } catch (error) {
      setError(error.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      mockup={authMockup}
      mockupAlt="JOSTAP mobile profile and NFC card mockup"
    >
      <div className="auth-form">
        <img className="auth-form__logo" src={logo} alt="JOSTAP" />
        <h1>Welcome to JOSTAP.</h1>
        <p className="auth-form__switch">
          Already have an account? <a href="/auth/signin">Log in</a>
        </p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="auth-fields auth-fields--two">
            <label className="auth-field">
              <span>First Name</span>
              <input
                value={form.firstName}
                onChange={(event) => update("firstName", event.target.value)}
                placeholder="First name"
                required
              />
            </label>
            <label className="auth-field">
              <span>Last Name</span>
              <input
                value={form.lastName}
                onChange={(event) => update("lastName", event.target.value)}
                placeholder="Last name"
                required
              />
            </label>
            <label className="auth-field">
              <span>Company</span>
              <input
                value={form.company}
                onChange={(event) => update("company", event.target.value)}
                placeholder="Company name"
              />
            </label>
            <label className="auth-field">
              <span>Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => update("email", event.target.value)}
                placeholder="you@company.com"
                required
              />
            </label>
          </div>

          <div className="auth-fields auth-fields--two" style={{ marginTop: 16 }}>
            <div className="auth-password-row" style={{ marginTop: 0 }}>
              <span>Password</span>
              <label className="auth-field auth-password-input">
                <input
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={(event) => update("password", event.target.value)}
                  placeholder="Password"
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
            </div>

            <label className="auth-field">
              <span>Confirm Password</span>
              <input
                type={showPass ? "text" : "password"}
                value={form.confirmPassword}
                onChange={(event) =>
                  update("confirmPassword", event.target.value)
                }
                placeholder="Confirm password"
                required
              />
            </label>
          </div>

          <PasswordRequirements password={form.password} />

          <div className="auth-checks">
            <label>
              <input
                checked={form.updates}
                onChange={(event) => update("updates", event.target.checked)}
                type="checkbox"
              />
              I want to receive latest news and product updates from JOSTAP.
            </label>
            <label>
              <input
                checked={form.terms}
                onChange={(event) => update("terms", event.target.checked)}
                type="checkbox"
                required
              />
              I agree to the <a href="/terms">Terms</a> &{" "}
              <a href="/privacy">Privacy Policy</a>.
            </label>
          </div>

          <button className="auth-submit" disabled={loading} type="submit">
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>
      </div>
    </AuthShell>
  );
}
