import { badRequest, json, readJson } from "../../utils/http.js";
import { isEmail } from "../../utils/cards.js";
import { rateLimit, rateLimitKey } from "../../utils/rateLimit.js";
import { getSupabaseAdmin } from "../../utils/supabase.js";
import { syncSupportTicketNotification } from "../../utils/supportNotifications.js";

function boundedText(value, max) {
  return String(value || "").trim().slice(0, max);
}

export async function POST(request) {
  const body = await readJson(request);
  if (!body) return badRequest("Invalid request body.");

  const name = boundedText(body.name, 140);
  const email = boundedText(body.email, 254).toLowerCase();
  const subject = boundedText(body.subject, 180);
  const message = boundedText(body.message, 4000);
  const category = boundedText(body.category || "General", 80) || "General";
  const priority = ["low", "normal", "high", "urgent"].includes(body.priority)
    ? body.priority
    : "normal";

  if (!name || !email || !subject || !message) {
    return badRequest("Name, email, subject, and message are required.");
  }

  if (!isEmail(email)) {
    return badRequest("Enter a valid email address.");
  }

  const limited = rateLimit(request, {
    key: rateLimitKey(request, "public-support", [email]),
    limit: 3,
    windowMs: 10 * 60 * 1000,
  });
  if (limited) return limited;

  const supabase = getSupabaseAdmin();
  const { data: ticket, error: ticketError } = await supabase
    .from("support_tickets")
    .insert({
      user_id: null,
      guest_name: name,
      guest_email: email,
      subject,
      message,
      category,
      priority,
    })
    .select("*")
    .single();

  if (ticketError) throw ticketError;

  await supabase.from("support_ticket_messages").insert({
    ticket_id: ticket.id,
    sender_user_id: null,
    sender_role: "user",
    message,
  });

  await syncSupportTicketNotification(supabase, ticket, email);

  return json({ ticket }, { status: 201 });
}
