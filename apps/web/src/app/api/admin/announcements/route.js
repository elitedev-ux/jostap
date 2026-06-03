import { badRequest, json, readJson } from "../../utils/http.js";
import { requireAdmin, logAdminAction } from "../../utils/admin.js";
import { getSupabaseAdmin } from "../../utils/supabase.js";

export async function POST(request) {
  const { user: adminUser, response } = await requireAdmin(request, "announcements:manage");

  if (response) return response;

  const body = await readJson(request);
  if (!body) return badRequest("Invalid request body.");

  const title = String(body.title || "").trim();
  const message = String(body.message || "").trim();
  const type = ["info", "warning", "success", "error"].includes(body.type) ? body.type : "info";
  const audience = ["all", "users", "admins"].includes(body.audience) ? body.audience : "all";

  if (!title || !message) {
    return badRequest("Title and message are required.");
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("announcements")
    .insert({
      admin_user_id: adminUser.id,
      title,
      message,
      type,
      audience,
      status: "published",
      published_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) throw error;

  await logAdminAction(supabase, adminUser, "announcement.published", "announcement", data.id, {
    title,
    audience,
    type,
  });

  return json({ announcement: data }, { status: 201 });
}
