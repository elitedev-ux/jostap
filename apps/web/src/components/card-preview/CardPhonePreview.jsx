import { useState } from "react";
import { Building2, Globe, Mail, MapPin, Phone, Send, User, X } from "lucide-react";
import { FaLinkedinIn, FaSkype } from "react-icons/fa";
import {
  SiDiscord,
  SiFacebook,
  SiGithub,
  SiInstagram,
  SiApplemusic,
  SiAudiomack,
  SiBehance,
  SiDribbble,
  SiSignal,
  SiSnapchat,
  SiSpotify,
  SiTelegram,
  SiThreads,
  SiTiktok,
  SiTwitch,
  SiWhatsapp,
  SiX,
  SiYelp,
  SiYoutube,
  SiYoutubemusic,
} from "react-icons/si";
import QRCode from "../QRCode";
import {
  cardProfileUrl,
  cardQrUrl,
  displayCardUrl,
  publicCardUrl,
} from "../../utils/publicUrl";

const DEFAULT_COLOR = "#3657E8";
const PREMIUM_ONLY_FIELDS = new Set(["calendly", "videoUrl"]);
const DEFAULT_ACTIVE_FIELDS = [
  "name",
  "title",
  "company",
  "email",
  "phone",
  "website",
  "instagram",
  "exchangeContact",
];

export const BRAND_META = {
  email: { color: "#0d6ffd" },
  phone: { color: "#059669" },
  website: { color: "#ff9f0d" },
  portfolio: { color: "#ff9f0d" },
  address: { color: "#DC2626" },
  twitter: { color: "#111827", icon: SiX },
  instagram: { color: "#E1306C", icon: SiInstagram },
  threads: { color: "#111827", icon: SiThreads },
  linkedin: { color: "#0A66C2", icon: FaLinkedinIn },
  facebook: { color: "#1877F2", icon: SiFacebook },
  youtube: { color: "#FF0000", icon: SiYoutube },
  snapchat: { color: "#FFFC00", icon: SiSnapchat, text: "#111827" },
  tiktok: { color: "#111827", icon: SiTiktok },
  twitch: { color: "#9146FF", icon: SiTwitch },
  yelp: { color: "#D32323", icon: SiYelp },
  whatsapp: { color: "#25D366", icon: SiWhatsapp },
  signal: { color: "#3A76F0", icon: SiSignal },
  discord: { color: "#5865F2", icon: SiDiscord },
  skype: { color: "#00AFF0", icon: FaSkype },
  telegram: { color: "#229ED9", icon: SiTelegram },
  github: { color: "#181717", icon: SiGithub },
  behance: { color: "#1769FF", icon: SiBehance },
  dribbble: { color: "#EA4C89", icon: SiDribbble },
  spotify: { color: "#1DB954", icon: SiSpotify },
  appleMusic: { color: "#FA243C", icon: SiApplemusic },
  boomplay: { color: "#F97316", glyph: "B" },
  audiomack: { color: "#FFA200", icon: SiAudiomack, text: "#111827" },
  youtubeMusic: { color: "#FF0000", icon: SiYoutubemusic },
  headline: { color: "#DB2777" },
};

const FIELD_LABELS = {
  linkedin: "LinkedIn",
  instagram: "Instagram",
  twitter: "X",
  whatsapp: "WhatsApp",
  facebook: "Facebook",
  telegram: "Telegram",
  tiktok: "TikTok",
  youtube: "YouTube",
  snapchat: "Snapchat",
  threads: "Threads",
  twitch: "Twitch",
  yelp: "Yelp",
  signal: "Signal",
  discord: "Discord",
  skype: "Skype",
  github: "GitHub",
  behance: "Behance",
  dribbble: "Dribbble",
  spotify: "Spotify",
  appleMusic: "Apple Music",
  boomplay: "Boomplay",
  audiomack: "Audiomack",
  youtubeMusic: "YouTube Music",
};

const SOCIAL_FIELDS = Object.keys(FIELD_LABELS);
const EXTRA_FIELDS = [
  ["portfolio", "Portfolio", Globe],
  ["address", "Address", MapPin],
];

const EMPTY_EXCHANGE_FORM = {
  name: "",
  phone: "",
  email: "",
  company: "",
  jobTitle: "",
};

function normalizedValues(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || "").trim())
      .filter(Boolean);
  }
  const one = String(value || "").trim();
  return one ? [one] : [];
}

function firstValue(value) {
  return normalizedValues(value)[0] || "";
}

export function initials(name) {
  return (
    String(name || "YN")
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "YN"
  );
}

export function normalizedUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "#";

  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    const url = new URL(candidate);
    return ["http:", "https:"].includes(url.protocol) && url.hostname
      ? url.toString()
      : "#";
  } catch {
    return "#";
  }
}

