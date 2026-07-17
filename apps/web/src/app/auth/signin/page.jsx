import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import logo from "../../../assets/jostap logo.png3.png";
import authMockup from "../../../assets/loginmockup.optimized.jpg";
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

function destinationForUser(user, callbackUrl) {
  const safeCallback = safeCallbackUrl(callbackUrl);

  if (safeCallback && safeCallback !== "/dashboard") {
    return safeCallback;
  }

  return user?.role === "admin" ? "/admin" : "/dashboard";
}

export default function SignInPage() {
  const callbackUrl =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("callbackUrl") || "/dashboard"
      : "/dashboard";
  const initialError =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("error") || ""
      : "";
  const initialVerificationEmail =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("verifyEmail") || ""
      : "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");
  const [verificationEmail, setVerificationEmail] = useState(initialVerificationEmail);
  const [verificationCode, setVerificationCode] = useState("");

  useEffect(() => {
    let active = true;

    async function redirectAuthenticatedUser() {
      try {
        const response = await fetch("/api/auth/me", { credentials: "same-origin" });
        const data = await response.json().catch(() => ({}));

        if (response.ok && data.user) {
          clearDashboardDataCache();
          window.location.replace(destinationForUser(data.user, callbackUrl));
          return;
        }
      } catch {
        // If the session check fails, let the normal sign-in form handle auth.
      }

      if (active) {
        setError(initialError);
        setCheckingSession(false);
      }
    }

    redirectAuthenticatedUser();

    return () => {
      active = false;
    };
  }, [callbackUrl, initialError]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isValidPassword(password)) {
      setError(`Password must include: ${PASSWORD_RULES}`);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Invalid email or password.");
      }

      if (data.requiresVerification) {
        setVerificationEmail(data.email || email);
        return;
      }

      clearDashboardDataCache();
      window.location.href = destinationForUser(data.user, callbackUrl);
    } catch (error) {
      setError(error.message || "Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/verify-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email: verificationEmail || email, code: verificationCode }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Unable to verify your account.");
      }

      clearDashboardDataCache();
      window.location.href = destinationForUser(data.user, callbackUrl);
    } catch (error) {
      setError(error.message || "Unable to verify your account.");
    } finally {
      setLoading(false);
    }
  };

  const resendVerificationCode = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email: verificationEmail || email }),
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
      mockupAlt="JOSTAP NFC card and mobile profile mockup"
    >
      <div className="auth-form">
        <img className="auth-form__logo" src={logo} alt="JOSTAP" />
        <h1>Welcome to JOSTAP.</h1>
        <p className="auth-form__switch">
          Need an account? <a href={callbackUrl ? `/auth/signup?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/auth/signup"}>Create one free</a>
        </p>

        {error && <div className="auth-error">{error}</div>}

        {verificationEmail ? (
          <form onSubmit={handleVerifyEmail}>
            <p className="auth-form__switch" style={{ marginTop: 0 }}>
              We sent a 6-digit code to {verificationEmail}.
            </p>
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
              onClick={resendVerificationCode}
              disabled={loading}
              className="auth-submit"
              style={{ marginTop: 10, background: "#eaf3ff", color: "#0d6ffd" }}
            >
              Resend Code
            </button>
          </form>
        ) : (
        <form onSubmit={handleSubmit}>
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

          <div className="auth-password-row">
            <div className="auth-password-label">
              <span>Password</span>
              <a href="/auth/forgot-password">Forgot password?</a>
            </div>
            <label className="auth-field auth-password-input">
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
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
            <PasswordRequirements password={password} />
          </div>

          <button className="auth-submit" disabled={loading} type="submit">
            {loading ? "Signing in..." : "Log In"}
          </button>
        </form>
        )}

        {!verificationEmail && <div className="auth-social-divider">
          <div />
          <span>or continue with</span>
          <div />
        </div>}

        {!verificationEmail && <div className="auth-social-grid">
          <button
            type="button"
            disabled={loading || googleLoading || checkingSession}
            onClick={() => {
              if (googleLoading) return;
              setGoogleLoading(true);
              setError("");
              window.location.href = `/api/auth/google?callbackUrl=${encodeURIComponent(callbackUrl)}`;
            }}
          >
            <GoogleIcon />
            {googleLoading ? "Connecting..." : "Continue with Google"}
          </button>
        </div>}
      </div>
    </AuthShell>
  );
}
