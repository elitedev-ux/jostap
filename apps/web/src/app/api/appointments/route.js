import { json, unauthorized } from "../utils/http.js";
import { getSessionUser } from "../utils/session.js";
import { getSupabaseAdmin } from "../utils/supabase.js";

function appointmentFromRow(row) {
  return {
    id: row.id,
    visitorName: row.visitor_name || row.guest_name || "",
    visitorEmail: row.visitor_email || row.guest_email || "",
    visitorPhone: row.visitor_phone || "",
    guestName: row.visitor_name || row.guest_name || "",
    guestEmail: row.visitor_email || row.guest_email || "",
    cardName: row.cards?.name || row.card_name || "",
    cardId: row.card_id || "",
    appointmentDate: row.appointment_date || "",
    appointmentTime: row.appointment_time || "",
    appointmentMessage: row.appointment_message || row.notes || "",
    startsAt: row.starts_at || "",
    endsAt: row.ends_at || "",
    status: row.status || "pending",
    notes: row.notes || "",
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || "",
  };
}

export async function GET(request) {
  const user = await getSessionUser(request);

  if (!user) {
    return unauthorized();
  }

  const supabase = getSupabaseAdmin();
  const { data: rows, error } = await supabase
    .from("appointments")
    .select("*, cards(name)")
    .eq("assigned_user_id", user.id)
    .order("starts_at", { ascending: true });

  if (error) {
    throw error;
  }

  return json({ appointments: (rows || []).map(appointmentFromRow) });
}
