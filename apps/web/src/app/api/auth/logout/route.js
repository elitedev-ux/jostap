import { json } from "../../utils/http.js";
import { clearSessionCookie, destroySession } from "../../utils/session.js";

export async function POST(request) {
  await destroySession(request);

  return json(
    { ok: true },
    {
      headers: {
        "Set-Cookie": clearSessionCookie(request),
      },
    },
  );
}
