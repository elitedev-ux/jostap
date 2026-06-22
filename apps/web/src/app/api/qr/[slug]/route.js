import { getSupabaseAdmin, hasSupabase } from "../../utils/supabase.js";
import { recordCardEngagement } from "../../utils/engagement.js";
import { rateLimit, rateLimitKey } from "../../utils/rateLimit.js";
import { absolutePublicUrl, publicCardPath } from "../../../../utils/publicUrl.js";

function redirectTo(path, request, status = 302) {
  return Response.redirect(absolutePublicUrl(path, { request }), status);
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export async function GET(request, { params }) {
  const token = String(params.slug || "").trim();

  if (!token || !hasSupabase()) {
    return redirectTo("/?card=not-found", request);
  }

  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("cards")
    .select("id,user_id,slug,active,qr_scans")
    .eq("active", true);

  query = isUuid(token) ? query.eq("id", token) : query.eq("slug", token);

  const { data: row, error } = await query.maybeSingle();

  if (error || !row) {
    return redirectTo("/?card=not-found", request);
  }

  const limited = rateLimit(request, {
    key: rateLimitKey(request, "qr-scan", [row.id]),
    limit: 30,
    windowMs: 60_000,
  });

  if (!limited) {
    await recordCardEngagement(supabase, { card: row, type: "qr_scan", request });
  }

  return redirectTo(publicCardPath(row), request);
}
