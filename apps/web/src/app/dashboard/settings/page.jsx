import { useState } from "react";
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

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("Profile");
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    title: "",
    company: "",
    bio: "",
    phone: "",
    website: "",
    slug: "",
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

  const update = (k, v) => setProfile((p) => ({ ...p, [k]: v }));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
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
                  ? "2px solid #2563EB"
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
                    background: "linear-gradient(135deg,#2563EB,#7C3AED)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                    fontWeight: 700,
                    color: "#fff",
                  }}
                >
                  ME
                </div>
                <button
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
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#2563EB",
                    background: "#EFF6FF",
                    border: "1px solid #BFDBFE",
                    borderRadius: 8,
                    padding: "7px 14px",
                    cursor: "pointer",
                  }}
                >
                  Upload photo
                </button>
                <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 5 }}>
                  JPG or PNG, max 2MB
                </p>
              </div>
            </div>
          </Section>

          <Section
            title="Personal Information"
            desc="This appears on your public-facing digital cards."
          >
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
                  onFocus={(e) => (e.target.style.borderColor = "#2563EB")}
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
                  onFocus={(e) => (e.target.style.borderColor = "#2563EB")}
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
                  onFocus={(e) => (e.target.style.borderColor = "#2563EB")}
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
                  onFocus={(e) => (e.target.style.borderColor = "#2563EB")}
                  onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
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
                onFocus={(e) => (e.target.style.borderColor = "#2563EB")}
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
                    background: "#F9FAFB",
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
                background: saved ? "#059669" : "#2563EB",
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
                  background: notifs[key] ? "#2563EB" : "#E5E7EB",
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
                    onFocus={(e) => (e.target.style.borderColor = "#2563EB")}
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
                background: "#2563EB",
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
              color: "#2563EB",
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
                    color: int.connected ? "#DC2626" : "#2563EB",
                    background: int.connected ? "#FEF2F2" : "#EFF6FF",
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
