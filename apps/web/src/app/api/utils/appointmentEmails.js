import { sendEmail } from "./email.js";

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

function shell({ title, body }) {
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
      <h2 style="margin:0 0 12px">${title}</h2>
      ${body}
      <p style="margin-top:22px;color:#6b7280;font-size:13px">JOSTAP</p>
    </div>
  `;
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
    html: shell({
      title: "Appointment request received",
      body: `
        <p>Hi ${htmlVisitorName},</p>
        <p>Your appointment request for <strong>${htmlCard}</strong>${htmlWhen ? ` on <strong>${htmlWhen}</strong>` : ""} has been received.</p>
        <p>You will get another email when it is approved or rejected.</p>
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
    html: shell({
      title: subject,
      body: `
        <p>Hi ${htmlVisitorName},</p>
        <p>Your appointment request${htmlWhen ? ` for <strong>${htmlWhen}</strong>` : ""} has been <strong>${statusText}</strong>.</p>
      `,
    }),
  });
}
