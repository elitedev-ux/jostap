import { badRequest, json } from "../../../utils/http.js";
import { requireAdmin, logAdminAction } from "../../../utils/admin.js";
import { getSupabaseAdmin } from "../../../utils/supabase.js";

export async function PATCH(request, { params }) {
  const { user: adminUser, response } = await requireAdmin(request);

  if (response) return response;

  const body = await request.json().catch(() => null);

  if (typeof body?.active !== "boolean") {
    return badRequest("Card active state is required.");
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("cards")
    .update({ active: body.active })
    .eq("id", params.id)
    .select("*")
    .single();

  if (error) throw error;

  await logAdminAction(supabase, adminUser, body.active ? "card.activated" : "card.deactivated", "card", params.id, {
    active: body.active,
  });

  return json({ card: data });
}
