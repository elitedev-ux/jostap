import sql, { hasDatabase } from "../../utils/sql.js";
import { badRequest, json, readJson } from "../../utils/http.js";
import { createSession } from "../../utils/session.js";
import { hashPassword, validatePassword } from "../../utils/password.js";

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

  const firstName = String(body.firstName || "").trim();
  const lastName = String(body.lastName || "").trim();
  const company = String(body.company || "").trim() || null;
  const email = normalizeEmail(body.email);
  const password = String(body.password || "");

  if (!firstName || !lastName || !email || !password) {
    return badRequest("First name, last name, email, and password are required.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return badRequest("Enter a valid email address.");
  }

  if (!validatePassword(password)) {
    return badRequest(
      "Password must be at least 8 characters and include 1 capital letter, 1 number, and 1 symbol.",
    );
  }

  const passwordHash = await hashPassword(password);

  try {
    const [user] = await sql(
      `INSERT INTO users (first_name, last_name, company, email, password_hash)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, first_name, last_name, company, email, role, created_at`,
      [firstName, lastName, company, email, passwordHash],
    );

    const session = await createSession(user.id, request);

    return json(
      { user },
      {
        status: 201,
        headers: {
          "Set-Cookie": session.cookie,
        },
      },
    );
  } catch (error) {
    if (error.code === "23505") {
      return badRequest("An account with this email already exists.");
    }

    throw error;
  }
}
