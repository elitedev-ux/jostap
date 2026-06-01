import { json, unauthorized } from "../utils/http.js";
import { getSessionUser } from "../utils/session.js";
import { getSupabaseAdmin } from "../utils/supabase.js";

export async function GET(request) {
  const user = await getSessionUser(request);

  if (!user) return unauthorized();

  const now = new Date().toISOString();
  const supabase = getSupabaseAdmin();
  const [{ data: announcements, error }, { data: reads, error: readsError }] = await Promise.all([
    supabase
      .from("announcements")
      .select("*")
      .eq("status", "published")
      .lte("published_at", now)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .in("audience", user.role === "admin" ? ["all", "admins"] : ["all", "users"])
      .order("published_at", { ascending: false }),
    supabase
      .from("announcement_reads")
      .select("announcement_id")
      .eq("user_id", user.id),
  ]);

  if (error || readsError) throw error || readsError;

  const readIds = new Set((reads || []).map((read) => read.announcement_id));
  const rows = (announcements || []).map((announcement) => ({
    ...announcement,
    isRead: readIds.has(announcement.id),
  }));

  return json({
    announcements: rows,
    unread: rows.filter((item) => !item.isRead).length,
  });
}
