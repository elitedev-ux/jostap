import { badRequest, json, readJson, unauthorized } from "../utils/http.js";
import { paginationFromRequest, paginationMeta } from "../utils/pagination.js";
import { getSessionUser } from "../utils/session.js";
import { getSupabaseAdmin } from "../utils/supabase.js";
import { syncSupportTicketNotification } from "../utils/supportNotifications.js";

function boundedText(value, max) {
  return String(value || "").trim().slice(0, max);
}

export async function GET(request) {
  const user = await getSessionUser(request);

  if (!user) return unauthorized();

  const supabase = getSupabaseAdmin();
  const { limit, offset } = paginationFromRequest(request);
  const { data: tickets, error, count } = await supabase
    .from("support_tickets")
    .select("id,user_id,subject,message,category,priority,status,admin_notes,created_at,updated_at", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  const ticketIds = (tickets || []).map((ticket) => ticket.id);
  if (!ticketIds.length) {
    return json({
      tickets: [],
      pagination: paginationMeta({ limit, offset, total: count }),
    });
  }

  const { data: messages, error: messagesError } = await supabase
      .from("support_ticket_messages")
      .select("id,ticket_id,sender_role,message,created_at")
      .in("ticket_id", ticketIds)
      .order("created_at", { ascending: true });

  if (messagesError) throw messagesError;

  const messagesByTicket = (messages || []).reduce((map, message) => {
    const row = map.get(message.ticket_id) || [];
    row.push(message);
    map.set(message.ticket_id, row);
    return map;
  }, new Map());

  return json({
    tickets: (tickets || []).map((ticket) => ({
      ...ticket,
      messages: messagesByTicket.get(ticket.id) || [],
    })),
    pagination: paginationMeta({ limit, offset, total: count }),
  });
}

export async function POST(request) {
  const user = await getSessionUser(request);

  if (!user) return unauthorized();

  const body = await readJson(request);

  if (!body) return badRequest("Invalid request body.");

  const subject = boundedText(body.subject, 180);
  const message = boundedText(body.message, 4000);
  const category = boundedText(body.category || "General", 80) || "General";
  const priority = ["low", "normal", "high", "urgent"].includes(body.priority)
    ? body.priority
    : "normal";

  if (!subject || !message) {
    return badRequest("Subject and message are required.");
  }

  const supabase = getSupabaseAdmin();
  const { data: ticket, error: ticketError } = await supabase
    .from("support_tickets")
    .insert({
      user_id: user.id,
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
    sender_user_id: user.id,
    sender_role: "user",
    message,
  });

  await syncSupportTicketNotification(supabase, ticket, user.email);

  return json({ ticket }, { status: 201 });
}
