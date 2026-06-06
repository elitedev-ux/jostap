import { badRequest, json, readJson, unauthorized } from "../../../utils/http.js";
import { getSessionUser } from "../../../utils/session.js";
import { getSupabaseAdmin } from "../../../utils/supabase.js";
import { syncSupportTicketNotification } from "../../../utils/supportNotifications.js";

function boundedText(value, max) {
  return String(value || "").trim().slice(0, max);
}

async function loadOwnedTicket(supabase, userId, ticketId) {
  const { data, error } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("id", ticketId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function GET(request, { params }) {
  const user = await getSessionUser(request);
  if (!user) return unauthorized();

  const supabase = getSupabaseAdmin();
  const ticket = await loadOwnedTicket(supabase, user.id, params.id);
  if (!ticket) return unauthorized("Ticket not found.");

  const { data: messages, error } = await supabase
    .from("support_ticket_messages")
    .select("id,ticket_id,sender_role,message,created_at")
    .eq("ticket_id", ticket.id)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return json({ ticket, messages: messages || [] });
}

export async function POST(request, { params }) {
  const user = await getSessionUser(request);
  if (!user) return unauthorized();

  const body = await readJson(request);
  if (!body) return badRequest("Invalid request body.");

  const message = boundedText(body.message, 4000);
  if (!message) return badRequest("Message is required.");

  const supabase = getSupabaseAdmin();
  const ticket = await loadOwnedTicket(supabase, user.id, params.id);
  if (!ticket) return unauthorized("Ticket not found.");
  if (ticket.status === "closed") return badRequest("This ticket is closed.");

  const { data: row, error } = await supabase
    .from("support_ticket_messages")
    .insert({
      ticket_id: ticket.id,
      sender_user_id: user.id,
      sender_role: "user",
      message,
    })
    .select("*")
    .single();

  if (error) throw error;

  const nextStatus = ticket.status === "resolved" ? "pending" : ticket.status;
  await supabase
    .from("support_tickets")
    .update({
      status: nextStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", ticket.id);

  await syncSupportTicketNotification(supabase, { ...ticket, status: nextStatus }, user.email);

  return json({ message: row }, { status: 201 });
}
