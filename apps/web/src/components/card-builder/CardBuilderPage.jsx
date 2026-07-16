import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Building2,
  Calendar,
  Download,
  Facebook,
  Github,
  Globe,
  Image,
  Instagram,
  Linkedin,
  LockKeyhole,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  Send,
  User,
  Video,
  X,
  Youtube,
} from "lucide-react";
import { useParams } from "react-router";
import logo from "../../assets/jostap logo.png3.png";
import { EMPTY_CARD, createCard, getCard, updateCard } from "../../utils/cardsStore";
import { IMAGE_UPLOAD_TARGETS, prepareImageForUpload } from "../../utils/imageCompression";
import { displayCardUrl } from "../../utils/publicUrl";
import CardPhonePreview, {
  BrandMark,
} from "../card-preview/CardPhonePreview";

const COLORS = [
  "#FF5A4F",
  "#EF4444",
  "#FB923C",
  "#FACC15",
  "#BCA06A",
  "#43A047",
  "#16C7B7",
  "#38BDF8",
  "#3657E8",
  "#8B5CF6",
  "#D946EF",
  "#30343B",
  "#AAB4BE",
];

const FIELD_GROUPS = [
  {
    title: "Personal",
    fields: [
      ["name", "Name", User, "Your name"],
      ["title", "Job title", User, "Founder"],
      ["company", "Company name", Building2, "Company"],
      ["headline", "Headline", User, "Helping brands grow"],
    ],
  },
  {
    title: "General",
    fields: [
      ["email", "Email", Mail, "you@company.com"],
      ["phone", "Phone", Phone, "+234 000 000 0000"],
      ["website", "Company URL", Globe, "https://company.com"],
      ["portfolio", "Portfolio", Globe, "https://portfolio.com"],
      ["address", "Address", MapPin, "City, Country"],
    ],
  },
  {
    title: "Social",
    fields: [
      ["twitter", "X", User, "@handle"],
      ["instagram", "Instagram", Instagram, "@handle"],
      ["threads", "Threads", User, "@handle"],
      ["linkedin", "LinkedIn", Linkedin, "username"],
      ["facebook", "Facebook", Facebook, "username"],
      ["youtube", "YouTube", Youtube, "@name"],
      ["snapchat", "Snapchat", User, "username"],
      ["tiktok", "TikTok", User, "@handle"],
      ["twitch", "Twitch", User, "username"],
      ["yelp", "Yelp", User, "https://yelp.com/biz/name"],
    ],
  },
  {
    title: "Messaging",
    fields: [
      ["whatsapp", "WhatsApp", MessageCircle, "https://wa.me/2340000000000"],
      ["signal", "Signal", MessageCircle, "https://signal.me/#eu/..."],
      ["discord", "Discord", MessageCircle, "https://discord.com/users/id"],
      ["skype", "Skype", MessageCircle, "skype:live:username?chat"],
      ["telegram", "Telegram", Send, "@handle"],
    ],
  },
  {
    title: "Streaming",
    fields: [
      ["spotify", "Spotify", Globe, "https://open.spotify.com/artist/..."],
      ["appleMusic", "Apple Music", Globe, "https://music.apple.com/..."],
      ["boomplay", "Boomplay", Globe, "https://www.boomplay.com/..."],
      ["audiomack", "Audiomack", Globe, "https://audiomack.com/name"],
      ["youtubeMusic", "YouTube Music", Youtube, "https://music.youtube.com/channel/..."],
    ],
  },
  {
    title: "Business",
    fields: [
      ["github", "GitHub", Github, "github.com/name"],
      ["behance", "Behance", Globe, "behance.net/name"],
      ["dribbble", "Dribbble", Globe, "dribbble.com/name"],
      ["saveContact", "Save contact", Download, "Let visitors save your details"],
      ["exchangeContact", "Exchange contact", Send, "Let visitors share their details with you"],
      ["calendly", "Appointment Booking", Calendar, "Enable booking form on public profile"],
      ["videoUrl", "Video", Video, "https://youtube.com/watch?v=..."],
    ],
  },
];

const DEFAULT_ACTIVE = new Set(["name", "title", "company", "email", "phone", "website", "instagram", "saveContact", "exchangeContact"]);
const DOWNLOADABLE_QR_PLANS = new Set(["trial", "jostap_nfc", "custom_nfc", "basic_renewal", "premium_renewal"]);
const PREMIUM_FEATURE_PLANS = new Set(["trial", "jostap_nfc", "custom_nfc", "basic_renewal", "premium_renewal"]);
const CUSTOM_BRANDING_PLANS = new Set(["trial", "jostap_nfc", "custom_nfc", "basic_renewal", "premium_renewal"]);
const PREMIUM_ONLY_FIELDS = new Set(["calendly", "videoUrl"]);
const MULTI_ENTRY_FIELDS = new Set([
  "twitter",
  "instagram",
  "threads",
  "linkedin",
  "facebook",
  "youtube",
  "snapchat",
  "tiktok",
  "twitch",
  "yelp",
  "whatsapp",
  "signal",
  "discord",
  "skype",
  "telegram",
]);

function hasDownloadableQr(plan) {
  return DOWNLOADABLE_QR_PLANS.has(String(plan || "").toLowerCase());
}
function hasPremiumFeatures(plan) {
  return PREMIUM_FEATURE_PLANS.has(String(plan || "").toLowerCase());
}

function hasCustomBranding(plan) {
  return CUSTOM_BRANDING_PLANS.has(String(plan || "").toLowerCase());
}

