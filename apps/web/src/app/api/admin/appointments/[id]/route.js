import { badRequest, json, readJson } from "../../../utils/http.js";
import { requireAdmin, logAdminAction } from "../../../utils/admin.js";
import { getSupabaseAdmin } from "../../../utils/supabase.js";

const STATUSES = new Set(["pending", "approved", "rejected", "cancelled", "completed"]);

export async function PATCH(request, { params }) {
  const { user: adminUser, response } = await requireAdmin(request);
  if (response) return response;

  const body = await readJson(request);
  if (!body) return badRequest("Invalid request body.");

  const status = String(body.status || "").trim().toLowerCase();
  if (!STATUSES.has(status)) return badRequest("Invalid appointment status.");

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("appointments")
    .update({ status })
    .eq("id", params.id)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  if (!data) return json({ error: "Appointment not found." }, { status: 404 });

  await logAdminAction(supabase, adminUser, "appointment.status_updated", "appointment", params.id, { status });

  return json({ appointment: data });
}
