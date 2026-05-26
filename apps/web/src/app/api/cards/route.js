import sql from "../utils/sql.js";
import { badRequest, json, readJson, unauthorized } from "../utils/http.js";
import { cardFromRow, cardPayload } from "../utils/cards.js";
import { getSessionUser } from "../utils/session.js";

export async function GET(request) {
  const user = await getSessionUser(request);

  if (!user) {
    return unauthorized();
  }

  const rows = await sql(
    `SELECT *
     FROM cards
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [user.id],
  );

  return json({ cards: rows.map(cardFromRow) });
}

export async function POST(request) {
  const user = await getSessionUser(request);

  if (!user) {
    return unauthorized();
  }

  const body = await readJson(request);

  if (!body) {
    return badRequest("Invalid request body.");
  }

  const card = cardPayload(body);

  if (!card.name || !card.email || !card.slug) {
    return badRequest("Name, email, and public slug are required.");
  }

  try {
    const [row] = await sql(
      `INSERT INTO cards (
         user_id, name, title, company, slug, bio, email, phone, website,
         theme, social_links, active
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::jsonb, $12)
       RETURNING *`,
      [
        user.id,
        card.name,
        card.title,
        card.company,
        card.slug,
        card.bio,
        card.email,
        card.phone,
        card.website,
        JSON.stringify(card.theme),
        JSON.stringify(card.socialLinks),
        card.active,
      ],
    );

    return json({ card: cardFromRow(row) }, { status: 201 });
  } catch (error) {
    if (error.code === "23505") {
      return badRequest("This public slug is already in use.");
    }

    throw error;
  }
}