function slugFromName(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function suggestedCardSlug(name, suffix) {
  const base = slugFromName(name) || "card";
  return `${base}-${suffix}`.slice(0, 80);
}

function valuesForFieldInput(value) {
  if (Array.isArray(value)) {
    return value.length ? value : [""];
  }
  if (value === undefined || value === null || value === "") return [""];
  return [String(value)];
}

function hasMeaningfulValue(value) {
  if (Array.isArray(value)) return value.some((item) => String(item || "").trim());
  return Boolean(String(value || "").trim());
}

function activeFieldSetForLoadedCard(card) {
  const fields = Array.isArray(card?.activeFields) && card.activeFields.length
    ? new Set(card.activeFields)
    : new Set(DEFAULT_ACTIVE);

  if (card?.exchangeContactEnabled === false) {
    fields.delete("exchangeContact");
  } else {
    fields.add("exchangeContact");
  }
  if (card?.saveContactEnabled === false) {
    fields.delete("saveContact");
  } else {
    fields.add("saveContact");
  }

  return fields;
}

function UploadTile({ label, icon: Icon, onUpload, preview, onRemove }) {
  const inputRef = useRef(null);
  return (
    <div className="card-builder-upload-wrap">
      <button className="card-builder-upload" type="button" onClick={() => inputRef.current?.click()}>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(event) => event.target.files?.[0] && onUpload(event.target.files[0])}
          style={{ display: "none" }}
        />
        {preview ? <img src={preview} alt="" loading="lazy" decoding="async" /> : <Icon size={17} />}
        <span>{label}</span>
      </button>
      {preview && (
        <button className="card-builder-upload-remove" type="button" onClick={onRemove}>
          <X size={14} /> Remove
        </button>
      )}
    </div>
  );
}
function AppointmentFormPreview() {
  return (
    <section className="card-builder-booking-preview" aria-labelledby="card-builder-booking-preview-title">
      <div className="card-builder-booking-preview__header">
        <h2 id="card-builder-booking-preview-title">Book Appointment</h2>
      </div>
      <form className="card-builder-booking-preview__form" onSubmit={(event) => event.preventDefault()}>
        <input readOnly tabIndex={-1} placeholder="Your name" />
        <input readOnly tabIndex={-1} type="email" placeholder="Your email" />
        <input readOnly tabIndex={-1} type="tel" placeholder="Your phone number" />
        <label>
          <span>Preferred date</span>
          <input readOnly tabIndex={-1} type="date" />
        </label>
        <label>
          <span>Preferred time</span>
          <input readOnly tabIndex={-1} type="time" />
        </label>
        <textarea readOnly tabIndex={-1} placeholder="Optional note" rows={3} />
        <button type="button" className="card-builder-booking-preview__submit">
          <Calendar size={14} />
          Request Appointment
        </button>
      </form>
    </section>
  );
}

function userLabel(user) {
  return `${user.name || user.email}${user.email && user.name !== user.email ? ` (${user.email})` : ""}`;
}

