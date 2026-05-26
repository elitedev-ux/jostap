import sql from "../../utils/sql.js";
import { badRequest, json, readJson, unauthorized } from "../../utils/http.js";
import { cardFromRow, cardPayload } from "../../utils/cards.js";
import { getSessionUser } from "../../utils/session.js";

async function findCard(userId, id) {
  const [row] = await sql(
    `SELECT *
     FROM cards
     WHERE id = $1 AND user_id = $2
     LIMIT 1`,
    [id, userId],
  );

  return row || null;
}

export async function GET(request, { params }) {
  const user = await getSessionUser(request);

  if (!user) {
    return unauthorized();
  }

  const row = await findCard(user.id, params.id);

  if (!row) {
    return json({ error: "Card not found." }, { status: 404 });
  }

  return json({ card: cardFromRow(row) });
}

export async function PUT(request, { params }) {
  const user = await getSessionUser(request);

  if (!user) {
    return unauthorized();
  }

  const body = await readJson(request);

  if (!body) {
    return badRequest("Invalid request body.");
  }

  const existing = await findCard(user.id, params.id);

  if (!existing) {
    return json({ error: "Card not found." }, { status: 404 });
  }

  const card = cardPayload({ ...cardFromRow(existing), ...body });

  if (!card.name || !card.email || !card.slug) {
    return badRequest("Name, email, and public slug are required.");
  }

  try {
    const [row] = await sql(
      `UPDATE cards
       SET name = $1,
           title = $2,
           company = $3,
           slug = $4,
           bio = $5,
           email = $6,
           phone = $7,
           website = $8,
           theme = $9::jsonb,
           social_links = $10::jsonb,
           active = $11
       WHERE id = $12 AND user_id = $13
       RETURNING *`,
      [
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
        params.id,
        user.id,
      ],
    );

    return json({ card: cardFromRow(row) });
  } catch (error) {
    if (error.code === "23505") {
      return badRequest("This public slug is already in use.");
    }

    throw error;
  }
}

export async function DELETE(request, { params }) {
  const user = await getSessionUser(request);

  if (!user) {
    return unauthorized();
  }

  await sql("DELETE FROM cards WHERE id = $1 AND user_id = $2", [
    params.id,
    user.id,
  ]);

  return json({ ok: true });
}
