import { badRequest, json } from "../../../utils/http.js";
import { requireAdmin, logAdminAction } from "../../../utils/admin.js";
import { getSupabaseAdmin } from "../../../utils/supabase.js";

export async function PATCH(request, { params }) {
  const { user: adminUser, response } = await requireAdmin(request);

  if (response) return response;

  const body = await request.json().catch(() => null);
  const status = String(body?.status || "").toLowerCase();
  const role = String(body?.role || "").toLowerCase();
  const updates = {};

  if (status) {
    if (!["active", "suspended"].includes(status)) {
      return badRequest("Choose a valid user status.");
    }
    updates.status = status;
  }

  if (role) {
    if (!["user", "admin"].includes(role)) {
      return badRequest("Choose a valid user role.");
    }
    updates.role = role;
  }

  if (!Object.keys(updates).length) {
    return badRequest("No valid user updates provided.");
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", params.id)
    .select("id, first_name, last_name, email, role, status")
    .single();

  if (error) throw error;

  await logAdminAction(supabase, adminUser, "user.updated", "user", params.id, updates);

  return json({ user: data });
}
