import { json, unauthorized } from "../../../utils/http.js";
import { getSessionUser } from "../../../utils/session.js";
import { getSupabaseAdmin } from "../../../utils/supabase.js";
import { hasGoogleCalendarConfig } from "../../../utils/googleCalendar.js";

export async function GET(request) {
  const user = await getSessionUser(request);
  if (!user) return unauthorized();

  if (!hasGoogleCalendarConfig()) {
    return json({
      configured: false,
      connected: false,
      email: null,
      expiresAt: null,
    });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("google_calendar_connections")
    .select("google_email, expires_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;

  return json({
    configured: true,
    connected: Boolean(data),
    email: data?.google_email || null,
    expiresAt: data?.expires_at || null,
  });
}

export async function DELETE(request) {
  const user = await getSessionUser(request);
  if (!user) return unauthorized();

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("google_calendar_connections")
    .delete()
    .eq("user_id", user.id);

  if (error) throw error;

  return json({ ok: true });
}
