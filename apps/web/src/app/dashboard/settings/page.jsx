import { useEffect, useRef, useState } from "react";
import {
  User,
  Shield,
  Globe,
  CheckCircle2,
  Link2,
  Loader2,
  Trash2,
  Save,
  Eye,
  EyeOff,
  Camera,
  Unplug,
} from "lucide-react";
import {
  PROFILE_IMAGE_ACCEPT,
  PROFILE_IMAGE_RULES,
  isAllowedProfileImage,
} from "../../../utils/uploadRules";
import { IMAGE_UPLOAD_TARGETS, prepareImageForUpload } from "../../../utils/imageCompression";
import { clearDashboardDataCache } from "../../../utils/dashboardDataStore";

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
  const [deletingAccount, setDeletingAccount] = useState(false);
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
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [hasPassword, setHasPassword] = useState(true);
  const [googleContacts, setGoogleContacts] = useState({
    connected: false,
    syncEnabled: false,
    status: "dashboard_only",
    accountEmail: "",
    lastSyncedAt: "",
    lastError: "",
  });
  const [integrationBusy, setIntegrationBusy] = useState("");
  const [integrationMessage, setIntegrationMessage] = useState("");

  const update = (k, v) => setProfile((p) => ({ ...p, [k]: v }));
  const updatePasswordField = (key, value) =>
    setPasswordForm((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("tab") === "Integrations") {
      setActiveTab("Integrations");
    }
    if (params.get("googleContacts") === "connected") {
      setIntegrationMessage("Google Contacts connected. New leads will sync automatically.");
    }
    if (params.get("googleContacts") === "failed") {
      setIntegrationMessage("Google Contacts could not be connected. Please try again.");
    }
  }, []);

  async function loadGoogleContactsIntegration({ active = true } = {}) {
    try {
      const response = await fetch("/api/integrations/google-contacts", {
        credentials: "same-origin",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) return;
      if (active) {
        setGoogleContacts((current) => ({
          ...current,
          ...(data.integration || {}),
        }));
      }
    } catch {
      if (active) {
        setGoogleContacts((current) => ({ ...current, connected: false, syncEnabled: false }));
      }
    }
  }

  useEffect(() => {
    let active = true;
    loadGoogleContactsIntegration({ active });
    return () => {
      active = false;
    };
  }, []);

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
          setHasPassword(user.auth?.hasPassword !== false);
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
      const prepared = await prepareImageForUpload(file, IMAGE_UPLOAD_TARGETS.avatar);
      const form = new FormData();
      form.append("file", prepared.file);

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

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Delete your JOSTAP account and all account data? This cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    setSaveError("");
    setDeletingAccount(true);

    try {
      const response = await fetch("/api/account", {
        method: "DELETE",
        credentials: "same-origin",
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Unable to delete your account.");
      }

      clearDashboardDataCache();
      window.location.href = "/";
    } catch (error) {
      setSaveError(error.message || "Unable to delete your account.");
      setDeletingAccount(false);
    }
  };

  const handlePasswordUpdate = async (event) => {
    event.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if ((!hasPassword && !passwordForm.newPassword) || (hasPassword && !passwordForm.currentPassword) || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError(hasPassword ? "Fill in your current password, new password, and confirmation." : "Fill in your new password and confirmation.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }

    if (hasPassword && passwordForm.currentPassword === passwordForm.newPassword) {
      setPasswordError("New password must be different from your current password.");
      return;
    }

    setUpdatingPassword(true);

    try {
      const response = await fetch("/api/account/password", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: hasPassword ? passwordForm.currentPassword : "",
          newPassword: passwordForm.newPassword,
          createPassword: !hasPassword,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Unable to update password.");
      }

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordSuccess(data.message || "Password updated successfully.");
      setHasPassword(true);
    } catch (error) {
      setPasswordError(error.message || "Unable to update password.");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const connectGoogleContacts = () => {
    setIntegrationBusy("connect");
    window.location.href = "/api/integrations/google-contacts/connect";
  };

  const updateGoogleContactsSync = async (syncEnabled) => {
    setIntegrationBusy("toggle");
    setIntegrationMessage("");

    try {
      const response = await fetch("/api/integrations/google-contacts", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ syncEnabled }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Unable to update Google Contacts sync.");
      setGoogleContacts((current) => ({ ...current, ...(data.integration || {}) }));
      setIntegrationMessage(syncEnabled ? "Google Contacts sync is on." : "Google Contacts sync is off. Leads will stay in JOSTAP only.");
    } catch (error) {
      setIntegrationMessage(error.message || "Unable to update Google Contacts sync.");
    } finally {
      setIntegrationBusy("");
    }
  };

  const disconnectGoogleContacts = async () => {
    const confirmed = window.confirm("Disconnect Google Contacts? New leads will remain in your JOSTAP dashboard only.");
    if (!confirmed) return;

    setIntegrationBusy("disconnect");
    setIntegrationMessage("");

    try {
      const response = await fetch("/api/integrations/google-contacts", {
        method: "DELETE",
        credentials: "same-origin",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Unable to disconnect Google Contacts.");
      setGoogleContacts((current) => ({ ...current, ...(data.integration || {}) }));
      setIntegrationMessage("Google Contacts disconnected. Leads will remain in JOSTAP only.");
    } catch (error) {
      setIntegrationMessage(error.message || "Unable to disconnect Google Contacts.");
    } finally {
      setIntegrationBusy("");
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
                      loading="lazy"
                      decoding="async"
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
                Account profile slug
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
                  @
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
              type="button"
              onClick={handleDeleteAccount}
              disabled={deletingAccount}
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
                cursor: deletingAccount ? "wait" : "pointer",
                opacity: deletingAccount ? 0.7 : 1,
              }}
            >
              <Trash2 size={14} /> {deletingAccount ? "Deleting..." : "Delete Account"}
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
          title={hasPassword ? "Change Password" : "Create Password"}
          desc={hasPassword ? "We recommend using a strong, unique password." : "You signed in with Google. Create a JOSTAP password if you also want to sign in with email and password."}
        >
          <form
            onSubmit={handlePasswordUpdate}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              maxWidth: 400,
            }}
          >
            {[
              ...(hasPassword ? [["Current password", "currentPassword", "current-password"]] : []),
              ["New password", "newPassword", "new-password"],
              ["Confirm new password", "confirmPassword", "new-password"],
            ].map(([label, key, autoComplete]) => (
              <div key={key}>
                <label
                  htmlFor={`settings-${key}`}
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
                    id={`settings-${key}`}
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    value={passwordForm[key]}
                    autoComplete={autoComplete}
                    style={{ ...inputStyle, paddingRight: 40 }}
                    onChange={(e) => updatePasswordField(key, e.target.value)}
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
            {passwordError && (
              <div
                role="alert"
                style={{
                  background: "#FEF2F2",
                  border: "1px solid #FECACA",
                  color: "#B91C1C",
                  borderRadius: 10,
                  padding: "10px 12px",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div
                role="status"
                style={{
                  background: "#ECFDF3",
                  border: "1px solid #BBF7D0",
                  color: "#047857",
                  borderRadius: 10,
                  padding: "10px 12px",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {passwordSuccess}
              </div>
            )}
            <button
              type="submit"
              disabled={updatingPassword}
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
                cursor: updatingPassword ? "not-allowed" : "pointer",
                opacity: updatingPassword ? 0.72 : 1,
              }}
            >
              <Shield size={14} /> {updatingPassword ? (hasPassword ? "Updating..." : "Creating...") : hasPassword ? "Update Password" : "Create Password"}
            </button>
          </form>
        </Section>
        </>
      )}

      {activeTab === "Integrations" && (
        <Section
          title="Contact Sync"
          desc="Choose where new leads from your card profiles should go."
        >
          {integrationMessage && (
            <div
              style={{
                background: integrationMessage.toLowerCase().includes("could not") || integrationMessage.toLowerCase().includes("unable")
                  ? "#FEF2F2"
                  : "#ECFDF5",
                border: integrationMessage.toLowerCase().includes("could not") || integrationMessage.toLowerCase().includes("unable")
                  ? "1px solid #FECACA"
                  : "1px solid #BBF7D0",
                color: integrationMessage.toLowerCase().includes("could not") || integrationMessage.toLowerCase().includes("unable")
                  ? "#B91C1C"
                  : "#047857",
                borderRadius: 10,
                padding: "11px 14px",
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 14,
              }}
            >
              {integrationMessage}
            </div>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 14,
              flexWrap: "wrap",
              padding: "14px 0",
              borderBottom: "1px solid #F3F4F6",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: "#EAF3FF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {googleContacts.connected ? (
                  <CheckCircle2 size={17} color="#0d6ffd" />
                ) : (
                  <Link2 size={17} color="#0d6ffd" />
                )}
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
                  Google Contacts
                </p>
                <p style={{ fontSize: 13, color: "#6B7280" }}>
                  {googleContacts.connected
                    ? `Connected${googleContacts.accountEmail ? ` as ${googleContacts.accountEmail}` : ""}`
                    : "Automatically create Google contacts from new leads."}
                </p>
                {googleContacts.lastError && (
                  <p style={{ fontSize: 12, color: "#B91C1C", marginTop: 4 }}>
                    {googleContacts.lastError}
                  </p>
                )}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              {googleContacts.connected && (
                <button
                  type="button"
                  onClick={() => updateGoogleContactsSync(!googleContacts.syncEnabled)}
                  disabled={integrationBusy === "toggle"}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    border: "1px solid #D1D5DB",
                    borderRadius: 999,
                    background: googleContacts.syncEnabled ? "#ECFDF5" : "#fff",
                    color: googleContacts.syncEnabled ? "#047857" : "#374151",
                    padding: "7px 12px",
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: integrationBusy === "toggle" ? "wait" : "pointer",
                  }}
                >
                  {integrationBusy === "toggle" && <Loader2 size={13} />}
                  {googleContacts.syncEnabled ? "Sync on" : "Sync off"}
                </button>
              )}

              {googleContacts.connected ? (
                <button
                  type="button"
                  onClick={disconnectGoogleContacts}
                  disabled={Boolean(integrationBusy)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    border: "1px solid #FECACA",
                    borderRadius: 8,
                    background: "#FEF2F2",
                    color: "#B91C1C",
                    padding: "8px 13px",
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: integrationBusy ? "wait" : "pointer",
                  }}
                >
                  <Unplug size={14} /> Disconnect
                </button>
              ) : (
                <button
                  type="button"
                  onClick={connectGoogleContacts}
                  disabled={integrationBusy === "connect"}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    border: "none",
                    borderRadius: 8,
                    background: "#0d6ffd",
                    color: "#fff",
                    padding: "9px 14px",
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: integrationBusy === "connect" ? "wait" : "pointer",
                  }}
                >
                  {integrationBusy === "connect" ? <Loader2 size={14} /> : <Globe size={14} />}
                  Connect Google
                </button>
              )}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 14,
              flexWrap: "wrap",
              padding: "14px 0",
              borderBottom: "1px solid #F3F4F6",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CheckCircle2 size={17} color="#64748B" />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Dashboard only</p>
                <p style={{ fontSize: 13, color: "#6B7280" }}>Every lead is always saved in your JOSTAP Leads dashboard.</p>
              </div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#047857", background: "#ECFDF5", border: "1px solid #BBF7D0", borderRadius: 999, padding: "6px 12px" }}>
              Always on
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 14,
              flexWrap: "wrap",
              padding: "14px 0",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: "#F5F3FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Globe size={17} color="#6D28D9" />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Apple Contacts</p>
                <p style={{ fontSize: 13, color: "#6B7280" }}>iCloud contact sync can be added later.</p>
              </div>
            </div>
            <span style={{ minWidth: 106, textAlign: "center", fontSize: 12, fontWeight: 800, color: "#92400E", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 999, padding: "6px 12px" }}>
              Coming Soon
            </span>
          </div>
        </Section>
      )}

    </>
  );
}
