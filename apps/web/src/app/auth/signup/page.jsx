import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import logo from "../../../assets/jostap logo.png3.png";
import authMockup from "../../../assets/loginmockup.png";
import AuthShell from "../../../components/auth/AuthShell";
import PasswordRequirements from "../../../components/auth/PasswordRequirements";
import {
  isValidPassword,
  PASSWORD_PATTERN,
  PASSWORD_RULES,
} from "../../../utils/passwordPolicy";
import { clearDashboardDataCache } from "../../../utils/dashboardDataStore";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

function safeCallbackUrl(value) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "";
  }

  return value;
}

function destinationAfterSignup(callbackUrl) {
  const safeCallback = safeCallbackUrl(callbackUrl);
  return safeCallback && safeCallback !== "/dashboard" ? safeCallback : "/kyc";
}

export default function SignUpPage() {
  const callbackUrl =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("callbackUrl") || ""
      : "";
  const initialError =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("error") || ""
      : "";
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
  const [error, setError] = useState(initialError);
  const [verificationCode, setVerificationCode] = useState("");
  const [awaitingVerification, setAwaitingVerification] = useState(false);

  useEffect(() => {
    let active = true;

    async function redirectAuthenticatedUser() {
      const destination = destinationAfterSignup(callbackUrl);
      if (destination === "/kyc") return;

      try {
        const response = await fetch("/api/auth/me", { credentials: "same-origin" });
        const data = await response.json().catch(() => ({}));

        if (active && response.ok && data.user) {
          clearDashboardDataCache();
          window.location.replace(destination);
        }
      } catch {
        // Let the normal signup form handle unauthenticated visitors.
      }
    }

    redirectAuthenticatedUser();

    return () => {
      active = false;
    };
  }, [callbackUrl]);

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

      if (data.requiresVerification) {
        setAwaitingVerification(true);
        return;
      }

      clearDashboardDataCache();
      window.location.href = destinationAfterSignup(callbackUrl);
    } catch (error) {
      setError(error.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/verify-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email: form.email, code: verificationCode }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Unable to verify your account.");
      }

      clearDashboardDataCache();
      window.location.href = destinationAfterSignup(callbackUrl);
    } catch (error) {
      setError(error.message || "Unable to verify your account.");
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email: form.email }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Unable to resend verification code.");
      }
    } catch (error) {
      setError(error.message || "Unable to resend verification code.");
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
          Already have an account? <a href={callbackUrl ? `/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/auth/signin"}>Log in</a>
        </p>

        {error && <div className="auth-error">{error}</div>}

        {awaitingVerification ? (
          <form onSubmit={handleVerify}>
            <div className="auth-fields">
              <label className="auth-field">
                <span>Email verification code</span>
                <input
                  inputMode="numeric"
                  value={verificationCode}
                  onChange={(event) => setVerificationCode(event.target.value)}
                  placeholder="6-digit code"
                  required
                />
              </label>
            </div>
            <button className="auth-submit" disabled={loading} type="submit">
              {loading ? "Verifying..." : "Verify Email"}
            </button>
            <button
              type="button"
              onClick={resendCode}
              disabled={loading}
              className="auth-submit"
              style={{ marginTop: 10, background: "#eaf3ff", color: "#0d6ffd" }}
            >
              Resend Code
            </button>
          </form>
        ) : (
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
        )}

        {!awaitingVerification && <div className="auth-social-divider">
          <div />
          <span>or continue with</span>
          <div />
        </div>}

        {!awaitingVerification && <div className="auth-social-grid">
          <button
            type="button"
            onClick={() => {
              window.location.href = `/api/auth/google?intent=signup&callbackUrl=${encodeURIComponent(destinationAfterSignup(callbackUrl))}`;
            }}
          >
            <GoogleIcon />
            Continue with Google
          </button>
        </div>}
      </div>
    </AuthShell>
  );
}
