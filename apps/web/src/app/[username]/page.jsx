import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { Calendar, ExternalLink } from "lucide-react";
import CardPhonePreview, {
  activeFieldsForCard,
  platformUrl,
} from "../../components/card-preview/CardPhonePreview";
import { getPublicCard } from "../../utils/cardsStore";
import "./page.css";

const PREMIUM_FEATURE_PLANS = new Set(["jostap_nfc", "custom_nfc", "premium_renewal"]);
const CUSTOM_BRANDING_PLANS = new Set(["custom_nfc"]);

function hasPremiumFeatures(plan) {
  return PREMIUM_FEATURE_PLANS.has(String(plan || "").toLowerCase());
}

function hasCustomBranding(plan) {
  return CUSTOM_BRANDING_PLANS.has(String(plan || "").toLowerCase());
}

export function PublicCardProfile({ token }) {
  const { username } = useParams();
  const cardToken = token || username;
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
        const found = await getPublicCard(cardToken, {
          referrer: typeof document !== "undefined" ? document.referrer : "",
        });
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
  }, [cardToken]);

  if (!loaded) return null;

  if (!card) {
    return (
      <main className="public-profile public-profile--empty">
        <div className="ui-empty-state public-profile__not-found">
          <p className="ui-empty-state__title">Card not found</p>
          <p className="ui-empty-state__copy">
            This card has not been created yet, or its public slug was changed.
          </p>
          <a href="/create-card" className="ui-button ui-button--primary public-profile__empty-action">
            Create Card
          </a>
        </div>
      </main>
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
    <main className="public-profile">
      <div className="public-profile__shell">
        <CardPhonePreview
          card={{ ...card, brandColor }}
          activeFields={visibleFields}
          qrLocked={!includePremium}
          onSaveContact={async () => {
            await fetch(`/api/public/card/${card.id || card.slug}`, {
              method: "POST",
            }).catch(() => {});
          }}
        />

        {includePremium && (
          <section className="booking-panel" aria-labelledby="booking-title">
            <div className="booking-panel__header">
              <h2 id="booking-title">Book Appointment</h2>
              {calendarUrl && (
                <a
                  href={calendarUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="booking-panel__external"
                >
                  Open Calendar <ExternalLink size={12} />
                </a>
              )}
            </div>

            <form onSubmit={submitBooking} className="booking-form">
              <input
                required
                placeholder="Your name"
                value={booking.guestName}
                onChange={(event) => setBooking((current) => ({ ...current, guestName: event.target.value }))}
              />
              <input
                required
                type="email"
                placeholder="Your email"
                value={booking.guestEmail}
                onChange={(event) => setBooking((current) => ({ ...current, guestEmail: event.target.value }))}
              />
              <label>
                <span>Preferred time</span>
                <input
                  required
                  type="datetime-local"
                  min={minDateTime}
                  value={booking.startsAt}
                  onChange={(event) => setBooking((current) => ({ ...current, startsAt: event.target.value }))}
                />
              </label>
              <textarea
                placeholder="Optional note"
                value={booking.notes}
                onChange={(event) => setBooking((current) => ({ ...current, notes: event.target.value }))}
                rows={3}
              />
              {bookingState.error && (
                <p className="booking-form__message booking-form__message--error">{bookingState.error}</p>
              )}
              {bookingState.message && (
                <p className="booking-form__message booking-form__message--success">{bookingState.message}</p>
              )}
              <button
                type="submit"
                disabled={bookingState.submitting}
                className="ui-button ui-button--primary booking-form__submit"
              >
                <Calendar size={14} />
                {bookingState.submitting ? "Submitting..." : "Request Appointment"}
              </button>
            </form>
          </section>
        )}
      </div>
    </main>
  );
}

export default function PublicProfilePage() {
  return <PublicCardProfile />;
}
