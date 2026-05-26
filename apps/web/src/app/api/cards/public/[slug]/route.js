import sql, { hasDatabase } from "../../../utils/sql.js";
import { cardFromRow } from "../../../utils/cards.js";
import { json } from "../../../utils/http.js";

export async function GET(_request, { params }) {
  if (!hasDatabase()) {
    return json({ error: "Card not found." }, { status: 404 });
  }

  const [row] = await sql(
    `SELECT *
     FROM cards
     WHERE slug = $1 AND active = true
     LIMIT 1`,
    [params.slug],
  );

  if (!row) {
    return json({ error: "Card not found." }, { status: 404 });
  }

  return json({ card: cardFromRow(row) });
}
