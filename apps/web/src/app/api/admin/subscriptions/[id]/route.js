import { badRequest, json } from "../../../utils/http.js";
import { requireAdmin, logAdminAction } from "../../../utils/admin.js";
import { getSupabaseAdmin } from "../../../utils/supabase.js";

export async function PATCH(request, { params }) {
  const { user: adminUser, response } = await requireAdmin(request);

  if (response) return response;

  const body = await request.json().catch(() => null);
  const status = String(body?.status || "").toLowerCase();

  if (!["pending", "active", "past_due", "cancelled"].includes(status)) {
    return badRequest("Choose a valid subscription status.");
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("subscriptions")
    .update({ status })
    .eq("id", params.id)
    .select("*")
    .single();

  if (error) throw error;

  await logAdminAction(supabase, adminUser, "subscription.updated", "subscription", params.id, { status });

  return json({ subscription: data });
}
