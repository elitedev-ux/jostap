export function notificationTypeForSupportTicket(ticket) {
  return ticket?.priority === "urgent" || ticket?.priority === "high" ? "warning" : "info";
}

export function supportTicketNotificationPayload(ticket, contactLabel = "A user") {
  const subject = String(ticket?.subject || "Support ticket").trim();

  return {
    title: ticket?.status === "closed" ? "Support ticket closed" : "Support ticket requires attention",
    message: `${contactLabel} submitted: ${subject}`,
    type: notificationTypeForSupportTicket(ticket),
    source: "support_ticket",
    source_id: ticket.id,
    is_read: ticket?.status === "closed",
  };
}

export async function syncSupportTicketNotification(supabase, ticket, contactLabel = "A user") {
  if (!ticket?.id) return;

  const payload = supportTicketNotificationPayload(ticket, contactLabel);
  const { data, error } = await supabase
    .from("admin_notifications")
    .update(payload)
    .eq("source", "support_ticket")
    .eq("source_id", ticket.id)
    .select("id");

  if (error) {
    if (!/source|source_id|schema cache|column/i.test(error.message || "")) {
      throw error;
    }
    return;
  }

  if (data?.length) return;

  const { error: insertError } = await supabase.from("admin_notifications").insert(payload);
  if (insertError) {
    if (!/source|source_id|schema cache|column/i.test(insertError.message || "")) {
      throw insertError;
    }
  }
}
