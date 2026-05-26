import sql from "../utils/sql.js";
import { json, unauthorized } from "../utils/http.js";
import { getSessionUser } from "../utils/session.js";

function appointmentFromRow(row) {
  return {
    id: row.id,
    guestName: row.guest_name || "",
    guestEmail: row.guest_email || "",
    cardName: row.card_name || "",
    startsAt: row.starts_at || "",
    endsAt: row.ends_at || "",
    status: row.status || "scheduled",
    notes: row.notes || "",
    createdAt: row.created_at || "",
  };
}

export async function GET(request) {
  const user = await getSessionUser(request);

  if (!user) {
    return unauthorized();
  }

  const rows = await sql(
    `SELECT appointments.*, cards.name AS card_name
     FROM appointments
     LEFT JOIN cards ON cards.id = appointments.card_id
     WHERE appointments.user_id = $1
     ORDER BY appointments.starts_at ASC`,
    [user.id],
  );

  return json({ appointments: rows.map(appointmentFromRow) });
}