export default function CardBuilderPage({ mode = "user" }) {
  const { id } = useParams();
  const editing = Boolean(id);
  const isAdminMode = mode === "admin";
  const adminCardPath = editing ? `/admin/cards/${id}/edit` : "/admin/cards/new";
  const newCardSlugSuffix = useRef(Date.now().toString(36).slice(-4));
  const [card, setCard] = useState({ ...EMPTY_CARD, brandColor: COLORS[8], coverUrl: "" });
  const [activeFields, setActiveFields] = useState(DEFAULT_ACTIVE);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [imageMessage, setImageMessage] = useState("");
  const [qrLocked, setQrLocked] = useState(true);
  const [currentPlan, setCurrentPlan] = useState(isAdminMode ? "custom_nfc" : "free");
  const [planLoaded, setPlanLoaded] = useState(isAdminMode);
  const [users, setUsers] = useState([]);
  const [assignedUserId, setAssignedUserId] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const canUsePremiumFields = isAdminMode || (planLoaded && hasPremiumFeatures(currentPlan));
  const canCustomizeBrand = isAdminMode || (planLoaded && hasCustomBranding(currentPlan));
  const previewFields = useMemo(() => {
    const next = new Set(activeFields);
    if (!canUsePremiumFields) {
      for (const key of PREMIUM_ONLY_FIELDS) next.delete(key);
    }
    return next;
  }, [activeFields, canUsePremiumFields]);
  const showAppointmentPreview = canUsePremiumFields && previewFields.has("calendly");

  const update = (key, value) => {
    if (key === "brandColor" && !canCustomizeBrand) {
      setMessage("Custom colors are available on premium plans.");
      return;
    }

    if (key === "slug") {
      setSlugManuallyEdited(true);
      setCard((current) => ({ ...current, slug: slugFromName(value) }));
      return;
    }

    setCard((current) => {
      const next = { ...current, [key]: value };

      if (key === "name") {
        if (editing) {
          next.slug = current.slug || slugFromName(value);
        } else if (!slugManuallyEdited) {
          next.slug = suggestedCardSlug(value, newCardSlugSuffix.current);
        }
      }

      return next;
    });
  };

  useEffect(() => {
    let active = true;
    async function loadBillingPlan() {
      try {
        const response = await fetch("/api/billing", { credentials: "same-origin" });
        const data = await response.json().catch(() => ({}));
        if (!active) return;
        if (!response.ok) {
          setCurrentPlan("free");
          setQrLocked(true);
          setPlanLoaded(true);
          return;
        }
        const plan = data.subscription?.plan || "free";
        const features = data.subscription?.features || {};
        setCurrentPlan(plan);
        setQrLocked(features.hasDownloadableQr === undefined ? !hasDownloadableQr(plan) : !features.hasDownloadableQr);
        setPlanLoaded(true);
      } catch {
        if (active) {
          setCurrentPlan("free");
          setQrLocked(true);
          setPlanLoaded(true);
        }
      }
    }

    async function loadInitialCard() {
      try {
        if (isAdminMode) {
          setCurrentPlan("custom_nfc");
          setQrLocked(false);
          setPlanLoaded(true);
          const [overviewResponse, cardResponse] = await Promise.all([
            fetch("/api/admin/overview", { credentials: "same-origin" }),
            editing ? fetch(`/api/admin/cards/${id}`, { credentials: "same-origin" }) : Promise.resolve(null),
          ]);
          const overviewData = await overviewResponse.json().catch(() => ({}));
          if (overviewResponse.status === 401 || overviewResponse.status === 403) {
            window.location.href = `/auth/signin?callbackUrl=${encodeURIComponent(adminCardPath)}`;
            return;
          }

          if (!overviewResponse.ok) {
            setMessage(overviewData.error || "Unable to load admin card tools.");
            return;
          }

          if (active) setUsers(overviewData.users || []);

          if (editing) {
            const cardData = await cardResponse.json().catch(() => ({}));
            if (cardResponse.status === 401 || cardResponse.status === 403) {
              window.location.href = `/auth/signin?callbackUrl=${encodeURIComponent(adminCardPath)}`;
              return;
            }
            if (!cardResponse.ok || !cardData.card) {
              setMessage(cardData.error || "This card could not be found.");
              return;
            }

            const found = cardData.card;
            setCard({ ...EMPTY_CARD, brandColor: COLORS[8], coverUrl: "", ...found, title: found.title || found.role || "" });
            setAssignedUserId(found.userId || "");
            setSlugManuallyEdited(true);
            if (Array.isArray(found.activeFields) && found.activeFields.length) {
              setActiveFields(activeFieldSetForLoadedCard(found));
            } else {
              const activeKeys = new Set(DEFAULT_ACTIVE);
              Object.keys(found).forEach((key) => {
                if (hasMeaningfulValue(found[key])) activeKeys.add(key);
              });
              if (found.exchangeContactEnabled === false) activeKeys.delete("exchangeContact");
              else activeKeys.add("exchangeContact");
              if (found.saveContactEnabled === false) activeKeys.delete("saveContact");
              else activeKeys.add("saveContact");
              setActiveFields(activeKeys);
            }
          }
          return;
        }

        await loadBillingPlan();
        if (editing) {
          const found = await getCard(id);
          if (!active) return;
          if (!found) {
            setMessage("This card could not be found.");
            return;
          }
          setCard({ ...EMPTY_CARD, brandColor: COLORS[8], coverUrl: "", ...found, title: found.title || found.role || "" });
          setSlugManuallyEdited(true);
          if (Array.isArray(found.activeFields) && found.activeFields.length) {
            setActiveFields(activeFieldSetForLoadedCard(found));
          } else {
            const activeKeys = new Set(DEFAULT_ACTIVE);
            Object.keys(found).forEach((key) => {
              if (hasMeaningfulValue(found[key])) activeKeys.add(key);
            });
            if (found.exchangeContactEnabled === false) activeKeys.delete("exchangeContact");
            else activeKeys.add("exchangeContact");
            if (found.saveContactEnabled === false) activeKeys.delete("saveContact");
            else activeKeys.add("saveContact");
            setActiveFields(activeKeys);
          }
          return;
        }

        const response = await fetch("/api/auth/me", { credentials: "same-origin" });
        const data = await response.json().catch(() => ({}));
        if (response.status === 401) {
          window.location.href = `/auth/signin?callbackUrl=${encodeURIComponent("/create-card")}`;
          return;
        }
        if (!active || !response.ok || !data.user) return;
        const user = data.user;
        const kyc = user.kyc || {};
        setCard((current) => ({
          ...current,
          name: current.name || user.name || "",
          title: current.title || kyc.jobTitle || "",
          company: current.company || kyc.businessName || user.company || "",
          phone: current.phone || kyc.phone || "",
          email: current.email || user.email || "",
          website: current.website || kyc.website || "",
          avatarUrl: current.avatarUrl || "",
          slug: current.slug || suggestedCardSlug(user.name || user.email?.split("@")[0] || "card", newCardSlugSuffix.current),
        }));
      } catch (error) {
        if (editing && error.status === 401) {
          window.location.href = `/auth/signin?callbackUrl=${encodeURIComponent(`/dashboard/cards/${id}/edit`)}`;
          return;
        }
        setMessage(editing ? "Unable to load this card." : "Unable to load account defaults.");
      }
    }
    loadInitialCard();
    return () => {
      active = false;
    };
  }, [editing, id, isAdminMode]);

  const uploadCardImage = async (key, file, label, target) => {
    setImageMessage("");

    try {
      const prepared = await prepareImageForUpload(file, target);
      update(key, prepared.previewUrl);
      const form = new FormData();
      form.append("file", prepared.file);
      const response = await fetch("/api/cards/media", {
        method: "POST",
        credentials: "same-origin",
        body: form,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `Unable to upload ${label.toLowerCase()}.`);
      update(key, data.url);
    } catch (error) {
      setImageMessage(error.message || `Unable to upload ${label.toLowerCase()}.`);
    }
  };

  const uploadProfile = (file) => uploadCardImage("avatarUrl", file, "profile picture", IMAGE_UPLOAD_TARGETS.cardProfile);

  const uploadCover = async (file) => {
    await uploadCardImage("coverUrl", file, "cover photo", IMAGE_UPLOAD_TARGETS.cover);
  };

  const toggleField = (key) => {
    if (PREMIUM_ONLY_FIELDS.has(key) && !canUsePremiumFields) {
      setMessage("Premium features like appointment booking and video unlock with a JOSTAP Card plan.");
      return;
    }

    setActiveFields((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const updateMultiFieldEntry = (key, index, value) => {
    setCard((current) => {
      const nextEntries = valuesForFieldInput(current[key]).slice();
      nextEntries[index] = value;
      return { ...current, [key]: nextEntries };
    });
  };

  const addMultiFieldEntry = (key) => {
    setCard((current) => ({
      ...current,
      [key]: [...valuesForFieldInput(current[key]), ""],
    }));
  };

  const removeMultiFieldEntry = (key, index) => {
    setCard((current) => {
      const currentEntries = valuesForFieldInput(current[key]);
      const nextEntries = currentEntries.filter((_, entryIndex) => entryIndex !== index);
      return { ...current, [key]: nextEntries.length ? nextEntries : [""] };
    });
  };

  const handleSave = async () => {
    setMessage("");
    if (!card.name.trim() || (!isAdminMode && !card.email.trim())) {
      setMessage(isAdminMode ? "Add at least the card name before continuing." : "Add at least your name and email before continuing.");
      return;
    }
    if (/^(data:image\/|blob:)/i.test(card.avatarUrl || "") || /^(data:image\/|blob:)/i.test(card.coverUrl || "")) {
      setMessage("Please wait for image uploads to finish before saving.");
      return;
    }
    const slug = card.slug || slugFromName(card.name);
    if (!slug) {
      setMessage("Add a public card slug before continuing.");
      return;
    }
    setSaving(true);
    try {
      const limitedCard = {
        ...card,
        brandColor: canCustomizeBrand ? card.brandColor : "",
        calendly: canUsePremiumFields ? card.calendly : "",
        videoUrl: canUsePremiumFields ? card.videoUrl : "",
      };
      const payload = {
        ...limitedCard,
        activeFields: Array.from(activeFields),
        slug,
        template: "Navy Pro",
        showServices: canUsePremiumFields,
        showTestimonials: canUsePremiumFields,
        showGallery: false,
        showFaq: false,
        active: editing ? Boolean(card.active) : true,
      };
      if (isAdminMode) {
        const response = await fetch(editing ? `/api/admin/cards/${id}` : "/api/admin/cards", {
          method: editing ? "PATCH" : "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, userId: assignedUserId || null }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || (editing ? "Unable to update this card." : "Unable to create this card."));
        window.location.href = "/admin/cards";
        return;
      }

      if (editing) await updateCard(id, payload);
      else await createCard(payload);
      window.location.href = "/dashboard/cards";
    } catch (error) {
      setMessage(error.message || (editing ? "Unable to update this card." : "Unable to save this card."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card-builder-page">
      <aside className="card-builder-left">
        <a href="/dashboard" className="card-builder-brand">
          <img src={logo} alt="JOSTAP" decoding="async" />
        </a>
        <div className="card-builder-live-preview">
          <CardPhonePreview
            card={{ ...card, brandColor: canCustomizeBrand ? card.brandColor : "" }}
            activeFields={previewFields}
            qrLocked={qrLocked}
          />
          {showAppointmentPreview && <AppointmentFormPreview />}
        </div>
      </aside>

      <main className="card-builder-main">
        <div className="card-builder-panel">
          <header className="card-builder-header">
            <div>
              <p>Card Builder</p>
              <h1>{isAdminMode ? (editing ? "Edit admin card" : "Create card for a user") : editing ? "Edit your card" : "Create your first card"}</h1>
              <span>{isAdminMode ? "Build the full profile, then optionally assign it to a user account." : editing ? "Update the details, media, and links on this card." : "Ready to design your card? Pick a field below to get started."}</span>
            </div>
            <a href={isAdminMode ? "/admin/cards" : "/dashboard/cards"}>{isAdminMode ? "Admin Cards" : "My Cards"}</a>
          </header>

          <section className="card-builder-section">
            <div className="card-builder-section-title">
              <h2>Add images</h2>
            </div>
            <div className="card-builder-upload-grid">
              <UploadTile label="Profile Picture" icon={User} preview={card.avatarUrl} onUpload={uploadProfile} onRemove={() => update("avatarUrl", "")} />
              <UploadTile label="Cover Photo" icon={Image} preview={card.coverUrl} onUpload={uploadCover} onRemove={() => update("coverUrl", "")} />
            </div>
            {imageMessage && <p className="card-builder-note">{imageMessage}</p>}
          </section>

          <section className="card-builder-section">
            <h2>Brand color</h2>
            {canCustomizeBrand ? (
              <div className="card-builder-colors">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    aria-label={`Use ${color}`}
                    className={card.brandColor === color ? "is-active" : ""}
                    onClick={() => update("brandColor", color)}
                    style={{ background: color }}
                    type="button"
                  />
                ))}
              </div>
            ) : (
              <div className="card-builder-locked-row">
                <LockKeyhole size={16} />
                <span>Custom colors unlock with a premium plan.</span>
                <a href="/pricing">Upgrade</a>
              </div>
            )}
          </section>

          <section className="card-builder-section">
            <h2>Add details</h2>
            {FIELD_GROUPS.map((group) => (
              <div className="card-builder-group" key={group.title}>
                <h3>{group.title}</h3>
                <div className="card-builder-field-grid">
                  {group.fields.map(([key, label, Icon, placeholder]) => {
                    const active = activeFields.has(key);
                    const locked = PREMIUM_ONLY_FIELDS.has(key) && !canUsePremiumFields;
                    const isMultiField = MULTI_ENTRY_FIELDS.has(key);
                    const isToggleField = key === "calendly" || key === "saveContact" || key === "exchangeContact";
                    return (
                      <div className={`card-builder-field ${active ? "is-active" : ""} ${locked ? "is-locked" : ""} ${isToggleField ? "is-toggle-field" : ""}`} key={key}>
                        <button type="button" onClick={() => toggleField(key)} aria-pressed={!locked && isToggleField ? active : undefined}>
                          {locked ? <span className="card-builder-brand-mark"><LockKeyhole size={15} /></span> : <BrandMark field={key} icon={Icon} />}
                          <span>{label}</span>
                          {locked ? (
                            <a href="/pricing" onClick={(event) => event.stopPropagation()}>Upgrade</a>
                          ) : isToggleField ? (
                            <span className="card-builder-toggle" aria-hidden="true">
                              <span />
                            </span>
                          ) : (
                            <Plus size={15} />
                          )}
                        </button>
                        {active && !locked && (
                          isMultiField ? (
                            <div className="card-builder-multi-inputs">
                              {valuesForFieldInput(card[key]).map((entryValue, index) => (
                                <div className="card-builder-multi-row" key={`${key}-${index}`}>
                                  <input
                                    value={entryValue}
                                    onChange={(event) => updateMultiFieldEntry(key, index, event.target.value)}
                                    placeholder={placeholder}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeMultiFieldEntry(key, index)}
                                    className="card-builder-multi-remove"
                                    aria-label={`Remove ${label}`}
                                  >
                                    <X size={13} />
                                  </button>
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => addMultiFieldEntry(key)}
                                className="card-builder-multi-add"
                              >
                                <Plus size={12} /> Add {label}
                              </button>
                            </div>
                          ) : key === "calendly" ? (
                            <p className="card-builder-appointment-note">
                              Visitors will book from the public profile form. Requests are saved in your dashboard.
                            </p>
                          ) : key === "exchangeContact" ? (
                            <p className="card-builder-appointment-note">
                              Visitors can share their own details from your public profile. Shared contacts appear in Leads.
                            </p>
                          ) : key === "saveContact" ? (
                            <p className="card-builder-appointment-note">
                              Visitors can download your details as a contact file.
                            </p>
                          ) : (
                            <input
                              value={card[key] || ""}
                              onChange={(event) => update(key, event.target.value)}
                              placeholder={placeholder}
                            />
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>

          <section className="card-builder-section">
            <h2>Public profile</h2>
            <div className="card-builder-slug">
              <span>{displayCardUrl("")}/</span>
              <input value={card.slug || ""} onChange={(event) => update("slug", event.target.value)} placeholder="card-name" />
            </div>
          </section>

          {isAdminMode && (
            <section className="card-builder-section">
              <h2>Card assignment</h2>
              <div className="card-builder-admin-assignment">
                <label>
                  <span>Assign to user account</span>
                  <select value={assignedUserId} onChange={(event) => setAssignedUserId(event.target.value)}>
                    <option value="">Unassigned card</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {userLabel(user)}
                      </option>
                    ))}
                  </select>
                </label>
                <p>Leave this unassigned when the customer does not have an account yet. You can assign or reassign it later from Admin Cards.</p>
              </div>
            </section>
          )}

          {message && <div className="card-builder-alert">{message}</div>}

          <footer className="card-builder-footer">
            <p>By continuing you agree to our Privacy Policy and Terms of Service</p>
            <button type="button" onClick={handleSave} disabled={saving}>
              {saving ? (isAdminMode ? "Creating..." : editing ? "Updating..." : "Publishing...") : isAdminMode ? "Create card" : editing ? "Update card" : "Publish card"} <ArrowRight size={16} />
            </button>
          </footer>
        </div>
      </main>

      <style jsx global>{`
        body { background: #f8fafc; }
        .card-builder-page {
          min-height: 100vh;
          display: grid;
          grid-template-columns: minmax(430px, 42vw) minmax(0, 1fr);
          background: #f8fafc;
          color: #111827;
          font-family: Archivo, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        .card-builder-left {
          min-height: 100vh;
          padding: 28px clamp(24px, 5vw, 54px);
          position: relative;
          top: 0;
          display: flex;
          flex-direction: column;
          gap: 28px;
        }
        .card-builder-brand img { width: 118px; height: 46px; object-fit: contain; }
        .card-builder-live-preview {
          display: grid;
          justify-items: center;
          align-content: start;
          gap: 18px;
        }
        .card-builder-live-preview .card-preview-wrap {
          flex: none;
          width: 100%;
        }
        .card-builder-preview-wrap { flex: 1; display: flex; align-items: flex-start; justify-content: center; padding-top: 8px; }
        .card-builder-phone {
          width: min(390px, 86vw);
          border: 1px solid var(--card-brand-ring);
          border-radius: 28px;
          background: #ffffff;
          box-shadow: 0 40px 100px -20px var(--card-brand-ring), 0 0 0 1px rgba(15, 23, 42, 0.05);
          overflow: hidden;
          transition: box-shadow 0.3s ease;
        }
        .card-builder-phone__notch {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 120px;
          height: 22px;
          background: #0f172a;
          border-bottom-left-radius: 14px;
          border-bottom-right-radius: 14px;
          z-index: 10;
        }
        .card-builder-phone__screen {
          border-radius: 28px;
          background: #fff;
          overflow: visible;
          position: relative;
        }
        .card-builder-cover {
          height: 160px;
          width: 100%;
          border-radius: 0;
          color: #fff;
          position: relative;
          overflow: hidden;
        }
        .card-builder-cover::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(15,23,42,0.05), rgba(15,23,42,0.28));
          pointer-events: none;
        }
        .card-builder-profile-row { display: flex; justify-content: flex-start; align-items: flex-start; margin: -42px 0 0 22px; position: relative; z-index: 2; }
        .card-builder-avatar {
          width: 86px;
          height: 86px;
          border-radius: 999px;
          border: 5px solid #fff;
          background: var(--card-brand);
          color: #ffffff;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          box-shadow: 0 14px 32px rgba(15,23,42,0.16), 0 0 0 1px var(--card-brand-ring);
        }
        .card-builder-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .card-builder-preview-copy { padding: 12px 22px 16px; }
        .card-builder-preview-copy h2 { font-size: 27px; line-height: 1.08; margin: 0 0 8px; font-weight: 900; letter-spacing: 0; color: #0f172a; }
        .card-builder-preview-copy p { font-size: 14px; color: #475569; margin: 4px 0; overflow-wrap: anywhere; }
        .card-builder-company { display: inline-flex; align-items: center; gap: 6px; color: #0f172a !important; font-size: 13px !important; font-weight: 800; }
        .card-builder-preview-headline { color: var(--card-brand) !important; line-height: 1.35; margin-top: 10px !important; font-size: 13px !important; font-weight: 800; }
        .card-builder-quick-actions {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 9px;
          padding: 2px 22px 16px;
        }
        .card-builder-quick-actions a {
          color: #0f172a;
          display: grid;
          justify-items: center;
          gap: 7px;
          text-decoration: none;
          padding: 12px 8px;
          border: 1px solid var(--card-brand-ring);
          border-radius: 14px;
          background: #fff;
          min-width: 0;
          transition: transform 0.2s ease, border-color 0.2s ease;
        }
        .card-builder-quick-actions a:hover {
          transform: translateY(-2px);
          border-color: var(--card-brand);
        }
        .card-builder-quick-actions span { width: 34px; height: 34px; border-radius: 999px; background: var(--card-brand-soft); color: var(--card-brand); display: inline-flex; align-items: center; justify-content: center; }
        .card-builder-quick-actions strong { font-size: 13px; line-height: 1; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
        .card-builder-vcard {
          width: calc(100% - 44px);
          margin: 0 22px 22px;
          min-height: 48px;
          border-radius: 14px;
          border: none;
          background: var(--card-brand);
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 18px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 10px 20px -5px var(--card-brand-ring);
          transition: transform 0.2s ease, opacity 0.2s ease, box-shadow 0.2s ease;
        }
        .card-builder-vcard:hover {
          transform: translateY(-1px);
          box-shadow: 0 15px 30px -5px var(--card-brand-ring);
        }
        .card-builder-info-list {
          margin: 0 22px 22px;
          display: grid;
          gap: 10px;
        }
        .card-builder-info-list a,
        .card-builder-info-list div {
          display: grid;
          grid-template-columns: 38px minmax(0, 1fr);
          align-items: center;
          gap: 10px;
          min-width: 0;
          padding: 12px;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          background: #fff;
          color: #0f172a;
          text-decoration: none;
          transition: background 0.2s ease;
        }
        .card-builder-info-list a:hover {
          background: #f8fafc;
        }
        .card-builder-info-list span {
          width: 34px;
          height: 34px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: var(--card-brand-soft);
          color: var(--card-brand);
        }
        .card-builder-info-list p { margin: 0; min-width: 0; }
        .card-builder-info-list strong { display: block; font-size: 12px; color: #64748b; margin-bottom: 2px; }
        .card-builder-info-list small { display: block; font-size: 13px; color: #0f172a; overflow-wrap: anywhere; }
        .card-builder-social-card {
          margin: 0 22px 22px;
          padding: 16px;
          border: 1px solid #eef2f7;
          border-radius: 18px;
          background: #f8fafc;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px 10px;
        }
        .card-builder-social-card a { display: grid; gap: 7px; justify-items: center; color: #0f172a; text-decoration: none; min-width: 0; transition: transform 0.2s ease; }
        .card-builder-social-card a:hover { transform: scale(1.05); }
        .card-builder-social-icon { 
          width: 54px; height: 54px; border-radius: 17px; display: flex; align-items: center; justify-content: center; 
          box-shadow: 0 10px 18px rgba(15,23,42,0.08);
        }
        .card-builder-social-card small { font-size: 12px; font-weight: 800; color: #0f172a; text-align: center; overflow-wrap: anywhere; }
        .card-builder-video-card {
          margin: 0 22px 22px;
          min-height: 150px;
          border-radius: 18px;
          background: #f8fafc;
          border: 1px solid #eef2f7;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          color: var(--card-brand);
          aspect-ratio: 16 / 9;
        }
        .card-builder-video-card strong { font-size: 24px; letter-spacing: 0; }
        .card-builder-video-card iframe, .card-builder-video-card video { width: 100%; height: 100%; border: 0; object-fit: cover; display: block; }
        .card-builder-booking-preview {
          width: min(100%, 390px);
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          background: #ffffff;
          padding: 16px;
          box-shadow: 0 18px 50px rgba(15, 23, 42, 0.08);
        }
        .card-builder-booking-preview__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 12px;
        }
        .card-builder-booking-preview__header h2 {
          margin: 0;
          color: #111827;
          font-size: 16px;
          font-weight: 850;
          letter-spacing: 0;
        }
        .card-builder-booking-preview__form {
          display: grid;
          gap: 10px;
        }
        .card-builder-booking-preview__form input,
        .card-builder-booking-preview__form textarea {
          width: 100%;
          border: 1px solid #dbe1ea;
          border-radius: 10px;
          background: #ffffff;
          color: #111827;
          box-sizing: border-box;
          font-size: 14px;
          line-height: 1.45;
          padding: 10px 12px;
          outline: none;
        }
        .card-builder-booking-preview__form input {
          min-height: 44px;
        }
        .card-builder-booking-preview__form textarea {
          resize: none;
        }
        .card-builder-booking-preview__form input::placeholder,
        .card-builder-booking-preview__form textarea::placeholder {
          color: #6b7280;
          opacity: 1;
        }
        .card-builder-booking-preview__form label {
          display: grid;
          gap: 6px;
        }
        .card-builder-booking-preview__form label span {
          color: #4b5563;
          font-size: 12px;
          font-weight: 800;
        }
        .card-builder-booking-preview__submit {
          width: 100%;
          min-height: 40px;
          border: none;
          border-radius: 8px;
          background: #0d6ffd;
          color: #ffffff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 850;
        }
        .card-builder-appointment-note {
          margin: 0;
          border: 1px solid #bfdbfe;
          border-top: 1px solid #bfdbfe;
          border-radius: 0 0 10px 10px;
          background: #eaf3ff;
          color: #1e3a8a;
          padding: 10px 12px;
          font-size: 12px;
          line-height: 1.5;
          font-weight: 700;
        }
        .card-builder-qr { display: grid; justify-items: center; gap: 8px; margin: 0 22px 28px; padding: 18px; border: 1px solid var(--card-brand-ring); border-radius: 18px; background: #fff; color: #0f172a; font-size: 13px; font-weight: 500; }
        .card-builder-qr-code { display: flex; align-items: center; justify-content: center; transition: filter .2s ease, opacity .2s ease; }
        .card-builder-qr.is-locked .card-builder-qr-code { filter: blur(5px); opacity: .48; pointer-events: none; user-select: none; }
        .card-builder-qr svg { max-width: 64%; height: auto; }
        .card-builder-qr span { overflow-wrap: anywhere; text-align: center; }
        .card-builder-qr em { margin-top: 2px; font-style: normal; color: #0d6ffd; background: #eaf3ff; border: 1px solid #bfdbfe; border-radius: 999px; padding: 4px 10px; font-size: 11px; font-weight: 800; text-align: center; }
        .card-builder-preview-list { padding: 0 22px 18px; display: flex; flex-direction: column; gap: 8px; }
        .card-builder-preview-list > a { display: flex; align-items: center; gap: 11px; min-width: 0; border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px 12px; text-decoration: none; color: #111827; }
        .card-builder-brand-mark { width: 30px; height: 30px; border-radius: 999px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 12px; font-weight: 950; font-family: Archivo, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
        .card-builder-preview-list p { margin: 0; font-size: 13px; font-weight: 700; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .card-builder-preview-list a { color: inherit; text-decoration: none; }
        .card-builder-preview-list small { display: block; color: #9a918b; font-size: 11px; font-weight: 500; }
        .card-builder-powered { margin: 2px 22px 0; border-top: 1px solid #f3f4f6; padding: 24px 0 38px; text-align: center; color: #9ca3af; font-size: 12px; }
        .card-builder-powered strong { color: #0d6ffd; margin-left: 4px; }
        .card-builder-main { padding: 0 0 0 0; }
        .card-builder-panel {
          min-height: 100vh;
          background: #ffffff;
          border-left: 1px solid #e5e7eb;
          border-radius: 32px 0 0 32px;
          padding: clamp(32px, 5vw, 72px);
        }
        .card-builder-header { display: flex; justify-content: space-between; gap: 18px; align-items: flex-start; margin-bottom: 42px; }
        .card-builder-header p { margin: 0 0 8px; font-size: 12px; color: #0d6ffd; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; }
        .card-builder-header h1 { margin: 0 0 8px; font-size: 30px; letter-spacing: -0.03em; }
        .card-builder-header span { color: #6b7280; font-size: 15px; }
        .card-builder-header a { color: #0d6ffd; border: 1px solid #bfdbfe; background: #eaf3ff; border-radius: 10px; text-decoration: none; padding: 10px 14px; font-size: 13px; font-weight: 800; }
        .card-builder-section { margin-bottom: 34px; }
        .card-builder-section h2 { margin: 0 0 18px; font-size: 23px; }
        .card-builder-section-title { display: flex; align-items: center; gap: 18px; }
        .card-builder-section-title button { border: 1px solid #e5e7eb; border-radius: 10px; background: #fff; color: #6b7280; padding: 10px 18px; font-weight: 800; }
        .card-builder-upload-grid { display: grid; grid-template-columns: repeat(2, minmax(150px, 1fr)); gap: 12px; max-width: 420px; }
        .card-builder-upload-wrap { display: grid; gap: 8px; }
        .card-builder-upload { min-height: 82px; border: 1px solid #e5e7eb; background: #f5f5f5; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; cursor: pointer; color: #374151; font-weight: 800; font-size: 13px; overflow: hidden; }
        .card-builder-upload:hover { border-color: #0d6ffd; background: #eaf3ff; }
        .card-builder-upload img { width: 100%; height: 82px; object-fit: cover; }
        .card-builder-upload-remove { border: 1px solid #fecaca; background: #fff; color: #b91c1c; border-radius: 8px; padding: 8px 10px; font-size: 12px; font-weight: 800; display: inline-flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer; }
        .card-builder-upload-remove:hover { background: #fef2f2; }
        .card-builder-note { color: #8a5a12; font-size: 12px; font-weight: 700; }
        .card-builder-colors { display: flex; flex-wrap: wrap; gap: 10px; }
        .card-builder-colors button { width: 28px; height: 28px; border-radius: 8px; border: 1px solid rgba(0,0,0,.08); cursor: pointer; transition: transform 0.2s ease; }
        .card-builder-colors button:hover { transform: scale(1.15); }
        .card-builder-colors button.is-active { outline: 2px solid #0d6ffd; outline-offset: 2px; transform: scale(1.1); }
        .card-builder-locked-row { max-width: 560px; display: flex; align-items: center; gap: 10px; border: 1px solid #bfdbfe; background: #eaf3ff; color: #0b5ed7; border-radius: 10px; padding: 12px 14px; font-size: 13px; font-weight: 800; }
        .card-builder-locked-row span { flex: 1; }
        .card-builder-locked-row a { color: #ffffff; background: #0d6ffd; border-radius: 8px; text-decoration: none; padding: 7px 10px; font-size: 12px; }
        .card-builder-group { margin-top: 22px; }
        .card-builder-group h3 { margin: 0 0 12px; font-size: 16px; }
        .card-builder-field-grid { display: grid; grid-template-columns: repeat(3, minmax(170px, 1fr)); gap: 12px; }
        .card-builder-field { border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; overflow: hidden; transition: all 0.2s ease; }
        .card-builder-field:hover:not(.is-locked) { border-color: #8fc1ff; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04); }
        .card-builder-field button { width: 100%; border: none; background: transparent; display: grid; grid-template-columns: 30px 1fr 28px; align-items: center; gap: 8px; text-align: left; padding: 11px 12px; cursor: pointer; color: #201c19; font-weight: 700; transition: background 0.2s ease; }
        .card-builder-field button > svg:last-child { justify-self: end; border: 1px solid #e5e7eb; border-radius: 6px; padding: 4px; width: 24px; height: 24px; }
        .card-builder-field.is-toggle-field button { grid-template-columns: 30px minmax(0, 1fr) 46px; }
        .card-builder-toggle {
          justify-self: end;
          width: 42px;
          height: 24px;
          border-radius: 999px;
          border: 1px solid #d1d5db;
          background: #f3f4f6;
          padding: 2px;
          display: inline-flex;
          align-items: center;
          transition: background 0.2s ease, border-color 0.2s ease;
        }
        .card-builder-toggle span {
          width: 18px;
          height: 18px;
          border-radius: 999px;
          background: #ffffff;
          box-shadow: 0 1px 4px rgba(15, 23, 42, 0.22);
          transition: transform 0.2s ease;
        }
        .card-builder-field.is-toggle-field.is-active .card-builder-toggle {
          border-color: #0d6ffd;
          background: #0d6ffd;
        }
        .card-builder-field.is-toggle-field.is-active .card-builder-toggle span {
          transform: translateX(18px);
        }
        .card-builder-field.is-locked { background: #f8fafc; border-color: #e2e8f0; opacity: 0.85; }
        .card-builder-field.is-locked button { grid-template-columns: 30px minmax(0,1fr) auto; color: #94a3b8; cursor: default; }
        .card-builder-field.is-locked .card-builder-brand-mark { background: #f3f4f6; color: #6b7280; }
        .card-builder-field.is-locked button > a { justify-self: end; color: #0d6ffd; background: #eaf3ff; border: 1px solid #bfdbfe; border-radius: 7px; padding: 5px 8px; font-size: 11px; font-weight: 900; text-decoration: none; }
        .card-builder-field input, .card-builder-slug input, .card-builder-section textarea {
          width: 100%;
          border: none;
          border-top: 1px solid #e5e7eb;
          outline: none;
          padding: 11px 12px;
          background: #ffffff !important;
          color: #111827 !important;
          -webkit-text-fill-color: #111827;
          box-sizing: border-box;
          font-size: 13px;
        }
        .card-builder-field input::placeholder, .card-builder-slug input::placeholder, .card-builder-section textarea::placeholder { color: #9ca3af; -webkit-text-fill-color: #9ca3af; opacity: 1; }
        .card-builder-field input:-webkit-autofill {
          box-shadow: 0 0 0 1000px #ffffff inset;
          -webkit-text-fill-color: #111827;
        }
        .card-builder-field.is-active { border-color: #8fc1ff; box-shadow: 0 0 0 3px #eaf3ff; }
        .card-builder-multi-inputs { border-top: 1px solid #e5e7eb; padding: 8px 8px 10px; display: grid; gap: 8px; }
        .card-builder-multi-row { display: grid; grid-template-columns: minmax(0, 1fr) 34px; gap: 6px; }
        .card-builder-multi-row input { border: 1px solid #e5e7eb; border-radius: 8px; padding: 9px 10px; font-size: 13px; border-top: 1px solid #e5e7eb; }
        .card-builder-multi-remove { border: 1px solid #fecaca; background: #fff; color: #b91c1c; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; }
        .card-builder-multi-add { border: 1px dashed #bfdbfe; background: #eaf3ff; color: #0b5ed7; border-radius: 8px; min-height: 34px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; font-size: 12px; font-weight: 800; cursor: pointer; }
        .card-builder-slug { max-width: 560px; display: flex; border: 1px solid #e5e7eb; border-radius: 9px; overflow: hidden; background: #fff; margin-bottom: 12px; }
        .card-builder-slug span { padding: 12px; background: #f5f5f5; color: #6b7280; font-size: 13px; border-right: 1px solid #e5e7eb; }
        .card-builder-slug input { border-top: none; }
        .card-builder-section textarea { max-width: 560px; border: 1px solid #e5e7eb; border-radius: 9px; resize: vertical; }
        .card-builder-admin-assignment { max-width: 560px; display: grid; gap: 10px; }
        .card-builder-admin-assignment label { display: grid; gap: 7px; color: #374151; font-size: 13px; font-weight: 800; }
        .card-builder-admin-assignment select { width: 100%; border: 1px solid #e5e7eb; border-radius: 9px; background: #fff; color: #111827; padding: 11px 12px; font-size: 13px; outline: none; }
        .card-builder-admin-assignment select:focus { border-color: #0d6ffd; box-shadow: 0 0 0 3px #eaf3ff; }
        .card-builder-admin-assignment p { margin: 0; color: #6b7280; font-size: 12px; line-height: 1.5; }
        .card-builder-alert { max-width: 560px; padding: 12px 14px; border-radius: 10px; border: 1px solid #fecaca; background: #fef2f2; color: #b91c1c; font-weight: 800; font-size: 13px; margin-bottom: 18px; }
        .card-builder-footer { display: flex; align-items: center; justify-content: space-between; gap: 18px; margin-top: 56px; }
        .card-builder-footer p { color: #6b7280; font-size: 12px; }
        .card-builder-footer button { border: none; border-radius: 999px; background: #0d6ffd; color: #fff; padding: 13px 24px; display: inline-flex; align-items: center; gap: 8px; font-weight: 900; cursor: pointer; }
        .card-builder-footer button:disabled { opacity: .7; cursor: wait; }
        @media (max-width: 980px) {
          .card-builder-page { grid-template-columns: 1fr; }
          .card-builder-left { position: static; min-height: auto; }
          .card-builder-panel { border-radius: 32px 32px 0 0; padding: 28px 18px; }
          .card-builder-field-grid, .card-builder-upload-grid { grid-template-columns: 1fr; }
          .card-builder-header, .card-builder-footer { flex-direction: column; align-items: stretch; }
        }
      `}</style>
    </div>
  );
}
