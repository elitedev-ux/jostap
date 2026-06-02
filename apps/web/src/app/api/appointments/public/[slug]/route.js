import { badRequest, json, readJson } from "../../../utils/http.js";
import { getSupabaseAdmin, hasSupabase } from "../../../utils/supabase.js";
import {
  createGoogleCalendarEvent,
  getValidGoogleAccessToken,
  hasGoogleCalendarConfig,
} from "../../../utils/googleCalendar.js";

function toIso(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

export async function POST(request, { params }) {
  if (!hasSupabase()) {
    return badRequest("Booking is not available right now.");
  }

  const body = await readJson(request);
  if (!body) return badRequest("Invalid request body.");

  const guestName = String(body.guestName || "").trim();
  const guestEmail = String(body.guestEmail || "").trim().toLowerCase();
  const startsAt = toIso(body.startsAt);
  const notes = String(body.notes || "").trim();

  if (!guestName || !guestEmail || !startsAt) {
    return badRequest("Name, email, and date/time are required.");
  }

  const start = new Date(startsAt);
  if (Number.isNaN(start.getTime()) || start.getTime() < Date.now() - 60_000) {
    return badRequest("Please choose a valid future date/time.");
  }

  const endsAt = new Date(start.getTime() + 30 * 60 * 1000).toISOString();

  const supabase = getSupabaseAdmin();
  const { data: card, error: cardError } = await supabase
    .from("cards")
    .select("id,user_id,name,slug,active")
    .eq("slug", params.slug)
    .eq("active", true)
    .maybeSingle();

  if (cardError) throw cardError;
  if (!card) return json({ error: "Card not found." }, { status: 404 });
  if (!card.user_id) {
    return badRequest("Appointment booking is not available for this card yet.");
  }

  const { data, error } = await supabase
    .from("appointments")
    .insert({
      user_id: card.user_id,
      card_id: card.id,
      guest_name: guestName,
      guest_email: guestEmail,
      starts_at: startsAt,
      ends_at: endsAt,
      status: "scheduled",
      notes: notes || null,
    })
    .select("id,guest_name,guest_email,starts_at,ends_at,status,created_at,google_event_id")
    .single();

  if (error) throw error;

  if (hasGoogleCalendarConfig()) {
    try {
      const tokenResult = await getValidGoogleAccessToken({
        supabase,
        userId: card.user_id,
        request,
      });

      if (tokenResult?.accessToken) {
        const event = await createGoogleCalendarEvent({
          accessToken: tokenResult.accessToken,
          summary: `JOSTAP Appointment: ${guestName}`,
          description: [
            `Booked via jostap.com/${card.slug}`,
            `Guest: ${guestName}`,
            guestEmail ? `Email: ${guestEmail}` : "",
            notes ? `Note: ${notes}` : "",
          ].filter(Boolean).join("\n"),
          startsAt,
          endsAt,
          attendeeEmail: guestEmail || null,
        });

        if (event?.id) {
          await supabase
            .from("appointments")
            .update({ google_event_id: event.id })
            .eq("id", data.id);
          data.google_event_id = event.id;
        }
      }
    } catch {
      // Booking should still succeed even if calendar sync fails.
    }
  }

  return json(
    {
      booking: {
        id: data.id,
        guestName: data.guest_name,
        guestEmail: data.guest_email,
        startsAt: data.starts_at,
        endsAt: data.ends_at,
        status: data.status,
        googleEventId: data.google_event_id || "",
      },
    },
    { status: 201 },
  );
}
