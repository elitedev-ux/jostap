import { badRequest, json, readJson, unauthorized } from "../../../utils/http.js";
import { getSessionUser } from "../../../utils/session.js";
import { getSupabaseAdmin } from "../../../utils/supabase.js";
import { verifyTotp } from "../../../utils/authSecurity.js";

export async function POST(request) {
  const user = await getSessionUser(request);

  if (!user) return unauthorized();

  const body = await readJson(request);
  const code = String(body?.code || "").trim();

  if (!code) return badRequest("Enter your current two-factor code.");

  const supabase = getSupabaseAdmin();
  const { data: record, error } = await supabase
    .from("users")
    .select("id, two_factor_secret")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;

  if (!record?.two_factor_secret || !verifyTotp(record.two_factor_secret, code)) {
    return badRequest("Invalid two-factor code.");
  }

  const { error: updateError } = await supabase
    .from("users")
    .update({
      two_factor_enabled: false,
      two_factor_secret: null,
      two_factor_verified_at: null,
    })
    .eq("id", user.id);

  if (updateError) throw updateError;

  return json({ enabled: false });
}
