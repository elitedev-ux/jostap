import { badRequest, json, readJson } from "../../../utils/http.js";
import { requireAdmin, logAdminAction } from "../../../utils/admin.js";
import { getSupabaseAdmin } from "../../../utils/supabase.js";

function boundedText(value, max) {
  return String(value || "").trim().slice(0, max);
}

export async function GET(request, { params }) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  const supabase = getSupabaseAdmin();
  const [{ data: ticket, error }, { data: messages, error: messagesError }] = await Promise.all([
    supabase
      .from("support_tickets")
      .select("*, users(first_name,last_name,email)")
      .eq("id", params.id)
      .maybeSingle(),
    supabase
      .from("support_ticket_messages")
      .select("id,ticket_id,sender_user_id,sender_role,message,created_at,users(first_name,last_name,email)")
      .eq("ticket_id", params.id)
      .order("created_at", { ascending: true }),
  ]);

  if (error || messagesError) throw error || messagesError;
  if (!ticket) return json({ error: "Ticket not found." }, { status: 404 });

  return json({
    ticket: {
      ...ticket,
      account:
        [ticket.users?.first_name, ticket.users?.last_name].filter(Boolean).join(" ").trim() ||
        ticket.users?.email ||
        "Unknown",
    },
    messages:
      (messages || []).map((row) => ({
        ...row,
        sender:
          [row.users?.first_name, row.users?.last_name].filter(Boolean).join(" ").trim() ||
          row.users?.email ||
          row.sender_role,
      })) || [],
  });
}

export async function PATCH(request, { params }) {
  const { user: adminUser, response } = await requireAdmin(request);

  if (response) return response;

  const body = await readJson(request);
  if (!body) return badRequest("Invalid request body.");

  const updates = {};

  if (["open", "pending", "resolved", "closed"].includes(body.status)) {
    updates.status = body.status;
  }

  if (Object.prototype.hasOwnProperty.call(body, "admin_notes")) {
    updates.admin_notes = boundedText(body.admin_notes, 4000);
  }

  if (!Object.keys(updates).length) {
    return badRequest("No valid updates provided.");
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("support_tickets")
    .update(updates)
    .eq("id", params.id)
    .select("*")
    .single();

  if (error) throw error;

  if (updates.status) {
    await supabase.from("support_ticket_messages").insert({
      ticket_id: params.id,
      sender_user_id: adminUser.id,
      sender_role: "system",
      message: `Status updated to "${updates.status}".`,
    });
  }

  await logAdminAction(supabase, adminUser, "support.updated", "support_ticket", params.id, updates);

  return json({ ticket: data });
}
