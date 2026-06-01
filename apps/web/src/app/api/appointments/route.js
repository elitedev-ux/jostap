import { json, unauthorized } from "../utils/http.js";
import { getSessionUser } from "../utils/session.js";
import { getSupabaseAdmin } from "../utils/supabase.js";

function appointmentFromRow(row) {
  return {
    id: row.id,
    guestName: row.guest_name || "",
    guestEmail: row.guest_email || "",
    cardName: row.cards?.name || row.card_name || "",
    startsAt: row.starts_at || "",
    endsAt: row.ends_at || "",
    status: row.status || "scheduled",
    googleEventId: row.google_event_id || "",
    notes: row.notes || "",
    createdAt: row.created_at || "",
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
    .eq("user_id", user.id)
    .order("starts_at", { ascending: true });

  if (error) {
    throw error;
  }

  return json({ appointments: (rows || []).map(appointmentFromRow) });
}
