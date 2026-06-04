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

function paginationFromRequest(request, defaultLimit = 10) {
  const params = new URL(request.url).searchParams;
  const limit = Math.min(Math.max(Number.parseInt(params.get("limit") || `${defaultLimit}`, 10) || defaultLimit, 1), 50);
  const offset = Math.max(Number.parseInt(params.get("offset") || "0", 10) || 0, 0);

  return { limit, offset };
}

export async function GET(request) {
  const user = await getSessionUser(request);

  if (!user) {
    return unauthorized();
  }

  const supabase = getSupabaseAdmin();
  const { limit, offset } = paginationFromRequest(request);
  const status = String(new URL(request.url).searchParams.get("status") || "").trim().toLowerCase();
  let query = supabase
    .from("appointments")
    .select("id,card_id,visitor_name,visitor_email,visitor_phone,guest_name,guest_email,appointment_date,appointment_time,appointment_message,starts_at,ends_at,status,notes,created_at,updated_at,cards(name)", { count: "exact" })
    .eq("assigned_user_id", user.id)
    .order("starts_at", { ascending: true });

  if (["pending", "approved", "rejected", "cancelled", "completed"].includes(status)) {
    query = query.eq("status", status);
  }

  const [
    { data: rows, error, count },
    { data: statusRows, error: statusError },
  ] = await Promise.all([
    query.range(offset, offset + limit - 1),
    supabase.from("appointments").select("status").eq("assigned_user_id", user.id),
  ]);

  if (error || statusError) {
    throw error || statusError;
  }

  const counts = (statusRows || []).reduce(
    (items, appointment) => {
      const value = appointment.status || "pending";
      items.total += 1;
      items[value] = (items[value] || 0) + 1;
      return items;
    },
    { total: 0, pending: 0, approved: 0, rejected: 0, cancelled: 0, completed: 0 },
  );

  return json({
    appointments: (rows || []).map(appointmentFromRow),
    counts,
    pagination: {
      limit,
      offset,
      total: count || 0,
      hasMore: offset + limit < Number(count || 0),
    },
  });
}
