import { createHash, randomBytes } from "node:crypto";
import sql from "./sql.js";

export const SESSION_COOKIE = "jostap_session";
const SESSION_DAYS = 30;

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function parseCookie(header) {
  return Object.fromEntries(
    (header || "")
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        return index === -1
          ? [part, ""]
          : [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
      }),
  );
}

function cookieFlags(request) {
  const secure =
    process.env.NODE_ENV === "production" || request.url.startsWith("https://");

  return [
    "HttpOnly",
    "Path=/",
    "SameSite=Lax",
    secure ? "Secure" : "",
  ].filter(Boolean);
}

export async function createSession(userId, request) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await sql(
    `INSERT INTO sessions (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt.toISOString()],
  );

  return {
    token,
    cookie: [
      `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
      `Max-Age=${SESSION_DAYS * 24 * 60 * 60}`,
      ...cookieFlags(request),
    ].join("; "),
  };
}

export function clearSessionCookie(request) {
  return [
    `${SESSION_COOKIE}=`,
    "Max-Age=0",
    ...cookieFlags(request),
  ].join("; ");
}

export async function destroySession(request) {
  const token = parseCookie(request.headers.get("Cookie"))[SESSION_COOKIE];

  if (token) {
    await sql("DELETE FROM sessions WHERE token_hash = $1", [hashToken(token)]);
  }
}

export async function getSessionUser(request) {
  const token = parseCookie(request.headers.get("Cookie"))[SESSION_COOKIE];

  if (!token) {
    return null;
  }

  const [user] = await sql(
    `SELECT
       users.id,
       users.first_name,
       users.last_name,
       users.company,
       users.email,
       users.role,
       users.created_at
     FROM sessions
     JOIN users ON users.id = sessions.user_id
     WHERE sessions.token_hash = $1
       AND sessions.expires_at > now()
     LIMIT 1`,
    [hashToken(token)],
  );

  return user || null;
}
