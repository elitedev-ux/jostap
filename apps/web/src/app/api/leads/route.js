import sql from "../utils/sql.js";
import { json, unauthorized } from "../utils/http.js";
import { getSessionUser } from "../utils/session.js";

function leadFromRow(row) {
  return {
    id: row.id,
    name: row.name || "",
    email: row.email || "",
    phone: row.phone || "",
    company: row.company || "",
    message: row.message || "",
    source: row.source || "",
    status: row.status || "new",
    cardName: row.card_name || "",
    createdAt: row.created_at || "",
  };
}

export async function GET(request) {
  const user = await getSessionUser(request);

  if (!user) {
    return unauthorized();
  }

  const rows = await sql(
    `SELECT leads.*, cards.name AS card_name
     FROM leads
     LEFT JOIN cards ON cards.id = leads.card_id
     WHERE leads.user_id = $1
     ORDER BY leads.created_at DESC`,
    [user.id],
  );

  return json({ leads: rows.map(leadFromRow) });
}
