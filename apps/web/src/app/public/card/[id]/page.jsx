import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router";
import { Calendar } from "lucide-react";
import CardPhonePreview, {
  activeFieldsForCard,
} from "../../../../components/card-preview/CardPhonePreview";
import { getPublicCard } from "../../../../utils/cardsStore";
import "../../../[username]/page.css";

const PREMIUM_FEATURE_PLANS = new Set(["trial", "jostap_nfc", "custom_nfc", "basic_renewal", "premium_renewal"]);
const CUSTOM_BRANDING_PLANS = new Set(["trial", "jostap_nfc", "custom_nfc", "basic_renewal", "premium_renewal"]);

function hasPremiumFeatures(plan) {
  return PREMIUM_FEATURE_PLANS.has(String(plan || "").toLowerCase());
}

function hasCustomBranding(plan) {
  return CUSTOM_BRANDING_PLANS.has(String(plan || "").toLowerCase());
}

export default function PublicCardByIdPage() {
  const { id } = useParams();
  const location = useLocation();
  const [card, setCard] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [booking, setBooking] = useState({
    visitorName: "",
    visitorEmail: "",
    visitorPhone: "",
    appointmentDate: "",
    appointmentTime: "",
    appointmentMessage: "",
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
        const params = new URLSearchParams(location.search);
        const source = params.get("source") || "";
        const found = await getPublicCard(id, {
          source: source === "nfc" || source === "qr" ? source : "",
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
  }, [id, location.search]);

  if (!loaded) return null;

  if (!card) {
    return (
      <main className="public-profile public-profile--empty">
        <div className="ui-empty-state public-profile__not-found">
          <p className="ui-empty-state__title">Card not found</p>
          <p className="ui-empty-state__copy">
            This card is unavailable, inactive, or has been removed.
          </p>
          <a href="/" className="ui-button ui-button--primary public-profile__empty-action">
            Back to JOSTAP
          </a>
        </div>
      </main>
    );
  }

  const includePremium = hasPremiumFeatures(card.plan);
  const storedFields =
    Array.isArray(card.activeFields) && card.activeFields.length
      ? card.activeFields
      : Array.from(activeFieldsForCard(card, { includePremium }));
  const visibleFields = includePremium
    ? storedFields
    : storedFields.filter((field) => field !== "calendly" && field !== "videoUrl");
  if (card.exchangeContactEnabled !== false && !visibleFields.includes("exchangeContact")) {
    visibleFields.push("exchangeContact");
  }
  if (card.exchangeContactEnabled === false) {
    const index = visibleFields.indexOf("exchangeContact");
    if (index !== -1) visibleFields.splice(index, 1);
  }
  if (card.saveContactEnabled !== false && !visibleFields.includes("saveContact")) {
    visibleFields.push("saveContact");
  }
  if (card.saveContactEnabled === false) {
    const index = visibleFields.indexOf("saveContact");
    if (index !== -1) visibleFields.splice(index, 1);
  }
  const appointmentBookingEnabled = includePremium && visibleFields.includes("calendly");
  const brandColor = hasCustomBranding(card.plan) ? card.brandColor : "";
  const minDate = new Date(Date.now() + 60_000).toISOString().slice(0, 10);

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
      setBooking({
        visitorName: "",
        visitorEmail: "",
        visitorPhone: "",
        appointmentDate: "",
        appointmentTime: "",
        appointmentMessage: "",
      });
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

  const submitExchangeContact = async (contact) => {
    const response = await fetch("/api/leads/public", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...contact,
        cardId: card.id || card.slug,
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Unable to share contact.");
    }
    return data;
  };

  return (
    <main className="public-profile">
      <div className="public-profile__shell">
        <CardPhonePreview
          card={{
            ...card,
            brandColor,
            showGallery: includePremium && card.showGallery,
            galleryImages: includePremium ? card.galleryImages : [],
          }}
          activeFields={visibleFields}
          qrLocked={!includePremium}
          onSaveContact={async () => {
            await fetch(`/api/public/card/${card.id || card.slug}`, {
              method: "POST",
            }).catch(() => {});
          }}
          onExchangeContact={submitExchangeContact}
          trackSocialClicks
        />

        {appointmentBookingEnabled && (
          <section className="booking-panel" aria-labelledby="booking-title">
            <div className="booking-panel__header">
              <h2 id="booking-title">Book Appointment</h2>
            </div>

            <form onSubmit={submitBooking} className="booking-form">
              <input
                required
                placeholder="Your name"
                value={booking.visitorName}
                onChange={(event) => setBooking((current) => ({ ...current, visitorName: event.target.value }))}
              />
              <input
                required
                type="email"
                placeholder="Your email"
                value={booking.visitorEmail}
                onChange={(event) => setBooking((current) => ({ ...current, visitorEmail: event.target.value }))}
              />
              <input
                type="tel"
                placeholder="Your phone number"
                value={booking.visitorPhone}
                onChange={(event) => setBooking((current) => ({ ...current, visitorPhone: event.target.value }))}
              />
              <label>
                <span>Preferred date</span>
                <input
                  required
                  type="date"
                  min={minDate}
                  value={booking.appointmentDate}
                  onChange={(event) => setBooking((current) => ({ ...current, appointmentDate: event.target.value }))}
                />
              </label>
              <label>
                <span>Preferred time</span>
                <input
                  required
                  type="time"
                  value={booking.appointmentTime}
                  onChange={(event) => setBooking((current) => ({ ...current, appointmentTime: event.target.value }))}
                />
              </label>
              <textarea
                placeholder="Optional note"
                value={booking.appointmentMessage}
                onChange={(event) => setBooking((current) => ({ ...current, appointmentMessage: event.target.value }))}
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
