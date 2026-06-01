import { json, unauthorized } from "../../../utils/http.js";
import { getSessionUser } from "../../../utils/session.js";
import { getSupabaseAdmin } from "../../../utils/supabase.js";
import { generateTotpSecret, totpUri } from "../../../utils/authSecurity.js";

export async function POST(request) {
  const user = await getSessionUser(request);

  if (!user) return unauthorized();

  const secret = generateTotpSecret();
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("users")
    .update({
      two_factor_secret: secret,
      two_factor_enabled: false,
      two_factor_verified_at: null,
    })
    .eq("id", user.id);

  if (error) throw error;

  return json({
    secret,
    otpauthUrl: totpUri({ email: user.email, secret }),
  });
}
