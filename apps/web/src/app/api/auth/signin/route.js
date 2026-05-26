import sql, { hasDatabase } from "../../utils/sql.js";
import { badRequest, json, readJson, unauthorized } from "../../utils/http.js";
import { createSession } from "../../utils/session.js";
import { verifyPassword } from "../../utils/password.js";

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export async function POST(request) {
  if (!hasDatabase()) {
    return json(
      { error: "Database is not configured. Add DATABASE_URL to .env." },
      { status: 503 },
    );
  }

  const body = await readJson(request);

  if (!body) {
    return badRequest("Invalid request body.");
  }

  const email = normalizeEmail(body.email);
  const password = String(body.password || "");

  if (!email || !password) {
    return badRequest("Email and password are required.");
  }

  const [record] = await sql(
    `SELECT id, first_name, last_name, company, email, role, password_hash, created_at
     FROM users
     WHERE lower(email) = lower($1)
     LIMIT 1`,
    [email],
  );

  if (!record || !(await verifyPassword(record.password_hash, password))) {
    return unauthorized("Invalid email or password.");
  }

  const { password_hash: _passwordHash, ...user } = record;
  const session = await createSession(user.id, request);

  return json(
    { user },
    {
      headers: {
        "Set-Cookie": session.cookie,
      },
    },
  );
}