function normalizedOptionalUrl(value) {
  const url = normalizedUrl(value);
  return url === "#" ? "" : url;
}

function safeHandle(value) {
  return String(value || "")
    .trim()
    .replace(/^@/, "")
    .replace(/[\s/#?&]+/g, "")
    .slice(0, 80);
}

function cleanHandle(value) {
  const raw = String(value || "").trim();
  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      return safeHandle(url.pathname.split("/").filter(Boolean).pop() || "");
    } catch {
      return safeHandle(raw);
    }
  }
  return safeHandle(raw);
}

function normalizeSkype(value) {
  const handle = String(value || "")
    .trim()
    .replace(/^skype:/i, "")
    .replace(/\?.*$/g, "");

  if (!/^[a-z0-9._,+-]{1,80}$/i.test(handle)) {
    return "";
  }

  return `skype:${encodeURIComponent(handle)}?chat`;
}

function normalizeWhatsapp(value) {
  return String(value || "").replace(/[^\d]/g, "");
}

export function platformUrl(field, value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return normalizedOptionalUrl(raw);
  if (/^skype:/i.test(raw)) return field === "skype" ? normalizeSkype(raw) : "";

  const handle = cleanHandle(raw);
  const urls = {
    website: normalizedOptionalUrl(raw),
    portfolio: normalizedOptionalUrl(raw),
    linkedin: normalizedOptionalUrl(raw.includes("linkedin.com") ? raw : `linkedin.com/in/${handle}`),
    twitter: normalizedOptionalUrl(`x.com/${handle}`),
    instagram: normalizedOptionalUrl(`instagram.com/${handle}`),
    threads: normalizedOptionalUrl(`threads.net/@${handle}`),
    facebook: normalizedOptionalUrl(raw.includes("facebook.com") ? raw : `facebook.com/${handle}`),
    youtube: normalizedOptionalUrl(raw.includes("youtube.com") ? raw : `youtube.com/@${handle}`),
    snapchat: normalizedOptionalUrl(`snapchat.com/add/${handle}`),
    tiktok: normalizedOptionalUrl(`tiktok.com/@${handle}`),
    twitch: normalizedOptionalUrl(`twitch.tv/${handle}`),
    yelp: normalizedOptionalUrl(raw),
    whatsapp: normalizeWhatsapp(raw) ? `https://wa.me/${normalizeWhatsapp(raw)}` : normalizedOptionalUrl(raw),
    signal: normalizedOptionalUrl(raw),
    discord: normalizedOptionalUrl(raw),
    skype: normalizeSkype(raw),
    telegram: normalizedOptionalUrl(`t.me/${handle}`),
    github: normalizedOptionalUrl(raw.includes("github.com") ? raw : `github.com/${handle}`),
    behance: normalizedOptionalUrl(raw.includes("behance.net") ? raw : `behance.net/${handle}`),
    dribbble: normalizedOptionalUrl(raw.includes("dribbble.com") ? raw : `dribbble.com/${handle}`),
    spotify: normalizedOptionalUrl(raw),
    appleMusic: normalizedOptionalUrl(raw),
    boomplay: normalizedOptionalUrl(raw),
    audiomack: normalizedOptionalUrl(raw.includes("audiomack.com") ? raw : `audiomack.com/${handle}`),
    youtubeMusic: normalizedOptionalUrl(raw),
  };

  return urls[field] || normalizedOptionalUrl(raw);
}

