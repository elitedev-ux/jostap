import sql from "../../../utils/sql.js";
import { json, unauthorized } from "../../../utils/http.js";
import { cardFromRow } from "../../../utils/cards.js";
import { getSessionUser } from "../../../utils/session.js";

export async function POST(request, { params }) {
  const user = await getSessionUser(request);

  if (!user) {
    return unauthorized();
  }

  const [source] = await sql(
    `SELECT *
     FROM cards
     WHERE id = $1 AND user_id = $2
     LIMIT 1`,
    [params.id, user.id],
  );

  if (!source) {
    return json({ error: "Card not found." }, { status: 404 });
  }

  const [row] = await sql(
    `INSERT INTO cards (
       user_id, name, title, company, slug, bio, email, phone, website,
       theme, social_links, active
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::jsonb, $12)
     RETURNING *`,
    [
      user.id,
      `${source.name} Copy`,
      source.title,
      source.company,
      `${source.slug}-copy-${Date.now().toString().slice(-4)}`,
      source.bio,
      source.email,
      source.phone,
      source.website,
      JSON.stringify(source.theme || {}),
      JSON.stringify(source.social_links || {}),
      source.active,
    ],
  );

  return json({ card: cardFromRow(row) }, { status: 201 });
}
