import { json, unauthorized } from "../../utils/http.js";
import { getSessionUser } from "../../utils/session.js";
import { getSupabaseAdmin } from "../../utils/supabase.js";
import { accountFromUserAndKyc } from "../../utils/profile.js";

export async function GET(request) {
  const user = await getSessionUser(request);

  if (!user) {
    return unauthorized();
  }

  const supabase = getSupabaseAdmin();
  const [
    { data: profile, error: profileError },
    { data: authUser, error: authUserError },
  ] = await Promise.all([
    supabase
      .from("kyc_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("users")
      .select("password_hash")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  if (profileError || authUserError) {
    throw profileError || authUserError;
  }

  const passwordHash = String(authUser?.password_hash || "");
  const hasPassword = passwordHash.startsWith("scrypt:");

  return json({
    user: {
      ...accountFromUserAndKyc(user, profile),
      auth: {
        hasPassword,
        passwordProvider: hasPassword ? "password" : "google",
      },
    },
  });
}
