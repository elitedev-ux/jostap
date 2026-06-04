import { brandedEmailHtml, sendEmail } from "./email.js";

function clean(value) {
  return String(value || "").trim();
}

function escapeHtml(value) {
  return clean(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function appointmentDateTime(appointment) {
  const date = clean(appointment.appointment_date || appointment.appointmentDate);
  const time = clean(appointment.appointment_time || appointment.appointmentTime);
  if (date || time) return [date, time].filter(Boolean).join(" at ");

  const startsAt = appointment.starts_at || appointment.startsAt;
  if (!startsAt) return "";

  try {
    return new Date(startsAt).toLocaleString("en", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return clean(startsAt);
  }
}

async function sendAppointmentEmail(message) {
  const to = clean(message.to);
  if (!to) return;

  try {
    await sendEmail({ ...message, to });
  } catch (error) {
    console.error("[appointment-email]", {
      event: message.event,
      to,
      error: error?.message || String(error),
    });
  }
}

export async function sendAppointmentCreatedEmail({ appointment, cardName }) {
  const when = appointmentDateTime(appointment);
  const visitorName = clean(appointment.visitor_name || appointment.guest_name || "there");
  const card = clean(cardName) || "this JOSTAP profile";
  const htmlVisitorName = escapeHtml(visitorName);
  const htmlCard = escapeHtml(card);
  const htmlWhen = escapeHtml(when);

  return sendAppointmentEmail({
    event: "appointment_created",
    idempotencyKey: `appointment:${appointment.id}:created`,
    to: appointment.visitor_email || appointment.guest_email,
    subject: "Your appointment request was received",
    text: `Hi ${visitorName}, your appointment request for ${card}${when ? ` on ${when}` : ""} has been received. You will get another email when it is approved or rejected.`,
    html: brandedEmailHtml({
      title: "Appointment request received",
      eyebrow: "Booking",
      preheader: `Your appointment request for ${card} has been received.`,
      body: `
        <p style="margin:0 0 14px;">Hi ${htmlVisitorName},</p>
        <p style="margin:0 0 14px;">Your appointment request for <strong>${htmlCard}</strong>${htmlWhen ? ` on <strong>${htmlWhen}</strong>` : ""} has been received.</p>
        <p style="margin:0;">You will get another email when it is approved or rejected.</p>
      `,
    }),
  });
}

export async function sendAppointmentStatusEmail({ appointment, status }) {
  const normalized = clean(status).toLowerCase();
  if (normalized !== "approved" && normalized !== "rejected") return;

  const when = appointmentDateTime(appointment);
  const visitorName = clean(appointment.visitor_name || appointment.guest_name || "there");
  const approved = normalized === "approved";
  const subject = approved ? "Your appointment was approved" : "Your appointment was rejected";
  const statusText = approved ? "approved" : "rejected";
  const htmlVisitorName = escapeHtml(visitorName);
  const htmlWhen = escapeHtml(when);

  return sendAppointmentEmail({
    event: `appointment_${normalized}`,
    idempotencyKey: `appointment:${appointment.id}:status:${normalized}`,
    to: appointment.visitor_email || appointment.guest_email,
    subject,
    text: `Hi ${visitorName}, your appointment request${when ? ` for ${when}` : ""} has been ${statusText}.`,
    html: brandedEmailHtml({
      title: subject,
      eyebrow: "Booking update",
      preheader: `Your appointment request has been ${statusText}.`,
      body: `
        <p style="margin:0 0 14px;">Hi ${htmlVisitorName},</p>
        <p style="margin:0;">Your appointment request${htmlWhen ? ` for <strong>${htmlWhen}</strong>` : ""} has been <strong>${statusText}</strong>.</p>
      `,
    }),
  });
}