function escapeVcard(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

export function buildVcard(card) {
  const socialFirst = (key) => normalizedValues(card?.[key])[0] || "";
  const urls = [
    card.website && ["WORK", normalizedUrl(card.website)],
    socialFirst("portfolio") && ["Portfolio", platformUrl("portfolio", socialFirst("portfolio"))],
    socialFirst("linkedin") && ["LinkedIn", platformUrl("linkedin", socialFirst("linkedin"))],
    socialFirst("instagram") && ["Instagram", platformUrl("instagram", socialFirst("instagram"))],
    socialFirst("twitter") && ["X", platformUrl("twitter", socialFirst("twitter"))],
    socialFirst("facebook") && ["Facebook", platformUrl("facebook", socialFirst("facebook"))],
    socialFirst("youtube") && ["YouTube", platformUrl("youtube", socialFirst("youtube"))],
  ].filter(Boolean);

  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${escapeVcard(card.name || "")}`,
    `N:${escapeVcard(card.name || "")};;;;`,
    card.company ? `ORG:${escapeVcard(card.company)}` : "",
    card.title ? `TITLE:${escapeVcard(card.title)}` : "",
    card.phone ? `TEL;TYPE=CELL,VOICE:${escapeVcard(card.phone)}` : "",
    socialFirst("whatsapp") ? `TEL;TYPE=WHATSAPP:${escapeVcard(socialFirst("whatsapp"))}` : "",
    card.email ? `EMAIL;TYPE=INTERNET,WORK:${escapeVcard(card.email)}` : "",
    card.address ? `ADR;TYPE=WORK:;;${escapeVcard(card.address)};;;;` : "",
    card.bio ? `NOTE:${escapeVcard(card.bio)}` : "",
    ...urls.map(([label, url]) => `URL;TYPE=${escapeVcard(label)}:${escapeVcard(url)}`),
    "END:VCARD",
  ]
    .filter(Boolean)
    .join("\r\n");
}

function downloadVcard(card) {
  const blob = new Blob([buildVcard(card)], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${card.slug || cleanHandle(card.name) || "contact"}.vcf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function directVideoUrl(value) {
  const raw = String(value || "").trim();
  return /\.(mp4|webm|ogg)(\?.*)?$/i.test(raw) ? normalizedUrl(raw) : "";
}

function embedVideoUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  try {
    const url = new URL(normalizedUrl(raw));
    if (url.hostname.includes("youtu.be")) {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}` : "";
    }
    if (url.hostname.includes("youtube.com")) {
      const id = url.searchParams.get("v") || url.pathname.split("/").filter(Boolean).pop();
      return id ? `https://www.youtube.com/embed/${id.replace("shorts/", "")}` : "";
    }
    if (url.hostname.includes("vimeo.com")) {
      const id = url.pathname.split("/").filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}` : "";
    }
  } catch {
    return "";
  }

  return "";
}

function colorWithAlpha(color, alpha) {
  const hex = String(color || "").replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(hex)) return `rgba(13, 111, 253, ${alpha})`;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function activeSetFrom(value) {
  if (value instanceof Set) return value;
  if (Array.isArray(value)) return new Set(value);
  return new Set(DEFAULT_ACTIVE_FIELDS);
}

function hasValue(value) {
  if (Array.isArray(value)) return value.some((item) => String(item || "").trim());
  return Boolean(String(value || "").trim());
}

export function activeFieldsForCard(card, options = {}) {
  const fields = new Set(DEFAULT_ACTIVE_FIELDS);

  for (const key of [
    "headline",
    "portfolio",
    "address",
    ...SOCIAL_FIELDS,
    "videoUrl",
    "calendly",
    "exchangeContact",
  ]) {
    if (hasValue(card?.[key])) fields.add(key);
  }

  fields.add("exchangeContact");

  if (!options.includePremium) {
    for (const key of PREMIUM_ONLY_FIELDS) fields.delete(key);
  }

  return fields;
}

function socialTilesForPreview(card, activeFields) {
  return SOCIAL_FIELDS.flatMap((key) => {
    if (!activeFields.has(key)) return [];
    const entries = normalizedValues(card[key]);
    return entries.map((value, index) => ({
      key: `${key}-${index}`,
      label: FIELD_LABELS[key],
      href: platformUrl(key, value),
      Icon: BRAND_META[key]?.icon,
      glyph: BRAND_META[key]?.glyph,
      color: BRAND_META[key]?.color || "#111827",
      text: BRAND_META[key]?.text || "#fff",
    }));
  });
}

function extraDetailsForPreview(card, activeFields) {
  return EXTRA_FIELDS.filter(([key]) => activeFields.has(key) && card[key]).map(
    ([key, label, Icon]) => ({
      key,
      label,
      value: card[key],
      href: key === "address" ? "" : platformUrl(key, card[key]),
      Icon,
    }),
  );
}

export function BrandMark({ field, icon: Icon = User, size = 15 }) {
  const meta = BRAND_META[field] || { color: "#303033", glyph: null };
  const BrandIcon = meta.icon;

  return (
    <span className="card-preview-brand-mark" style={{ background: meta.color, color: meta.text || "#fff" }}>
      {BrandIcon ? <BrandIcon size={size} /> : meta.glyph ? meta.glyph : <Icon size={size} />}
    </span>
  );
}

export default function CardPhonePreview({
  card,
  activeFields,
  qrLocked = false,
  framed = true,
  compact = false,
  publicUrl,
  onSaveContact,
  onExchangeContact,
  includeStyles = true,
}) {
  const [exchangeOpen, setExchangeOpen] = useState(false);
  const [exchangeForm, setExchangeForm] = useState(EMPTY_EXCHANGE_FORM);
  const [exchangeStatus, setExchangeStatus] = useState({ submitting: false, error: "", success: "" });
  const visibleFields = activeSetFrom(activeFields);
  const color = card?.brandColor || DEFAULT_COLOR;
  const hasCoverImage = Boolean(card?.coverUrl);
  const coverBackground = `linear-gradient(135deg, ${color} 0%, #0b5ed7 58%, #0f172a 100%)`;
  const contactButtons = [
    ["phone", Phone, "Call", card?.phone ? `tel:${card.phone}` : ""],
    ["email", Mail, "Email", card?.email ? `mailto:${card.email}` : ""],
    ["website", Globe, "Website", platformUrl("website", card?.website)],
  ].filter(([key, , , href]) => visibleFields.has(key) && href);
  const socialTiles = socialTilesForPreview(card || {}, visibleFields);
  const extraDetails = extraDetailsForPreview(card || {}, visibleFields);
  const directVideo = directVideoUrl(card?.videoUrl);
  const embeddedVideo = embedVideoUrl(card?.videoUrl);
  const showVideo = Boolean(visibleFields.has("videoUrl") && card?.videoUrl);
  const resolvedPublicUrl = publicUrl || card?.publicUrl || (card?.id ? publicCardUrl(card) : cardProfileUrl(card?.slug));
  const resolvedQrUrl = card?.qrUrl || (card?.id ? cardQrUrl(card) : resolvedPublicUrl);
  const resolvedDisplayUrl = displayCardUrl(card?.slug || "your-slug");
  const hasVcardInfo = Boolean(card?.name || card?.company || card?.title || card?.email || card?.phone || card?.website || card?.portfolio);
  const showExchangeContact = visibleFields.has("exchangeContact");
  const canExchangeContact = showExchangeContact && typeof onExchangeContact === "function";
  const Root = framed ? "div" : "section";

  if (compact) {
    return (
      <Root className="card-preview-wrap is-compact">
        <div
          className="card-preview-phone"
          style={{
            "--card-brand": color,
            "--card-brand-soft": colorWithAlpha(color, 0.12),
            "--card-brand-ring": colorWithAlpha(color, 0.24),
          }}
        >
          <div className="card-preview-screen">
            <div className="card-preview-notch" />
            <div className="card-preview-cover" style={{ background: coverBackground }}>
              {hasCoverImage && (
                <img
                  className="card-preview-cover-img"
                  src={card.coverUrl}
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
              )}
            </div>
            <div className="card-preview-profile-row">
              <div className="card-preview-avatar">
                {card?.avatarUrl ? <img src={card.avatarUrl} alt="" loading="lazy" decoding="async" /> : initials(card?.name)}
              </div>
            </div>
            <div className="card-preview-copy">
              {card?.name && <h2>{card.name}</h2>}
              {card?.title && <p>{card.title}</p>}
              {card?.company && (
                <p className="card-preview-company">
                  <Building2 size={12} /> {card.company}
                </p>
              )}
              {card?.headline && <p className="card-preview-headline">{card.headline}</p>}
            </div>
          </div>
        </div>

        {includeStyles && (
          <style jsx global>{`
            .card-preview-wrap { flex: 1; display: flex; align-items: flex-start; justify-content: center; padding-top: 8px; }
            .card-preview-wrap.is-compact { padding-top: 0; align-items: stretch; }
            .card-preview-phone {
              width: min(390px, 86vw);
              border: 1px solid var(--card-brand-ring);
              border-radius: 28px;
              background: #ffffff;
              box-shadow: none;
              overflow: hidden;
              transition: box-shadow 0.3s ease;
            }
            .card-preview-wrap.is-compact .card-preview-phone { width: 190px; border-radius: 18px; box-shadow: none; }
            .card-preview-notch {
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
            .card-preview-wrap.is-compact .card-preview-notch { width: 60px; height: 10px; border-bottom-left-radius: 7px; border-bottom-right-radius: 7px; }
            .card-preview-screen { border-radius: 28px; background: #fff; overflow: visible; position: relative; }
            .card-preview-cover { height: 160px; width: 100%; border-radius: 0; color: #fff; position: relative; overflow: hidden; }
            .card-preview-cover-img { width: 100%; height: 100%; object-fit: cover; display: block; }
            .card-preview-wrap.is-compact .card-preview-cover { height: 78px; }
            .card-preview-cover::after {
              content: "";
              position: absolute;
              inset: 0;
              background: linear-gradient(180deg, rgba(15,23,42,0.05), rgba(15,23,42,0.28));
              pointer-events: none;
            }
            .card-preview-profile-row { display: flex; justify-content: flex-start; align-items: flex-start; margin: -42px 0 0 22px; position: relative; z-index: 2; }
            .card-preview-wrap.is-compact .card-preview-profile-row { margin: -24px 0 0 12px; }
            .card-preview-avatar {
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
            .card-preview-wrap.is-compact .card-preview-avatar { width: 48px; height: 48px; border-width: 3px; font-size: 14px; }
            .card-preview-avatar img { width: 100%; height: 100%; object-fit: cover; }
            .card-preview-copy { padding: 12px 22px 16px; }
            .card-preview-wrap.is-compact .card-preview-copy { padding: 8px 12px 12px; }
            .card-preview-copy h2 { font-size: 20px; line-height: 1.12; margin: 0 0 8px; font-weight: 900; letter-spacing: 0; color: #0f172a; }
            .card-preview-wrap.is-compact .card-preview-copy h2 { font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .card-preview-copy p { font-size: 14px; color: #475569; margin: 4px 0; overflow-wrap: anywhere; }
            .card-preview-wrap.is-compact .card-preview-copy p { font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .card-preview-company { display: inline-flex; align-items: center; gap: 6px; color: #0f172a !important; font-size: 13px !important; font-weight: 800; }
            .card-preview-headline { color: #0f172a !important; line-height: 1.35; margin-top: 9px !important; font-size: 12px !important; font-weight: 700; }
          `}</style>
        )}
      </Root>
    );
  }

  const handleSaveContact = async () => {
    downloadVcard(card || {});
    await onSaveContact?.();
  };

  const handleExchangeChange = (field, value) => {
    setExchangeStatus((current) => ({ ...current, error: "", success: "" }));
    setExchangeForm((current) => ({ ...current, [field]: value }));
  };

  const closeExchange = () => {
    if (exchangeStatus.submitting) return;
    setExchangeOpen(false);
    setExchangeStatus({ submitting: false, error: "", success: "" });
  };

  const handleExchangeSubmit = async (event) => {
    event.preventDefault();
    if (!canExchangeContact) return;

    setExchangeStatus({ submitting: true, error: "", success: "" });
    try {
      await onExchangeContact(exchangeForm);
      setExchangeForm(EMPTY_EXCHANGE_FORM);
      setExchangeStatus({
        submitting: false,
        error: "",
        success: "Contact shared successfully.",
      });
    } catch (error) {
      setExchangeStatus({
        submitting: false,
        error: error.message || "Unable to share contact.",
        success: "",
      });
    }
  };

  return (
    <Root className={`card-preview-wrap ${compact ? "is-compact" : ""}`}>
      <div
        className="card-preview-phone"
        style={{
          "--card-brand": color,
          "--card-brand-soft": colorWithAlpha(color, 0.12),
          "--card-brand-ring": colorWithAlpha(color, 0.24),
        }}
      >
        <div className="card-preview-screen">
          <div className="card-preview-notch" />
          <div className="card-preview-cover" style={{ background: coverBackground }}>
            {hasCoverImage && (
              <img
                className="card-preview-cover-img"
                src={card.coverUrl}
                alt=""
                loading="lazy"
                decoding="async"
              />
            )}
          </div>
          <div className="card-preview-profile-row">
            <div className="card-preview-avatar">
              {card?.avatarUrl ? <img src={card.avatarUrl} alt="" loading="lazy" decoding="async" /> : initials(card?.name)}
            </div>
          </div>
          <div className="card-preview-copy">
            {card?.name && <h2>{card.name}</h2>}
            {card?.title && <p>{card.title}</p>}
            {card?.company && (
              <p className="card-preview-company">
                <Building2 size={12} /> {card.company}
              </p>
            )}
            {card?.headline && <p className="card-preview-headline">{card.headline}</p>}
          </div>
          {contactButtons.length > 0 && (
            <div className="card-preview-quick-actions">
              {contactButtons.map(([key, Icon, label, href]) => (
                <a href={href} key={key}>
                  <span>
                    <Icon size={22} />
                  </span>
                  <strong>{label}</strong>
                </a>
              ))}
            </div>
          )}
          {(hasVcardInfo || showExchangeContact) && (
            <div className="card-preview-action-stack">
              {hasVcardInfo && (
                <button className="card-preview-vcard" type="button" onClick={handleSaveContact}>
                  Save contact
                </button>
              )}
              {showExchangeContact && (
                <button
                  className="card-preview-exchange"
                  type="button"
                  onClick={() => canExchangeContact && setExchangeOpen(true)}
                  aria-disabled={!canExchangeContact}
                >
                  <Send size={17} />
                  Exchange contact
                </button>
              )}
            </div>
          )}
          {extraDetails.length > 0 && (
            <div className="card-preview-info-list">
              {extraDetails.map(({ key, label, value, href, Icon }) => {
                const content = (
                  <>
                    <span>
                      <Icon size={16} />
                    </span>
                    <p>
                      <strong>{label}</strong>
                      <small>{value}</small>
                    </p>
                  </>
                );
                return href ? (
                  <a href={href} key={key}>
                    {content}
                  </a>
                ) : (
                  <div key={key}>{content}</div>
                );
              })}
            </div>
          )}
          {socialTiles.length > 0 && (
            <div className="card-preview-social-card">
              {socialTiles.map(({ key, label, href, Icon, glyph, color: tileColor, text }) => (
                <a href={href || "#"} key={key}>
                  <span className="card-preview-social-icon" style={{ background: tileColor, color: text }}>
                    {Icon ? <Icon size={28} /> : glyph ? glyph : <User size={28} />}
                  </span>
                  <small>{label}</small>
                </a>
              ))}
            </div>
          )}
          {showVideo && (
            <div className="card-preview-video-card">
              {directVideo ? (
                <video src={directVideo} controls />
              ) : embeddedVideo ? (
                <iframe src={embeddedVideo} title="Card video preview" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
              ) : (
                <strong>VIDEO</strong>
              )}
            </div>
          )}
          <div className={`card-preview-qr ${qrLocked ? "is-locked" : ""}`}>
            <div className="card-preview-qr-code">
              <QRCode value={resolvedQrUrl} size={144} />
            </div>
            <span>{resolvedDisplayUrl}</span>
            {qrLocked && <em>Upgrade to unlock downloadable QR</em>}
          </div>
        </div>
      </div>

      {canExchangeContact && exchangeOpen && (
        <div className="card-preview-exchange-modal" role="dialog" aria-modal="true" aria-labelledby="exchange-contact-title">
          <div className="card-preview-exchange-panel">
            <div className="card-preview-exchange-header">
              <div>
                <h3 id="exchange-contact-title">Exchange contact</h3>
                <p>Share your details with {card?.name || "this profile"}.</p>
              </div>
              <button type="button" onClick={closeExchange} aria-label="Close exchange contact form">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleExchangeSubmit} className="card-preview-exchange-form">
              <label>
                <span>Full Name</span>
                <input
                  required
                  maxLength={120}
                  value={exchangeForm.name}
                  onChange={(event) => handleExchangeChange("name", event.target.value)}
                  placeholder="Your full name"
                />
              </label>
              <label>
                <span>Phone Number</span>
                <input
                  required
                  type="tel"
                  maxLength={40}
                  value={exchangeForm.phone}
                  onChange={(event) => handleExchangeChange("phone", event.target.value)}
                  placeholder="+234 800 000 0000"
                />
              </label>
              <label>
                <span>Email Address</span>
                <input
                  required
                  type="email"
                  maxLength={160}
                  value={exchangeForm.email}
                  onChange={(event) => handleExchangeChange("email", event.target.value)}
                  placeholder="you@company.com"
                />
              </label>
              <label>
                <span>Company / Business Name <em>(Optional)</em></span>
                <input
                  maxLength={160}
                  value={exchangeForm.company}
                  onChange={(event) => handleExchangeChange("company", event.target.value)}
                  placeholder="Company name"
                />
              </label>
              <label>
                <span>Job Title <em>(Optional)</em></span>
                <input
                  maxLength={120}
                  value={exchangeForm.jobTitle}
                  onChange={(event) => handleExchangeChange("jobTitle", event.target.value)}
                  placeholder="Job title"
                />
              </label>

              {exchangeStatus.error && <p className="card-preview-exchange-message is-error">{exchangeStatus.error}</p>}
              {exchangeStatus.success && <p className="card-preview-exchange-message is-success">{exchangeStatus.success}</p>}

              <button className="card-preview-exchange-submit" type="submit" disabled={exchangeStatus.submitting}>
                {exchangeStatus.submitting ? "Sending..." : "Share contact"}
              </button>
            </form>
          </div>
        </div>
      )}

      {includeStyles && (
      <style jsx global>{`
        .card-preview-wrap { flex: 1; display: flex; align-items: flex-start; justify-content: center; padding-top: 8px; }
        .card-preview-wrap.is-compact { padding-top: 0; align-items: stretch; }
        .card-preview-phone {
          width: min(390px, 86vw);
          border: 1px solid var(--card-brand-ring);
          border-radius: 28px;
          background: #ffffff;
          box-shadow: none;
          overflow: hidden;
          transition: box-shadow 0.3s ease;
        }
        .card-preview-wrap.is-compact .card-preview-phone { width: 190px; border-radius: 18px; box-shadow: none; }
        .card-preview-notch {
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
        .card-preview-wrap.is-compact .card-preview-notch { width: 60px; height: 10px; border-bottom-left-radius: 7px; border-bottom-right-radius: 7px; }
        .card-preview-screen { border-radius: 28px; background: #fff; overflow: visible; position: relative; }
        .card-preview-cover { height: 160px; width: 100%; border-radius: 0; color: #fff; position: relative; overflow: hidden; }
        .card-preview-cover-img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .card-preview-wrap.is-compact .card-preview-cover { height: 78px; }
        .card-preview-cover::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(15,23,42,0.05), rgba(15,23,42,0.28));
          pointer-events: none;
        }
        .card-preview-profile-row { display: flex; justify-content: flex-start; align-items: flex-start; margin: -42px 0 0 22px; position: relative; z-index: 2; }
        .card-preview-wrap.is-compact .card-preview-profile-row { margin: -24px 0 0 12px; }
        .card-preview-avatar {
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
        .card-preview-wrap.is-compact .card-preview-avatar { width: 48px; height: 48px; border-width: 3px; font-size: 14px; }
        .card-preview-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .card-preview-copy { padding: 12px 22px 16px; }
        .card-preview-wrap.is-compact .card-preview-copy { padding: 8px 12px 12px; }
        .card-preview-copy h2 { font-size: 20px; line-height: 1.12; margin: 0 0 8px; font-weight: 900; letter-spacing: 0; color: #0f172a; }
        .card-preview-wrap.is-compact .card-preview-copy h2 { font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .card-preview-copy p { font-size: 14px; color: #475569; margin: 4px 0; overflow-wrap: anywhere; }
        .card-preview-wrap.is-compact .card-preview-copy p { font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .card-preview-company { display: inline-flex; align-items: center; gap: 6px; color: #0f172a !important; font-size: 13px !important; font-weight: 800; }
        .card-preview-headline { color: #0f172a !important; line-height: 1.35; margin-top: 9px !important; font-size: 12px !important; font-weight: 700; }
        .card-preview-quick-actions { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 9px; padding: 2px 22px 16px; }
        .card-preview-wrap.is-compact .card-preview-quick-actions,
        .card-preview-wrap.is-compact .card-preview-info-list,
        .card-preview-wrap.is-compact .card-preview-social-card,
        .card-preview-wrap.is-compact .card-preview-video-card,
        .card-preview-wrap.is-compact .card-preview-qr,
        .card-preview-wrap.is-compact .card-preview-action-stack { display: none; }
        .card-preview-quick-actions a {
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
        .card-preview-quick-actions a:hover { transform: translateY(-2px); border-color: var(--card-brand); }
        .card-preview-quick-actions span { width: 34px; height: 34px; border-radius: 999px; background: var(--card-brand-soft); color: var(--card-brand); display: inline-flex; align-items: center; justify-content: center; }
        .card-preview-quick-actions strong { font-size: 13px; line-height: 1; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
        .card-preview-action-stack { margin: 0 22px 22px; display: grid; gap: 10px; }
        .card-preview-vcard,
        .card-preview-exchange { width: 100%; min-height: 48px; border-radius: 14px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; font-size: 16px; font-weight: 800; cursor: pointer; transition: transform .2s ease, border-color .2s ease, background .2s ease; }
        .card-preview-vcard { border: none; background: var(--card-brand); color: #fff; box-shadow: 0 10px 20px -5px var(--card-brand-ring); }
        .card-preview-exchange { border: 1px solid var(--card-brand-ring); background: #fff; color: var(--card-brand); }
        .card-preview-vcard:hover,
        .card-preview-exchange:hover { transform: translateY(-1px); }
        .card-preview-exchange:hover { border-color: var(--card-brand); background: var(--card-brand-soft); }
        .card-preview-info-list { margin: 0 22px 22px; display: grid; gap: 10px; }
        .card-preview-info-list a, .card-preview-info-list div { display: grid; grid-template-columns: 38px minmax(0, 1fr); align-items: center; gap: 10px; min-width: 0; padding: 12px; border: 1px solid #e5e7eb; border-radius: 14px; background: #fff; color: #0f172a; text-decoration: none; }
        .card-preview-info-list span { width: 34px; height: 34px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; background: var(--card-brand-soft); color: var(--card-brand); }
        .card-preview-info-list p { margin: 0; min-width: 0; }
        .card-preview-info-list strong { display: block; font-size: 12px; color: #64748b; margin-bottom: 2px; }
        .card-preview-info-list small { display: block; font-size: 13px; color: #0f172a; overflow-wrap: anywhere; }
        .card-preview-social-card { margin: 0 22px 22px; padding: 16px; border: 1px solid #eef2f7; border-radius: 18px; background: #f8fafc; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px 10px; }
        .card-preview-social-card a { display: grid; gap: 7px; justify-items: center; color: #0f172a; text-decoration: none; min-width: 0; transition: transform 0.2s ease; }
        .card-preview-social-card a:hover { transform: scale(1.05); }
        .card-preview-social-icon { width: 54px; height: 54px; border-radius: 17px; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 18px rgba(15,23,42,0.08); }
        .card-preview-social-card small { font-size: 12px; font-weight: 800; color: #0f172a; text-align: center; overflow-wrap: anywhere; }
        .card-preview-video-card { margin: 0 22px 22px; min-height: 150px; border-radius: 18px; background: #f8fafc; border: 1px solid #eef2f7; display: flex; align-items: center; justify-content: center; overflow: hidden; color: var(--card-brand); aspect-ratio: 16 / 9; }
        .card-preview-video-card strong { font-size: 24px; letter-spacing: 0; }
        .card-preview-video-card iframe, .card-preview-video-card video { width: 100%; height: 100%; border: 0; object-fit: cover; display: block; }
        .card-preview-qr { display: grid; justify-items: center; gap: 8px; margin: 0 22px 28px; padding: 18px; border: 1px solid var(--card-brand-ring); border-radius: 18px; background: #fff; color: #0f172a; font-size: 13px; font-weight: 500; }
        .card-preview-qr-code { display: flex; align-items: center; justify-content: center; transition: filter .2s ease, opacity .2s ease; }
        .card-preview-qr.is-locked .card-preview-qr-code { filter: blur(5px); opacity: .48; pointer-events: none; user-select: none; }
        .card-preview-qr svg { max-width: 64%; height: auto; }
        .card-preview-qr span { overflow-wrap: anywhere; text-align: center; }
        .card-preview-qr em { margin-top: 2px; font-style: normal; color: #0d6ffd; background: #eaf3ff; border: 1px solid #bfdbfe; border-radius: 999px; padding: 4px 10px; font-size: 11px; font-weight: 800; text-align: center; }
        .card-preview-brand-mark { width: 30px; height: 30px; border-radius: 999px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 12px; font-weight: 950; font-family: Archivo, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
        .card-preview-exchange-modal {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(15, 23, 42, .54);
          backdrop-filter: blur(8px);
        }
        .card-preview-exchange-panel {
          width: min(440px, 100%);
          max-height: min(720px, calc(100vh - 40px));
          overflow: auto;
          border-radius: 20px;
          border: 1px solid rgba(226, 232, 240, .9);
          background: #fff;
          box-shadow: 0 28px 90px rgba(15, 23, 42, .24);
        }
        .card-preview-exchange-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          padding: 22px 22px 16px;
          border-bottom: 1px solid #eef2f7;
        }
        .card-preview-exchange-header h3 {
          margin: 0;
          color: #0f172a;
          font-size: 22px;
          line-height: 1.1;
          font-weight: 900;
          letter-spacing: 0;
        }
        .card-preview-exchange-header p {
          margin: 6px 0 0;
          color: #64748b;
          font-size: 13px;
          line-height: 1.45;
        }
        .card-preview-exchange-header button {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          background: #fff;
          color: #475569;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex: 0 0 auto;
        }
        .card-preview-exchange-form { display: grid; gap: 13px; padding: 18px 22px 24px; }
        .card-preview-exchange-form label { display: grid; gap: 7px; }
        .card-preview-exchange-form span {
          color: #0f172a;
          font-size: 12px;
          font-weight: 850;
        }
        .card-preview-exchange-form em {
          color: #94a3b8;
          font-style: normal;
          font-weight: 750;
        }
        .card-preview-exchange-form input {
          width: 100%;
          min-height: 46px;
          box-sizing: border-box;
          border: 1px solid #dbe5f3;
          border-radius: 12px;
          background: #fff;
          color: #0f172a;
          padding: 0 13px;
          font: inherit;
          font-size: 14px;
          outline: none;
        }
        .card-preview-exchange-form input:focus {
          border-color: var(--card-brand);
          box-shadow: 0 0 0 4px var(--card-brand-soft);
        }
        .card-preview-exchange-submit {
          display: inline-flex !important;
          align-items: center;
          justify-content: center;
          width: 100%;
          min-height: 48px;
          border: none;
          border-radius: 13px;
          background: var(--card-brand, #0d6ffd) !important;
          color: #fff !important;
          font-size: 15px;
          font-weight: 900;
          cursor: pointer;
          box-shadow: 0 12px 24px -12px var(--card-brand, #0d6ffd);
          appearance: none;
          -webkit-appearance: none;
        }
        .card-preview-exchange-submit:hover { filter: brightness(.96); }
        .card-preview-exchange-submit:disabled { cursor: wait; opacity: .72; }
        .card-preview-exchange-message {
          margin: 0;
          border-radius: 12px;
          padding: 10px 12px;
          font-size: 13px;
          font-weight: 750;
          line-height: 1.4;
        }
        .card-preview-exchange-message.is-error {
          color: #b91c1c;
          background: #fef2f2;
          border: 1px solid #fecaca;
        }
        .card-preview-exchange-message.is-success {
          color: #047857;
          background: #ecfdf5;
          border: 1px solid #bbf7d0;
        }
        @media (max-width: 640px) {
          .card-preview-wrap:not(.is-compact) { width: 100%; }
          .card-preview-wrap:not(.is-compact) .card-preview-phone { width: 100%; box-sizing: border-box; }
          .card-preview-wrap:not(.is-compact) .card-preview-copy h2 { font-size: 18px; line-height: 1.15; }
        }
      `}</style>
      )}
    </Root>
  );
}
