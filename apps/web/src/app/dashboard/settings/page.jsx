import { useEffect, useRef, useState } from "react";
import {
  User,
  Bell,
  Shield,
  Globe,
  Trash2,
  Save,
  Eye,
  EyeOff,
  Camera,
} from "lucide-react";
import {
  PROFILE_IMAGE_ACCEPT,
  PROFILE_IMAGE_RULES,
  isAllowedProfileImage,
} from "../../../utils/uploadRules";

const TABS = ["Profile", "Notifications", "Security", "Integrations"];

function Section({ title, desc, children }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #E5E7EB",
        borderRadius: 12,
        padding: "22px",
        marginBottom: 16,
      }}
    >
      <div
        style={{
          marginBottom: 20,
          paddingBottom: 16,
          borderBottom: "1px solid #F3F4F6",
        }}
      >
        <h2
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "#111827",
            marginBottom: 3,
          }}
        >
          {title}
        </h2>
        {desc && <p style={{ fontSize: 13, color: "#6B7280" }}>{desc}</p>}
      </div>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "9px 13px",
  borderRadius: 8,
  border: "1px solid #E5E7EB",
  fontSize: 14,
  color: "#111827",
  outline: "none",
  background: "#fff",
  boxSizing: "border-box",
};

function initialsFor(name) {
  return (
    (name || "Me")
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "ME"
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("Profile");
  const [saved, setSaved] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saveError, setSaveError] = useState("");
  const avatarInputRef = useRef(null);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    title: "",
    company: "",
    bio: "",
    phone: "",
    website: "",
    country: "",
    city: "",
    businessType: "Small business",
    primaryGoal: "Share my digital business card",
    slug: "",
    avatarUrl: "",
  });
  const [notifs, setNotifs] = useState({
    views: true,
    taps: true,
    leads: true,
    appointments: true,
    billing: true,
    marketing: false,
  });
  const [showPass, setShowPass] = useState(false);
  const [twoFactor, setTwoFactor] = useState({
    enabled: false,
    loading: true,
    setup: null,
    code: "",
    disableCode: "",
    message: "",
  });

  const update = (k, v) => setProfile((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "same-origin",
        });

        if (response.status === 401) {
          window.location.href = "/auth/signin?callbackUrl=/dashboard/settings";
          return;
        }

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.error || "Unable to load account details.");
        }

        const user = data.user || {};
        const kyc = user.kyc || {};

        if (active) {
          setProfile((current) => ({
            ...current,
            name: user.name || current.name,
            email: user.email || current.email,
            title: kyc.jobTitle || current.title,
            company: kyc.businessName || user.company || current.company,
            phone: kyc.phone || current.phone,
            website: kyc.website || current.website,
            country: kyc.country || current.country,
            city: kyc.city || current.city,
            businessType: kyc.businessType || current.businessType,
            primaryGoal: kyc.primaryGoal || current.primaryGoal,
            bio: kyc.bio || current.bio,
            slug: kyc.profileSlug || current.slug,
            avatarUrl: kyc.avatarUrl || current.avatarUrl,
          }));
        }
      } catch (error) {
        if (active) {
          setSaveError(error.message || "Unable to load account details.");
        }
      } finally {
        if (active) {
          setLoadingProfile(false);
        }
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadTwoFactor() {
      try {
        const response = await fetch("/api/auth/2fa/status", {
          credentials: "same-origin",
        });
        const data = await response.json().catch(() => ({}));

        if (active && response.ok) {
          setTwoFactor((current) => ({
            ...current,
            enabled: Boolean(data.enabled),
            loading: false,
          }));
        }
      } catch {
        if (active) {
          setTwoFactor((current) => ({ ...current, loading: false }));
        }
      }
    }

    loadTwoFactor();

    return () => {
      active = false;
    };
  }, []);

  const handleSave = async () => {
    setSaveError("");
    setSaved(false);

    try {
      const response = await fetch("/api/account", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Unable to save changes.");
      }

      const user = data.user || {};
      const kyc = user.kyc || {};

      setProfile((current) => ({
        ...current,
        name: user.name || current.name,
        email: user.email || current.email,
        title: kyc.jobTitle || current.title,
        company: kyc.businessName || user.company || current.company,
        phone: kyc.phone || current.phone,
        website: kyc.website || current.website,
        country: kyc.country || current.country,
        city: kyc.city || current.city,
        businessType: kyc.businessType || current.businessType,
        primaryGoal: kyc.primaryGoal || current.primaryGoal,
        bio: kyc.bio || current.bio,
        slug: kyc.profileSlug || current.slug,
        avatarUrl: kyc.avatarUrl || current.avatarUrl,
      }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      setSaveError(error.message || "Unable to save changes.");
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!isAllowedProfileImage(file)) {
      setSaveError(`Profile photo must be ${PROFILE_IMAGE_RULES}.`);
      event.target.value = "";
      return;
    }

    setSaveError("");
    setUploadingAvatar(true);

    try {
      const form = new FormData();
      form.append("file", file);

      const response = await fetch("/api/account/avatar", {
        method: "POST",
        credentials: "same-origin",
        body: form,
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Unable to upload profile photo.");
      }

      setProfile((current) => ({
        ...current,
        avatarUrl: data.avatarUrl || data.user?.kyc?.avatarUrl || current.avatarUrl,
      }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      setSaveError(error.message || "Unable to upload profile photo.");
    } finally {
      setUploadingAvatar(false);
      event.target.value = "";
    }
  };

  const startTwoFactorSetup = async () => {
    setSaveError("");
    setTwoFactor((current) => ({ ...current, message: "" }));

    try {
      const response = await fetch("/api/auth/2fa/setup", {
        method: "POST",
        credentials: "same-origin",
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Unable to start two-factor setup.");
      }

      setTwoFactor((current) => ({ ...current, setup: data, code: "" }));
    } catch (error) {
      setSaveError(error.message || "Unable to start two-factor setup.");
    }
  };

  const verifyTwoFactorSetup = async () => {
    setSaveError("");

    try {
      const response = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: twoFactor.code }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Unable to verify two-factor code.");
      }

      setTwoFactor((current) => ({
        ...current,
        enabled: Boolean(data.enabled),
        setup: null,
        code: "",
        message: "Two-factor authentication is enabled.",
      }));
    } catch (error) {
      setSaveError(error.message || "Unable to verify two-factor code.");
    }
  };

  const disableTwoFactor = async () => {
    setSaveError("");

    try {
      const response = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: twoFactor.disableCode }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Unable to disable two-factor authentication.");
      }

      setTwoFactor((current) => ({
        ...current,
        enabled: Boolean(data.enabled),
        setup: null,
        disableCode: "",
        message: "Two-factor authentication is disabled.",
      }));
    } catch (error) {
      setSaveError(error.message || "Unable to disable two-factor authentication.");
    }
  };

  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "#111827",
            letterSpacing: "-0.02em",
            marginBottom: 3,
          }}
        >
          Settings
        </h1>
        <p style={{ fontSize: 14, color: "#6B7280" }}>
          Manage your account preferences.
        </p>
      </div>

      {/* Tab nav */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid #E5E7EB",
          marginBottom: 24,
          gap: 0,
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              fontSize: 14,
              fontWeight: activeTab === tab ? 500 : 400,
              padding: "10px 18px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: activeTab === tab ? "#111827" : "#6B7280",
              borderBottom:
                activeTab === tab
                  ? "2px solid #0d6ffd"
                  : "2px solid transparent",
              marginBottom: -1,
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Profile" && (
        <>
          {saveError && (
            <div
              style={{
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                color: "#B91C1C",
                borderRadius: 10,
                padding: "11px 14px",
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 16,
              }}
            >
              {saveError}
            </div>
          )}
          <Section
            title="Profile Photo"
            desc="This appears on your NFC card and public profile."
          >
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ position: "relative", width: 72, height: 72 }}>
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg,#0d6ffd,#ff9f0d)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                    fontWeight: 700,
                    color: "#fff",
                    overflow: "hidden",
                  }}
                >
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={profile.name || "Profile photo"}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    initialsFor(profile.name)
                  )}
                </div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept={PROFILE_IMAGE_ACCEPT}
                  onChange={handleAvatarUpload}
                  style={{ display: "none" }}
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: "#fff",
                    border: "1px solid #E5E7EB",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Camera size={11} color="#6B7280" />
                </button>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#0d6ffd",
                    background: "#eaf3ff",
                    border: "1px solid #BFDBFE",
                    borderRadius: 8,
                    padding: "7px 14px",
                    cursor: uploadingAvatar ? "wait" : "pointer",
                    opacity: uploadingAvatar ? 0.75 : 1,
                  }}
                >
                  {uploadingAvatar ? "Uploading..." : "Upload photo"}
                </button>
                <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 5 }}>
                  {PROFILE_IMAGE_RULES}
                </p>
              </div>
            </div>
          </Section>

          <Section
            title="Personal Information"
            desc="This appears on your public-facing digital cards."
          >
            {loadingProfile && (
              <p style={{ color: "#6B7280", fontSize: 13, marginBottom: 16 }}>
                Loading your saved account details...
              </p>
            )}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
                marginBottom: 16,
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#374151",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Full name
                </label>
                <input
                  value={profile.name}
                  onChange={(e) => update("name", e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = "#0d6ffd")}
                  onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#374151",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Job title
                </label>
                <input
                  value={profile.title}
                  onChange={(e) => update("title", e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = "#0d6ffd")}
                  onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#374151",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Company
                </label>
                <input
                  value={profile.company}
                  onChange={(e) => update("company", e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = "#0d6ffd")}
                  onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#374151",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Email address
                </label>
                <input
                  value={profile.email}
                  onChange={(e) => update("email", e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = "#0d6ffd")}
                  onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#374151",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Phone number
                </label>
                <input
                  value={profile.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = "#0d6ffd")}
                  onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#374151",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Website
                </label>
                <input
                  value={profile.website}
                  onChange={(e) => update("website", e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = "#0d6ffd")}
                  onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
                />
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
                marginBottom: 16,
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#374151",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Country
                </label>
                <input
                  value={profile.country}
                  onChange={(e) => update("country", e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#374151",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  City
                </label>
                <input
                  value={profile.city}
                  onChange={(e) => update("city", e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#374151",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Business type
                </label>
                <input
                  value={profile.businessType}
                  onChange={(e) => update("businessType", e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#374151",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Primary goal
                </label>
                <input
                  value={profile.primaryGoal}
                  onChange={(e) => update("primaryGoal", e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#374151",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Bio
              </label>
              <textarea
                value={profile.bio}
                onChange={(e) => update("bio", e.target.value)}
                rows={3}
                style={{ ...inputStyle, resize: "vertical" }}
                onFocus={(e) => (e.target.style.borderColor = "#0d6ffd")}
                onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#374151",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Public profile URL
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  border: "1px solid #E5E7EB",
                  borderRadius: 8,
                  overflow: "hidden",
                }}
              >
                <span
                  style={{
                    padding: "9px 12px",
                    background: "#f5f5f5",
                    borderRight: "1px solid #E5E7EB",
                    fontSize: 13,
                    color: "#9CA3AF",
                    whiteSpace: "nowrap",
                  }}
                >
                  jostap.com/
                </span>
                <input
                  value={profile.slug}
                  onChange={(e) => update("slug", e.target.value)}
                  style={{ ...inputStyle, border: "none", borderRadius: 0 }}
                />
              </div>
            </div>
            <button
              onClick={handleSave}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 14,
                fontWeight: 600,
                color: "#fff",
                background: saved ? "#059669" : "#0d6ffd",
                border: "none",
                borderRadius: 8,
                padding: "9px 20px",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
            >
              <Save size={14} /> {saved ? "Saved!" : "Save Changes"}
            </button>
          </Section>

          <Section
            title="Danger Zone"
            desc="Irreversible and destructive actions."
          >
            <button
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
                fontWeight: 500,
                color: "#DC2626",
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: 8,
                padding: "9px 16px",
                cursor: "pointer",
              }}
            >
              <Trash2 size={14} /> Delete Account
            </button>
          </Section>
        </>
      )}

      {activeTab === "Notifications" && (
        <Section
          title="Notification Preferences"
          desc="Choose what you want to be notified about."
        >
          {[
            ["views", "Profile views", "When someone views your card"],
            ["taps", "NFC taps", "When your card is tapped"],
            ["leads", "New leads", "When a visitor shares their contact"],
            [
              "appointments",
              "Appointment requests",
              "New booking from your card",
            ],
            [
              "billing",
              "Billing alerts",
              "Payment confirmations and reminders",
            ],
            [
              "marketing",
              "Product updates",
              "Tips, new features, and announcements",
            ],
          ].map(([key, label, desc]) => (
            <div
              key={key}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 0",
                borderBottom: "1px solid #F3F4F6",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#111827",
                    marginBottom: 2,
                  }}
                >
                  {label}
                </p>
                <p style={{ fontSize: 13, color: "#6B7280" }}>{desc}</p>
              </div>
              <div
                onClick={() => setNotifs((n) => ({ ...n, [key]: !n[key] }))}
                style={{
                  width: 42,
                  height: 24,
                  borderRadius: 12,
                  cursor: "pointer",
                  background: notifs[key] ? "#0d6ffd" : "#E5E7EB",
                  position: "relative",
                  transition: "background 0.2s",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: "#fff",
                    position: "absolute",
                    top: 3,
                    left: notifs[key] ? 21 : 3,
                    transition: "left 0.2s",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                  }}
                />
              </div>
            </div>
          ))}
        </Section>
      )}

      {activeTab === "Security" && (
        <>
        <Section
          title="Two-Factor Authentication"
          desc="Use an authenticator app to add a second verification step at sign-in."
        >
          {saveError && (
            <div
              style={{
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                color: "#B91C1C",
                borderRadius: 10,
                padding: "11px 14px",
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 16,
              }}
            >
              {saveError}
            </div>
          )}
          {twoFactor.message && (
            <div
              style={{
                background: "#ECFDF5",
                border: "1px solid #A7F3D0",
                color: "#047857",
                borderRadius: 10,
                padding: "11px 14px",
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 16,
              }}
            >
              {twoFactor.message}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
                Status: {twoFactor.enabled ? "Enabled" : "Disabled"}
              </p>
              <p style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>
                Scan the setup URL with an authenticator app, or enter the secret manually.
              </p>
            </div>
            {!twoFactor.enabled && (
              <button
                type="button"
                onClick={startTwoFactorSetup}
                disabled={twoFactor.loading}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#fff",
                  background: "#0d6ffd",
                  border: "none",
                  borderRadius: 8,
                  padding: "9px 16px",
                  cursor: "pointer",
                }}
              >
                <Shield size={14} /> Set Up 2FA
              </button>
            )}
          </div>

          {twoFactor.setup && (
            <div style={{ marginTop: 18, display: "grid", gap: 12, maxWidth: 560 }}>
              <div style={{ background: "#f5f5f5", border: "1px solid #E5E7EB", borderRadius: 10, padding: 14 }}>
                <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 6 }}>Authenticator setup URL</p>
                <p style={{ fontSize: 12, color: "#111827", wordBreak: "break-all" }}>{twoFactor.setup.otpauthUrl}</p>
                <p style={{ fontSize: 12, color: "#6B7280", marginTop: 10 }}>Manual secret: <strong>{twoFactor.setup.secret}</strong></p>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <input
                  inputMode="numeric"
                  value={twoFactor.code}
                  onChange={(event) => setTwoFactor((current) => ({ ...current, code: event.target.value }))}
                  placeholder="6-digit code"
                  style={{ ...inputStyle, maxWidth: 180 }}
                />
                <button
                  type="button"
                  onClick={verifyTwoFactorSetup}
                  style={{ border: "none", background: "#059669", color: "#fff", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                >
                  Verify and Enable
                </button>
              </div>
            </div>
          )}

          {twoFactor.enabled && (
            <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input
                inputMode="numeric"
                value={twoFactor.disableCode}
                onChange={(event) => setTwoFactor((current) => ({ ...current, disableCode: event.target.value }))}
                placeholder="Current 2FA code"
                style={{ ...inputStyle, maxWidth: 190 }}
              />
              <button
                type="button"
                onClick={disableTwoFactor}
                style={{ border: "1px solid #FECACA", background: "#FEF2F2", color: "#DC2626", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
              >
                Disable 2FA
              </button>
            </div>
          )}
        </Section>

        <Section
          title="Change Password"
          desc="We recommend using a strong, unique password."
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              maxWidth: 400,
            }}
          >
            {[
              ["Current password", "currentPass"],
              ["New password", "newPass"],
              ["Confirm new password", "confirmPass"],
            ].map(([label, key]) => (
              <div key={key}>
                <label
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#374151",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  {label}
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    style={{ ...inputStyle, paddingRight: 40 }}
                    onFocus={(e) => (e.target.style.borderColor = "#0d6ffd")}
                    onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#9CA3AF",
                    }}
                  >
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            ))}
            <button
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                width: "fit-content",
                fontSize: 14,
                fontWeight: 600,
                color: "#fff",
                background: "#0d6ffd",
                border: "none",
                borderRadius: 8,
                padding: "9px 20px",
                cursor: "pointer",
              }}
            >
              <Shield size={14} /> Update Password
            </button>
          </div>
        </Section>
        </>
      )}

      {activeTab === "Integrations" && (
        <Section
          title="Connected Integrations"
          desc="Manage third-party connections."
        >
          {[
            {
              name: "Cal.com",
              desc: "Appointment booking",
              connected: true,
              color: "#0d6ffd",
            },
            {
              name: "Stripe",
              desc: "Payments & billing",
              connected: true,
              color: "#635BFF",
            },
            {
              name: "Zapier",
              desc: "Workflow automation",
              connected: false,
              color: "#FF4A00",
            },
            {
              name: "HubSpot",
              desc: "CRM sync",
              connected: false,
              color: "#FF7A59",
            },
          ].map((int) => (
            <div
              key={int.name}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 0",
                borderBottom: "1px solid #F3F4F6",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 9,
                    background: `${int.color}18`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Globe size={16} color={int.color} />
                </div>
                <div>
                  <p
                    style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}
                  >
                    {int.name}
                  </p>
                  <p style={{ fontSize: 13, color: "#6B7280" }}>{int.desc}</p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {int.connected && (
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: "#059669",
                      background: "#ECFDF5",
                      borderRadius: 999,
                      padding: "3px 9px",
                    }}
                  >
                    Connected
                  </span>
                )}
                <button
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: int.connected ? "#DC2626" : "#0d6ffd",
                    background: int.connected ? "#FEF2F2" : "#eaf3ff",
                    border: int.connected
                      ? "1px solid #FECACA"
                      : "1px solid #BFDBFE",
                    borderRadius: 7,
                    padding: "6px 14px",
                    cursor: "pointer",
                  }}
                >
                  {int.connected ? "Disconnect" : "Connect"}
                </button>
              </div>
            </div>
          ))}
        </Section>
      )}
    </>
  );
}
