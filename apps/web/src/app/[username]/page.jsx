import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { Calendar, ExternalLink } from "lucide-react";
import CardPhonePreview, {
  activeFieldsForCard,
  platformUrl,
} from "../../components/card-preview/CardPhonePreview";
import { getPublicCard } from "../../utils/cardsStore";

const PREMIUM_FEATURE_PLANS = new Set(["jostap_nfc", "custom_nfc", "premium_renewal"]);
const CUSTOM_BRANDING_PLANS = new Set(["custom_nfc"]);

function hasPremiumFeatures(plan) {
  return PREMIUM_FEATURE_PLANS.has(String(plan || "").toLowerCase());
}

function hasCustomBranding(plan) {
  return CUSTOM_BRANDING_PLANS.has(String(plan || "").toLowerCase());
}

export default function PublicProfilePage() {
  const { username } = useParams();
  const [card, setCard] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [booking, setBooking] = useState({
    guestName: "",
    guestEmail: "",
    startsAt: "",
    notes: "",
  });
  const [bookingState, setBookingState] = useState({
    submitting: false,
    message: "",
    error: "",
  });

  useEffect(() => {
    let active = true;

    async function loadCard() {
      try {
        const found = await getPublicCard(username);
        if (active) {
          setCard(found || null);
          setLoaded(true);
        }
      } catch {
        if (active) {
          setCard(null);
          setLoaded(true);
        }
      }
    }

    loadCard();
    return () => {
      active = false;
    };
  }, [username]);

  if (!loaded) return null;

  if (!card) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#F9FAFB",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          fontFamily: "'Inter',-apple-system,sans-serif",
        }}
      >
        <div className="ui-empty-state" style={{ maxWidth: 460 }}>
          <p className="ui-empty-state__title">Card not found</p>
          <p className="ui-empty-state__copy">
            This card has not been created yet, or its public slug was changed.
          </p>
          <a
            href="/create-card"
            style={{
              display: "inline-flex",
              marginTop: 18,
              fontSize: 14,
              fontWeight: 600,
              color: "#fff",
              textDecoration: "none",
              padding: "9px 18px",
              borderRadius: 9,
              background: "#2563EB",
            }}
          >
            Create Card
          </a>
        </div>
      </div>
    );
  }

  const includePremium = hasPremiumFeatures(card.plan);
  const visibleFields =
    Array.isArray(card.activeFields) && card.activeFields.length
      ? card.activeFields
      : activeFieldsForCard(card, { includePremium });
  const brandColor = hasCustomBranding(card.plan) ? card.brandColor : "";
  const calendlyRaw = Array.isArray(card.calendly) ? card.calendly.find(Boolean) || "" : card.calendly || "";
  const calendarUrl = calendlyRaw ? platformUrl("calendly", calendlyRaw) : "";
  const minDateTime = new Date(Date.now() + 60_000).toISOString().slice(0, 16);

  const submitBooking = async (event) => {
    event.preventDefault();
    setBookingState({ submitting: true, message: "", error: "" });
    try {
      const response = await fetch(`/api/appointments/public/${card.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(booking),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Unable to submit your booking.");
      }
      setBooking({ guestName: "", guestEmail: "", startsAt: "", notes: "" });
      setBookingState({
        submitting: false,
        message: "Appointment request sent successfully.",
        error: "",
      });
    } catch (error) {
      setBookingState({
        submitting: false,
        message: "",
        error: error.message || "Unable to submit your booking.",
      });
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F9FAFB",
        padding: "28px 16px",
        fontFamily: "'Inter',-apple-system,sans-serif",
      }}
    >
      <div style={{ maxWidth: 460, margin: "0 auto" }}>
        <CardPhonePreview
          card={{ ...card, brandColor }}
          activeFields={visibleFields}
          qrLocked={!includePremium}
          onSaveContact={async () => {
            await fetch(`/api/cards/public/${card.slug}`, {
              method: "POST",
            }).catch(() => {});
          }}
        />

        {includePremium && (
          <section
            style={{
              marginTop: 20,
              background: "#fff",
              border: "1px solid #E5E7EB",
              borderRadius: 16,
              padding: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#111827" }}>
                Book Appointment
              </h2>
              {calendarUrl && (
                <a
                  href={calendarUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none", fontSize: 12, color: "#2563EB", fontWeight: 700 }}
                >
                  Open Calendar <ExternalLink size={12} />
                </a>
              )}
            </div>

            <form onSubmit={submitBooking} style={{ display: "grid", gap: 10 }}>
              <input
                required
                placeholder="Your name"
                value={booking.guestName}
                onChange={(event) => setBooking((current) => ({ ...current, guestName: event.target.value }))}
                style={{ border: "1px solid #E5E7EB", borderRadius: 10, padding: "10px 12px", fontSize: 14 }}
              />
              <input
                required
                type="email"
                placeholder="Your email"
                value={booking.guestEmail}
                onChange={(event) => setBooking((current) => ({ ...current, guestEmail: event.target.value }))}
                style={{ border: "1px solid #E5E7EB", borderRadius: 10, padding: "10px 12px", fontSize: 14 }}
              />
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 700 }}>Preferred time</span>
                <input
                  required
                  type="datetime-local"
                  min={minDateTime}
                  value={booking.startsAt}
                  onChange={(event) => setBooking((current) => ({ ...current, startsAt: event.target.value }))}
                  style={{ border: "1px solid #E5E7EB", borderRadius: 10, padding: "10px 12px", fontSize: 14 }}
                />
              </label>
              <textarea
                placeholder="Optional note"
                value={booking.notes}
                onChange={(event) => setBooking((current) => ({ ...current, notes: event.target.value }))}
                rows={3}
                style={{ border: "1px solid #E5E7EB", borderRadius: 10, padding: "10px 12px", fontSize: 14, resize: "vertical" }}
              />
              {bookingState.error && (
                <p style={{ margin: 0, fontSize: 12, color: "#B91C1C", fontWeight: 700 }}>{bookingState.error}</p>
              )}
              {bookingState.message && (
                <p style={{ margin: 0, fontSize: 12, color: "#047857", fontWeight: 700 }}>{bookingState.message}</p>
              )}
              <button
                type="submit"
                disabled={bookingState.submitting}
                style={{
                  border: "none",
                  borderRadius: 10,
                  background: "#2563EB",
                  color: "#fff",
                  padding: "10px 12px",
                  fontSize: 14,
                  fontWeight: 800,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  cursor: bookingState.submitting ? "wait" : "pointer",
                  opacity: bookingState.submitting ? 0.75 : 1,
                }}
              >
                <Calendar size={14} />
                {bookingState.submitting ? "Submitting..." : "Request Appointment"}
              </button>
            </form>
          </section>
        )}
      </div>
    </div>
  );
}
