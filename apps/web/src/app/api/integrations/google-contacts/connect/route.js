import { json, unauthorized } from "../../../utils/http.js";
import { getSessionUser } from "../../../utils/session.js";

export async function GET(request) {
  const user = await getSessionUser(request);

  if (!user) return unauthorized();

  return json({ error: "Google Contacts sync is coming soon." }, { status: 503 });
}
