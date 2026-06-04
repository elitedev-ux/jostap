import { badRequest, json, readJson } from "../../../utils/http.js";
import { activePlanForUser, isEmail, planCapabilities } from "../../../utils/cards.js";
import { getSupabaseAdmin, hasSupabase } from "../../../utils/supabase.js";
import { sendAppointmentCreatedEmail } from "../../../utils/appointmentEmails.js";

function toIso(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function truncate(value, max) {
  return String(value || "").trim().slice(0, max);
}

function dateTimeFromBody(body) {
  if (body.startsAt) return toIso(body.startsAt);

  const date = truncate(body.appointmentDate, 20);
  const time = truncate(body.appointmentTime, 20);
  if (!date || !time) return "";

  return toIso(`${date}T${time}`);
}

export async function POST(request, { params }) {
  if (!hasSupabase()) {
    return badRequest("Booking is not available right now.");
  }

  const body = await readJson(request);
  if (!body) return badRequest("Invalid request body.");

  const visitorName = truncate(body.visitorName || body.guestName, 120);
  const visitorEmail = truncate(body.visitorEmail || body.guestEmail, 254).toLowerCase();
  const visitorPhone = truncate(body.visitorPhone, 60);
  const appointmentDate = truncate(body.appointmentDate, 20);
  const appointmentTime = truncate(body.appointmentTime, 20);
  const startsAt = dateTimeFromBody(body);
  const appointmentMessage = truncate(body.appointmentMessage || body.notes, 2000);

  if (!visitorName || !visitorEmail || !startsAt) {
    return badRequest("Name, email, and appointment date/time are required.");
  }

  if (!isEmail(visitorEmail)) {
    return badRequest("Enter a valid email address.");
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

  const plan = await activePlanForUser(supabase, card.user_id);
  if (!planCapabilities(plan).hasPremiumFeatures) {
    return badRequest("Appointment booking is available during trial or on a premium plan.");
  }

  const { data, error } = await supabase
    .from("appointments")
    .insert({
      assigned_user_id: card.user_id,
      card_id: card.id,
      guest_name: visitorName,
      guest_email: visitorEmail,
      visitor_name: visitorName,
      visitor_email: visitorEmail,
      visitor_phone: visitorPhone || null,
      appointment_date: appointmentDate || start.toISOString().slice(0, 10),
      appointment_time: appointmentTime || start.toISOString().slice(11, 16),
      appointment_message: appointmentMessage || null,
      starts_at: startsAt,
      ends_at: endsAt,
      status: "pending",
      notes: appointmentMessage || null,
    })
    .select("id,visitor_name,visitor_email,visitor_phone,appointment_date,appointment_time,appointment_message,starts_at,ends_at,status,created_at")
    .single();

  if (error) throw error;

  await supabase.from("announcements").insert({
    target_user_id: card.user_id,
    title: "New appointment request",
    message: `${visitorName} requested an appointment for ${data.appointment_date || appointmentDate} at ${data.appointment_time || appointmentTime}.`,
    type: "info",
    audience: "users",
    status: "published",
    published_at: new Date().toISOString(),
  });

  await sendAppointmentCreatedEmail({ appointment: data, cardName: card.name });

  return json(
    {
      booking: {
        id: data.id,
        visitorName: data.visitor_name,
        visitorEmail: data.visitor_email,
        visitorPhone: data.visitor_phone || "",
        appointmentDate: data.appointment_date,
        appointmentTime: data.appointment_time,
        appointmentMessage: data.appointment_message || "",
        startsAt: data.starts_at,
        endsAt: data.ends_at,
        status: data.status,
      },
    },
    { status: 201 },
  );
}
