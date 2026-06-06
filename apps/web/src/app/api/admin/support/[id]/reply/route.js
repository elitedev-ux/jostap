import { badRequest, json, readJson } from "../../../../utils/http.js";
import { requireAdmin, logAdminAction } from "../../../../utils/admin.js";
import { getSupabaseAdmin } from "../../../../utils/supabase.js";
import { syncSupportTicketNotification } from "../../../../utils/supportNotifications.js";

function boundedText(value, max) {
  return String(value || "").trim().slice(0, max);
}

function contactForTicket(ticket) {
  return (
    [ticket.users?.first_name, ticket.users?.last_name].filter(Boolean).join(" ").trim() ||
    ticket.guest_name ||
    ticket.users?.email ||
    ticket.guest_email ||
    "A user"
  );
}

export async function POST(request, { params }) {
  const { user: adminUser, response } = await requireAdmin(request, "support:manage");
  if (response) return response;

  const body = await readJson(request);
  if (!body) return badRequest("Invalid request body.");

  const message = boundedText(body.message, 4000);
  const status = ["open", "pending", "resolved", "closed"].includes(body.status)
    ? body.status
    : null;

  if (!message) return badRequest("Reply message is required.");

  const supabase = getSupabaseAdmin();
  const { data: ticket, error: ticketError } = await supabase
    .from("support_tickets")
    .select("*, users(first_name,last_name,email)")
    .eq("id", params.id)
    .maybeSingle();

  if (ticketError) throw ticketError;
  if (!ticket) return json({ error: "Ticket not found." }, { status: 404 });

  const { data: row, error } = await supabase
    .from("support_ticket_messages")
    .insert({
      ticket_id: ticket.id,
      sender_user_id: adminUser.id,
      sender_role: "admin",
      message,
    })
    .select("*")
    .single();

  if (error) throw error;

  const nextStatus = status || (ticket.status === "open" ? "pending" : ticket.status);
  if (nextStatus !== ticket.status) {
    await supabase.from("support_tickets").update({ status: nextStatus }).eq("id", ticket.id);
  }

  await syncSupportTicketNotification(supabase, { ...ticket, status: nextStatus }, contactForTicket(ticket));

  await logAdminAction(supabase, adminUser, "support.reply", "support_ticket", params.id, {
    status: nextStatus,
  });

  return json({ message: row, status: nextStatus }, { status: 201 });
}
